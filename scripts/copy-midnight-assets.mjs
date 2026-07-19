import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('contracts/managed/payslip');
const target = resolve('public/midnight');
const trackedContract = resolve('contracts/build/contract');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(resolve(source, 'keys'), resolve(target, 'keys'), { recursive: true });
await cp(resolve(source, 'zkir'), resolve(target, 'zkir'), { recursive: true });
await mkdir(trackedContract, { recursive: true });
await cp(resolve(source, 'contract/index.js'), resolve(trackedContract, 'index.js'));
await cp(resolve(source, 'contract/index.d.ts'), resolve(trackedContract, 'index.d.ts'));
await cp(resolve(source, 'contract/index.js.map'), resolve(trackedContract, 'index.js.map'));
console.log('Copied Midnight ZK assets and tracked contract runtime.');
