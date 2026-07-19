import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { configFor, deploymentFor, getOrCreateSeed, selectedNetwork } from './network.ts';
import { createProviders, createWallet, loadContract } from './runtime.ts';

async function main(): Promise<void> {
  const network = selectedNetwork();
  const deployment = deploymentFor(network);
  if (!deployment) throw new Error(`No ${network} deployment recorded. Run the matching deploy script first.`);
  const { base, compiledContract } = await loadContract();
  const wallet = await createWallet(network, configFor(network), getOrCreateSeed(network));
  try {
    await wallet.wallet.waitForSyncedState();
    const providers = await createProviders(wallet, configFor(network), base);
    await findDeployedContract(providers as any, {
      compiledContract: compiledContract as any,
      contractAddress: deployment.address,
      privateStateId: 'payslip-private-state',
      initialPrivateState: {},
    });
    const state = await providers.publicDataProvider.queryContractState(deployment.address);
    if (!state) throw new Error('The indexer returned no contract state.');
    process.stdout.write(`E2E check passed: ${deployment.address} on ${network}\n`);
  } finally { await wallet.wallet.stop(); }
}

main().catch((error) => { process.stderr.write(`E2E check failed: ${error instanceof Error ? error.message : String(error)}\n`); process.exit(1); });
