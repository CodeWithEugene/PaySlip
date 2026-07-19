import * as Rx from 'rxjs';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { configFor, getOrCreateSeed, recordDeployment, selectedNetwork } from './network.ts';
import { createProviders, createWallet, loadContract, unshieldedToken } from './runtime.ts';

async function waitForProofServer(url: string): Promise<void> {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try { await fetch(url, { signal: AbortSignal.timeout(3_000) }); return; } catch { /* keep polling */ }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`Proof server did not become ready at ${url}. Run docker compose up -d proof-server.`);
}

async function main(): Promise<void> {
  const network = selectedNetwork();
  const config = configFor(network);
  const seed = getOrCreateSeed(network);
  const { base, compiledContract } = await loadContract();
  await waitForProofServer(config.proofServer);
  const wallet = await createWallet(network, config, seed);
  try {
    const state = await wallet.wallet.waitForSyncedState();
    const address = wallet.unshieldedKeystore.getBech32Address().toString();
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    process.stdout.write(`Wallet: ${address}\nBalance: ${balance.toString()} tNIGHT\n`);
    if (network !== 'undeployed' && balance === 0n) {
      throw new Error(`This script generated a separate headless wallet. Fund ${address} via the faucet, or deploy through Lace in the browser. A public address alone cannot authorize a headless deployment.`);
    }
    const dust = await Rx.firstValueFrom(wallet.wallet.state().pipe(Rx.filter((item) => item.isSynced)));
    if (dust.dust.balance(new Date()) === 0n) {
      const inputs = dust.unshielded.availableCoins.filter((coin: any) => !coin.meta?.registeredForDustGeneration);
      if (inputs.length) {
        const recipe = await wallet.wallet.registerNightUtxosForDustGeneration(inputs, wallet.unshieldedKeystore.getPublicKey(), (payload) => wallet.unshieldedKeystore.signData(payload));
        await wallet.wallet.submitTransaction(await wallet.wallet.finalizeRecipe(recipe));
      }
      await Rx.firstValueFrom(wallet.wallet.state().pipe(Rx.filter((item) => item.isSynced && item.dust.balance(new Date()) > 0n)));
    }
    const providers = await createProviders(wallet, config, base);
    const deployed = await deployContract(providers as any, {
      compiledContract: compiledContract as any,
      args: [],
      privateStateId: 'payslip-private-state',
      initialPrivateState: {},
    });
    const contractAddress = deployed.deployTxData.public.contractAddress;
    recordDeployment(network, contractAddress, address);
    process.stdout.write(`\nPaySlip deployed\nNetwork: ${network}\nContract: ${contractAddress}\n`);
  } finally { await wallet.wallet.stop(); }
}

main().catch((error) => { process.stderr.write(`Deployment failed: ${error instanceof Error ? error.message : String(error)}\n`); process.exit(1); });
