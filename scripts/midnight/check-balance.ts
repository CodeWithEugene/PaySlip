import * as Rx from 'rxjs';
import { configFor, explicitWalletAddress, getOrCreateSeed, selectedNetwork } from './network.ts';
import { createWallet, unshieldedToken } from './runtime.ts';

async function main(): Promise<void> {
  const network = selectedNetwork();
  const supplied = explicitWalletAddress();
  if (supplied) process.stdout.write(`Configured Lace address: ${supplied}\n`);
  const wallet = await createWallet(network, configFor(network), getOrCreateSeed(network));
  try {
    const state = await Rx.firstValueFrom(wallet.wallet.state().pipe(Rx.filter((item) => item.isSynced)));
    process.stdout.write(`Headless address: ${wallet.unshieldedKeystore.getBech32Address()}\n`);
    process.stdout.write(`tNIGHT: ${(state.unshielded.balances[unshieldedToken().raw] ?? 0n).toString()}\n`);
    process.stdout.write(`DUST: ${state.dust.balance(new Date()).toString()}\n`);
  } finally { await wallet.wallet.stop(); }
}

main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exit(1); });
