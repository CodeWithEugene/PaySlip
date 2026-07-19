import { spawnSync } from 'node:child_process';
import { configFor, selectedNetwork } from './network.ts';

function execute(command: string, arguments_: string[]): void {
  const result = spawnSync(command, arguments_, { cwd: process.cwd(), stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const network = selectedNetwork();
const config = configFor(network);
process.stdout.write(`Setting up PaySlip on ${network}\n`);
execute('docker', ['compose', 'up', '-d', '--wait', ...config.composeServices]);
execute('npm', ['run', 'compile:contract']);
execute('npm', ['run', network === 'undeployed' ? 'deploy:local' : 'deploy:preprod']);
