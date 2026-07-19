import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export type NetworkId = 'undeployed' | 'preview' | 'preprod';

export interface NetworkConfig {
  networkId: NetworkId;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  faucet: string | null;
  composeServices: string[];
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  undeployed: {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'ws://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
    faucet: null,
    composeServices: ['node', 'indexer', 'proof-server'],
  },
  preview: {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preview.midnight.network',
    proofServer: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
    faucet: 'https://midnight-tmnight-preview.nethermind.dev',
    composeServices: ['proof-server'],
  },
  preprod: {
    networkId: 'preprod',
    indexer: process.env.MIDNIGHT_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: process.env.MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: process.env.MIDNIGHT_NODE_URL || 'https://rpc.preprod.midnight.network',
    proofServer: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
    faucet: process.env.MIDNIGHT_FAUCET_URL || 'https://midnight-tmnight-preprod.nethermind.dev',
    composeServices: ['proof-server'],
  },
};

export const LOCAL_DEVNET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
const STATE_FILE = '.midnight-state.json';

type State = {
  version: 1;
  activeNetwork: NetworkId;
  wallets: Partial<Record<NetworkId, { seed: string; createdAt: string }>>;
  deployments: Partial<Record<NetworkId, { address: string; deployer: string; deployedAt: string }>>;
};

const isNetwork = (value: string | undefined): value is NetworkId => value === 'undeployed' || value === 'preview' || value === 'preprod';

function loadState(): State | null {
  if (!fs.existsSync(STATE_FILE)) return null;
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as State;
  if (state.version !== 1 || !isNetwork(state.activeNetwork)) throw new Error(`Invalid ${STATE_FILE}; delete it and retry.`);
  return state;
}

function saveState(state: State): void {
  const temporary = `${STATE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(temporary, STATE_FILE);
}

export function selectedNetwork(argv = process.argv): NetworkId {
  const fromFlag = argv.find((entry) => entry.startsWith('--network='))?.split('=')[1]
    ?? (() => { const index = argv.indexOf('--network'); return index >= 0 ? argv[index + 1] : undefined; })()
    ?? process.env.MIDNIGHT_NETWORK
    ?? loadState()?.activeNetwork
    ?? 'undeployed';
  if (!isNetwork(fromFlag)) throw new Error(`Unsupported network "${fromFlag}". Use undeployed, preview, or preprod.`);
  return fromFlag;
}

export function configFor(network = selectedNetwork()): NetworkConfig {
  return NETWORKS[network];
}

export function getOrCreateSeed(network = selectedNetwork()): string {
  if (network === 'undeployed') return LOCAL_DEVNET_SEED;
  if (process.env.MIDNIGHT_WALLET_SEED?.trim()) return process.env.MIDNIGHT_WALLET_SEED.trim();
  const existing = loadState();
  const prior = existing?.wallets[network]?.seed;
  if (prior) return prior;
  const seed = crypto.randomBytes(32).toString('hex');
  const next: State = existing ?? { version: 1, activeNetwork: network, wallets: {}, deployments: {} };
  next.activeNetwork = network;
  next.wallets[network] = { seed, createdAt: new Date().toISOString() };
  saveState(next);
  return seed;
}

export function recordDeployment(network: NetworkId, address: string, deployer: string): void {
  const existing = loadState();
  const next: State = existing ?? { version: 1, activeNetwork: network, wallets: {}, deployments: {} };
  next.activeNetwork = network;
  next.deployments[network] = { address, deployer, deployedAt: new Date().toISOString() };
  saveState(next);
}

export function deploymentFor(network = selectedNetwork()): State['deployments'][NetworkId] | undefined {
  return loadState()?.deployments[network];
}

export function explicitWalletAddress(): string | null {
  const value = process.env.MIDNIGHT_WALLET_ADDRESS?.trim();
  return value && !value.includes('PASTE_YOUR_') ? value : null;
}

function invokedDirectly(): boolean {
  try { return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}

if (invokedDirectly()) {
  const network = selectedNetwork();
  const deployment = deploymentFor(network);
  process.stdout.write(`Active network: ${network}\n`);
  if (deployment) process.stdout.write(`Deployment: ${deployment.address}\n`);
  process.stdout.write(`Config: ${JSON.stringify(configFor(network), null, 2)}\n`);
}
