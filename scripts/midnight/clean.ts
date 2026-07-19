import * as fs from 'node:fs';
for (const target of ['contracts/managed', '.midnight-state.json', '.midnight-wallet-state']) {
  fs.rmSync(target, { recursive: true, force: true });
  process.stdout.write(`Removed ${target}\n`);
}
