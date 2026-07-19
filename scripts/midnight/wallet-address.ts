import { configFor, explicitWalletAddress, getOrCreateSeed, selectedNetwork } from './network.ts';
import { createWallet } from './runtime.ts';

async function main(): Promise<void> {
  const configured = explicitWalletAddress();
  if (configured) {
    process.stdout.write(`Configured Midnight wallet address: ${configured}\n`);
    process.stdout.write('This is public configuration only. Lace will sign browser transactions for this address.\n');
    return;
  }
  const network = selectedNetwork();
  const wallet = await createWallet(network, configFor(network), getOrCreateSeed(network));
  try {
    process.stdout.write(`Headless ${network} wallet address: ${wallet.unshieldedKeystore.getBech32Address()}\n`);
    process.stdout.write('Fund this exact address only if you intend to deploy with `npm run deploy:preprod`.\n');
  } finally { await wallet.wallet.stop(); }
}

main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exit(1); });
