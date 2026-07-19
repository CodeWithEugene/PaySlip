import { MockChainService } from './mock';
import type {
  ChainService,
  Employee,
  Employer,
  LedgerSnapshot,
  PayRun,
  Payslip,
  PayrollEntry,
  ProofStage,
  VerificationRequest,
  VerifiedResult,
} from './types';

/**
 * Provider selection.
 *
 * DEMO_MODE (default, zero external dependencies) uses MockChainService.
 * Setting VITE_DEMO_MODE=false selects the Midnight-backed service, which
 * requires a running proof server, indexer access, and a funded wallet —
 * see /docker and README "Running against testnet".
 */
const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

class UnconfiguredMidnightService implements ChainService {
  readonly demoMode = false;

  private unavailable(): never {
    throw new Error(
      'Midnight testnet is not configured in this build. Connect Lace and configure the provider in src/services/midnight.ts, or set VITE_DEMO_MODE=true for the complete demo.',
    );
  }

  async getEmployer(): Promise<Employer | null> { return this.unavailable(); }
  async registerEmployer(_name: string): Promise<Employer> { return this.unavailable(); }
  async getEmployees(): Promise<Employee[]> { return this.unavailable(); }
  async getVaultBalance(): Promise<number> { return this.unavailable(); }
  async getPayRuns(): Promise<PayRun[]> { return this.unavailable(); }
  async runPayroll(_period: number, _entries: PayrollEntry[], _onProgress: (employeeId: string, txHash: string) => void): Promise<PayRun> { return this.unavailable(); }
  async getPayslips(_employeeId: string): Promise<Payslip[]> { return this.unavailable(); }
  async createRequest(_threshold: number, _period: number, _label: string): Promise<VerificationRequest> { return this.unavailable(); }
  async getRequest(_id: string): Promise<VerificationRequest | null> { return this.unavailable(); }
  async listRequests(): Promise<VerificationRequest[]> { return this.unavailable(); }
  async getResult(_requestId: string): Promise<VerifiedResult | null> { return this.unavailable(); }
  async proveIncome(_requestId: string, _employeeId: string, _onStage: (stage: ProofStage) => void): Promise<VerifiedResult> { return this.unavailable(); }
  async getLedger(): Promise<LedgerSnapshot> { return this.unavailable(); }
  async reset(): Promise<void> { return this.unavailable(); }
}

let service: ChainService;

if (demoMode) {
  service = new MockChainService();
} else {
  // The app remains usable enough to show friendly retry errors while the
  // documented Midnight.js provider is being wired, rather than crashing at
  // module initialization if a wallet or proof-server setting is absent.
  service = new UnconfiguredMidnightService();
}

export const chain: ChainService = service;
export const IS_DEMO = demoMode;
