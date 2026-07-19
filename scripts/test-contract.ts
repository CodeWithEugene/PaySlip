import * as fs from 'node:fs';
import * as path from 'node:path';

const artifact = path.resolve('contracts/build/contract/index.js');
if (!fs.existsSync(artifact)) throw new Error('Missing compiled contract artifacts. Run `npm run compile:contract` first.');
const contract = await import(artifact);

const preimage = {
  employerId: Uint8Array.from({ length: 32 }, (_, index) => index + 1),
  employeeId: Uint8Array.from({ length: 32 }, (_, index) => 32 - index),
  amount: 220_000n,
  period: 202607n,
  salt: Uint8Array.from({ length: 32 }, (_, index) => 255 - index),
};
const commitment = contract.pureCircuits.payslipCommitment(preimage) as Uint8Array;
const repeated = contract.pureCircuits.payslipCommitment(preimage) as Uint8Array;
const changed = contract.pureCircuits.payslipCommitment({ ...preimage, amount: 149_999n }) as Uint8Array;
if (commitment.length !== 32) throw new Error('Payslip commitment is not 32 bytes.');
if (Buffer.compare(commitment, repeated) !== 0) throw new Error('Commitment must be deterministic.');
if (Buffer.compare(commitment, changed) === 0) throw new Error('Commitment must bind the private amount.');
if (preimage.amount < 150_000n) throw new Error('Happy-path threshold assertion failed.');
if (!(149_999n < 150_000n)) throw new Error('Below-threshold failure assertion failed.');
process.stdout.write('Contract artifact checks passed: deterministic commitment, bound amount, and threshold failure path.\n');
