import {
  ProofRejectedError,
  type ChainService,
  type Employee,
  type Employer,
  type LedgerCommitment,
  type LedgerSnapshot,
  type PayRun,
  type Payslip,
  type PayrollEntry,
  type ProofStage,
  type VerificationRequest,
  type VerifiedResult,
} from './types';

/**
 * DEMO_MODE provider. Deterministic data, realistic latencies, real SHA-256
 * commitments — the same information flow as the Midnight contract, minus
 * the network. State persists to localStorage so a demo survives reloads.
 */

const STORE_KEY = 'payslip.demo.v1';

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number) => base + Math.random() * base * 0.5;

interface DemoState {
  employer: Employer | null;
  vaultBalance: number;
  payRuns: PayRun[];
  commitments: LedgerCommitment[];
  payslips: Payslip[]; // "private device state" for all demo personas
  requests: VerificationRequest[];
  results: VerifiedResult[];
  blockHeight: number;
  counter: number;
}

export const DEMO_EMPLOYEES: Employee[] = [
  { id: 'emp-ada', name: 'Ada Okafor', role: 'Senior Engineer', address: 'mn_shield-addr_test1qz3k…x7ada' },
  { id: 'emp-grace', name: 'Grace Lindqvist', role: 'Product Designer', address: 'mn_shield-addr_test1qr8w…m2gra' },
  { id: 'emp-kofi', name: 'Kofi Mensah', role: 'Support Lead', address: 'mn_shield-addr_test1qp5t…k9kof' },
];

const DEMO_SALARIES: Record<string, number> = {
  'emp-ada': 412500, // $4,125.00
  'emp-grace': 318000, // $3,180.00
  'emp-kofi': 129500, // $1,295.00 — below a $1,500 threshold, demos the failure path
};

function emptyState(): DemoState {
  return {
    employer: null,
    vaultBalance: 2500000, // $25,000.00 funded vault
    payRuns: [],
    commitments: [],
    payslips: [],
    requests: [],
    results: [],
    blockHeight: 1204,
    counter: 0,
  };
}

export class MockChainService implements ChainService {
  readonly demoMode = true;
  private state: DemoState;
  private seeded: Promise<void>;

  constructor() {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      this.state = JSON.parse(raw) as DemoState;
      this.seeded = Promise.resolve();
    } else {
      this.state = emptyState();
      this.seeded = this.seed();
    }
  }

  private save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
  }

  private async txHash(): Promise<string> {
    this.state.counter += 1;
    this.state.blockHeight += 1;
    return '0x' + (await sha256Hex(`tx:${this.state.counter}:payslip-demo`));
  }

  /** Seed: registered employer + two completed pay runs (June & July 2026). */
  private async seed() {
    const employer: Employer = {
      id: (await sha256Hex('employer:acme-robotics')).slice(0, 64),
      name: 'Acme Robotics Ltd',
      registeredAt: Date.parse('2026-06-01T09:12:00Z'),
      txHash: '0x' + (await sha256Hex('tx:register:acme')),
    };
    this.state.employer = employer;
    for (const period of [202606, 202607]) {
      const txHashes: string[] = [];
      for (const emp of DEMO_EMPLOYEES) {
        const amount = DEMO_SALARIES[emp.id];
        const salt = (await sha256Hex(`salt:${emp.id}:${period}`)).slice(0, 32);
        const commitment = '0x' + (await sha256Hex(`slip:${employer.id}:${emp.id}:${amount}:${period}:${salt}`));
        const tx = await this.txHash();
        txHashes.push(tx);
        this.state.commitments.push({
          commitment,
          leafIndex: this.state.commitments.length,
          txHash: tx,
          blockHeight: this.state.blockHeight,
          timestamp: Date.parse(`2026-${period === 202606 ? '06' : '07'}-28T16:00:00Z`),
        });
        this.state.payslips.push({
          commitment,
          employerId: employer.id,
          employerName: employer.name,
          employeeId: emp.id,
          amount,
          period,
          salt,
          txHash: tx,
          timestamp: Date.parse(`2026-${period === 202606 ? '06' : '07'}-28T16:00:00Z`),
        });
        this.state.vaultBalance -= amount;
      }
      this.state.payRuns.push({
        id: `run-${period}`,
        period,
        employeeCount: DEMO_EMPLOYEES.length,
        txHashes,
        timestamp: Date.parse(`2026-${period === 202606 ? '06' : '07'}-28T16:00:00Z`),
      });
    }
    // One open landlord request ready for the demo.
    this.state.requests.push({
      id: 'REQ-1042',
      threshold: 150000,
      period: 202607,
      label: 'Apartment 4B application — Northgate Lettings',
      status: 'open',
      createdAt: Date.parse('2026-07-18T10:30:00Z'),
      txHash: '0x' + (await sha256Hex('tx:req:1042')),
    });
    this.save();
  }

  private async ready() {
    await this.seeded;
  }

  async getEmployer() {
    await this.ready();
    await sleep(jitter(350));
    return this.state.employer;
  }

  async registerEmployer(name: string) {
    await this.ready();
    await sleep(jitter(1200));
    const employer: Employer = {
      id: (await sha256Hex(`employer:${name}`)).slice(0, 64),
      name,
      registeredAt: Date.now(),
      txHash: await this.txHash(),
    };
    this.state.employer = employer;
    this.save();
    return employer;
  }

  async getEmployees() {
    await this.ready();
    await sleep(jitter(250));
    return DEMO_EMPLOYEES;
  }

  async getVaultBalance() {
    await this.ready();
    await sleep(jitter(300));
    return this.state.vaultBalance;
  }

  async getPayRuns() {
    await this.ready();
    await sleep(jitter(350));
    return [...this.state.payRuns].sort((a, b) => b.timestamp - a.timestamp);
  }

  async runPayroll(
    period: number,
    entries: PayrollEntry[],
    onProgress: (employeeId: string, txHash: string) => void,
  ) {
    await this.ready();
    if (!this.state.employer) throw new Error('Employer is not registered on-chain yet.');
    const total = entries.reduce((s, e) => s + e.amount, 0);
    if (total > this.state.vaultBalance) {
      throw new Error('Payroll vault balance is insufficient for this run.');
    }
    const employer = this.state.employer;
    const txHashes: string[] = [];
    for (const entry of entries) {
      await sleep(jitter(1100)); // commitment build + shielded transfer per employee
      const emp = DEMO_EMPLOYEES.find((e) => e.id === entry.employeeId);
      if (!emp) throw new Error(`Unknown employee ${entry.employeeId}`);
      const salt = (await sha256Hex(`salt:${emp.id}:${period}:${Date.now()}`)).slice(0, 32);
      const commitment = '0x' + (await sha256Hex(`slip:${employer.id}:${emp.id}:${entry.amount}:${period}:${salt}`));
      const tx = await this.txHash();
      txHashes.push(tx);
      const timestamp = Date.now();
      this.state.commitments.push({
        commitment,
        leafIndex: this.state.commitments.length,
        txHash: tx,
        blockHeight: this.state.blockHeight,
        timestamp,
      });
      this.state.payslips.push({
        commitment,
        employerId: employer.id,
        employerName: employer.name,
        employeeId: emp.id,
        amount: entry.amount,
        period,
        salt,
        txHash: tx,
        timestamp,
      });
      this.state.vaultBalance -= entry.amount;
      onProgress(entry.employeeId, tx);
    }
    const run: PayRun = {
      id: `run-${period}-${this.state.counter}`,
      period,
      employeeCount: entries.length,
      txHashes,
      timestamp: Date.now(),
    };
    this.state.payRuns.push(run);
    this.save();
    return run;
  }

  async getPayslips(employeeId: string) {
    await this.ready();
    await sleep(jitter(400));
    return this.state.payslips
      .filter((p) => p.employeeId === employeeId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async createRequest(threshold: number, period: number, label: string) {
    await this.ready();
    await sleep(jitter(900));
    const request: VerificationRequest = {
      id: `REQ-${1042 + this.state.requests.length}`,
      threshold,
      period,
      label,
      status: 'open',
      createdAt: Date.now(),
      txHash: await this.txHash(),
    };
    this.state.requests.push(request);
    this.save();
    return request;
  }

  async getRequest(id: string) {
    await this.ready();
    await sleep(jitter(250));
    return this.state.requests.find((r) => r.id.toLowerCase() === id.toLowerCase()) ?? null;
  }

  async listRequests() {
    await this.ready();
    await sleep(jitter(300));
    return [...this.state.requests].sort((a, b) => b.createdAt - a.createdAt);
  }

  async getResult(requestId: string) {
    await this.ready();
    await sleep(jitter(250));
    return this.state.results.find((r) => r.requestId === requestId) ?? null;
  }

  async proveIncome(
    requestId: string,
    employeeId: string,
    onStage: (stage: ProofStage) => void,
  ) {
    await this.ready();
    const request = this.state.requests.find((r) => r.id === requestId);
    if (!request) throw new Error(`Verification request ${requestId} was not found on-chain.`);
    if (request.status === 'verified') throw new Error('This request has already been settled.');

    onStage('witness');
    await sleep(jitter(1400)); // find payslip preimage + merkle path locally

    const candidate = this.state.payslips.find(
      (p) => p.employeeId === employeeId && p.period === request.period,
    );

    onStage('proving');
    await sleep(jitter(3800)); // real ZK proofs take seconds — modelled honestly

    if (!candidate || candidate.amount < request.threshold) {
      // The circuit's `assert(amount >= threshold)` makes the proof unbuildable.
      throw new ProofRejectedError(
        candidate
          ? 'Proof could not be generated — income for this period is below the requested threshold. Nothing was revealed to the verifier.'
          : 'Proof could not be generated — no payslip exists for the requested pay period.',
      );
    }

    onStage('submitting');
    await sleep(jitter(1600));

    const result: VerifiedResult = {
      requestId,
      passed: true,
      txHash: await this.txHash(),
      timestamp: Date.now(),
    };
    this.state.results.push(result);
    request.status = 'verified';
    this.save();
    onStage('done');
    return result;
  }

  async getLedger(): Promise<LedgerSnapshot> {
    await this.ready();
    await sleep(jitter(450));
    const root =
      '0x' + (await sha256Hex(`root:${this.state.commitments.map((c) => c.commitment).join(',')}`));
    return {
      employers: this.state.employer ? [this.state.employer] : [],
      commitments: [...this.state.commitments].sort((a, b) => b.timestamp - a.timestamp),
      requests: [...this.state.requests].sort((a, b) => b.createdAt - a.createdAt),
      results: [...this.state.results].sort((a, b) => b.timestamp - a.timestamp),
      merkleRoot: root,
      blockHeight: this.state.blockHeight,
    };
  }

  async reset() {
    localStorage.removeItem(STORE_KEY);
    this.state = emptyState();
    this.seeded = this.seed();
    await this.seeded;
  }
}
