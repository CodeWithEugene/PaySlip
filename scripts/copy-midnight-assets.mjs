import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('contracts/managed/payslip');
const target = resolve('public/midnight');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(resolve(source, 'keys'), resolve(target, 'keys'), { recursive: true });
await cp(resolve(source, 'zkir'), resolve(target, 'zkir'), { recursive: true });
console.log('Copied Midnight ZK assets to public/midnight.');
