import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  WalletFacade, DustWallet, HDWallet, Roles, ShieldedWallet, createKeystore,
  NoOpTransactionHistoryStorage, PublicKey, UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import type { NetworkConfig, NetworkId } from './network.ts';

// Required by the wallet SDK when it syncs GraphQL subscriptions in Node.
// @ts-expect-error Node does not expose browser WebSocket globally.
globalThis.WebSocket = WebSocket;

export type WalletContext = {
  wallet: Awaited<ReturnType<typeof WalletFacade.init>>;
  shieldedSecretKeys: ReturnType<typeof ledger.ZswapSecretKeys.fromSeed>;
  dustSecretKey: ReturnType<typeof ledger.DustSecretKey.fromSeed>;
  unshieldedKeystore: ReturnType<typeof createKeystore>;
};

export async function createWallet(network: NetworkId, config: NetworkConfig, seed: string): Promise<WalletContext> {
  setNetworkId(config.networkId);
  const root = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (root.type !== 'seedOk') throw new Error('MIDNIGHT_WALLET_SEED must be exactly 32 bytes encoded as hex.');
  const derived = root.hdWallet.selectAccount(0).selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust]).deriveKeysAt(0);
  root.hdWallet.clear();
  if (derived.type !== 'keysDerived') throw new Error('Could not derive Midnight wallet keys.');
  const networkId = getNetworkId();
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derived.keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derived.keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(derived.keys[Roles.NightExternal], networkId);
  const wallet = await WalletFacade.init({
    configuration: {
      networkId,
      indexerClientConnection: { indexerHttpUrl: config.indexer, indexerWsUrl: config.indexerWS },
      provingServerUrl: new URL(config.proofServer),
      relayURL: new URL(config.node.replace(/^http/, 'ws')),
      txHistoryStorage: new NoOpTransactionHistoryStorage(),
      costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
    },
    shielded: async (walletConfig) => ShieldedWallet(walletConfig).startWithSecretKeys(shieldedSecretKeys),
    unshielded: async (walletConfig) => UnshieldedWallet(walletConfig).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: async (walletConfig) => DustWallet(walletConfig).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

export async function loadContract() {
  const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/managed/payslip');
  const contractPath = path.join(base, 'contract/index.js');
  if (!fs.existsSync(contractPath)) throw new Error('Contract artifacts missing. Run `npm run compile:contract`.');
  const module = await import(pathToFileURL(contractPath).href);
  const emptyKey = new Uint8Array(32);
  const unavailable = (name: string) => () => { throw new Error(`${name} is unavailable in this deployment-only context.`); };
  const compiledContract = CompiledContract.make('payslip', module.Contract).pipe(
    CompiledContract.withWitnesses({
      employerSecretKey: ({ privateState }: any) => [privateState, privateState.employerSecretKey ?? emptyKey],
      employeeSecretKey: ({ privateState }: any) => [privateState, privateState.employeeSecretKey ?? emptyKey],
      payslipPreimage: unavailable('payslipPreimage'),
      findPayslipPath: unavailable('findPayslipPath'),
    } as any),
    CompiledContract.withCompiledFileAssets(base),
  );
  return { base, module, compiledContract };
}

export async function createProviders(walletContext: WalletContext, config: NetworkConfig, contractDirectory: string) {
  const zkConfigProvider = new NodeZkConfigProvider(contractDirectory);
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'PaySlip-local-development-state-password';
  const accountId = walletContext.unshieldedKeystore.getBech32Address().toString();
  const walletProvider = {
    getCoinPublicKey: () => walletContext.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletContext.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletContext.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletContext.shieldedSecretKeys, dustSecretKey: walletContext.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletContext.wallet.finalizeRecipe(recipe);
    },
    submitTx: (transaction: any) => walletContext.wallet.submitTransaction(transaction) as any,
  };
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'payslip-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

export const unshieldedToken = ledger.unshieldedToken;
