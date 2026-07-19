/** Shared domain models. Amounts are minor units (cents of tUSD). Periods are YYYYMM. */

export interface Employer {
  id: string; // hex hash of employer public key
  name: string;
  registeredAt: number;
  txHash: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  address: string;
}

/** Public, on-chain: only the commitment + tx metadata. */
export interface LedgerCommitment {
  commitment: string;
  leafIndex: number;
  txHash: string;
  blockHeight: number;
  timestamp: number;
}

/** Private, employee device only: the payslip preimage. */
export interface Payslip {
  commitment: string;
  employerId: string;
  employerName: string;
  employeeId: string;
  amount: number;
  period: number;
  salt: string;
  txHash: string;
  timestamp: number;
}

export type RequestStatus = 'open' | 'verified';

export interface VerificationRequest {
  id: string;
  threshold: number;
  period: number;
  label: string;
  status: RequestStatus;
  createdAt: number;
  txHash: string;
}

export interface VerifiedResult {
  requestId: string;
  passed: true; // only successful proofs ever reach the ledger
  txHash: string;
  timestamp: number;
}

export interface PayRun {
  id: string;
  period: number;
  employeeCount: number;
  txHashes: string[];
  timestamp: number;
}

export interface LedgerSnapshot {
  employers: Employer[];
  commitments: LedgerCommitment[];
  requests: VerificationRequest[];
  results: VerifiedResult[];
  merkleRoot: string;
  blockHeight: number;
}

export type ProofStage = 'witness' | 'proving' | 'submitting' | 'done';

export class ProofRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProofRejectedError';
  }
}

export interface PayrollEntry {
  employeeId: string;
  amount: number;
}

/**
 * The single seam between the UI and the chain.
 * MockChainService (DEMO_MODE) and the Midnight-backed service implement
 * the same interface — the UI cannot tell them apart.
 */
export interface ChainService {
  readonly demoMode: boolean;

  getEmployer(): Promise<Employer | null>;
  registerEmployer(name: string): Promise<Employer>;

  getEmployees(): Promise<Employee[]>;
  getVaultBalance(): Promise<number>;
  getPayRuns(): Promise<PayRun[]>;
  runPayroll(
    period: number,
    entries: PayrollEntry[],
    onProgress: (employeeId: string, txHash: string) => void,
  ): Promise<PayRun>;

  /** Private view — only the owning employee's device can produce this. */
  getPayslips(employeeId: string): Promise<Payslip[]>;

  createRequest(threshold: number, period: number, label: string): Promise<VerificationRequest>;
  getRequest(id: string): Promise<VerificationRequest | null>;
  listRequests(): Promise<VerificationRequest[]>;
  getResult(requestId: string): Promise<VerifiedResult | null>;

  /**
   * Generate and submit the ZK income proof.
   * Rejects with ProofRejectedError when no payslip satisfies the request
   * (below threshold / wrong period) — the proof simply cannot be built.
   */
  proveIncome(
    requestId: string,
    employeeId: string,
    onStage: (stage: ProofStage) => void,
  ): Promise<VerifiedResult>;

  getLedger(): Promise<LedgerSnapshot>;

  /** DEMO_MODE only: reset to seeded state. */
  reset(): Promise<void>;
}
