/** Real Midnight DApp Connector implementation. DEMO_MODE never imports this service. */
// `contracts/build` is the checked-in Compact runtime artifact. Keep the web
// build independent from local-only proof output under `contracts/managed`.
import * as PaySlip from '../../contracts/build/contract/index.js';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { Binding, Proof, SignatureEnabled, Transaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { connectMidnightWallet, walletSnapshot } from './wallet';
import { ProofRejectedError, type ChainService, type Employee, type Employer, type LedgerSnapshot, type PayRun, type Payslip, type PayrollEntry, type ProofStage, type VerificationRequest, type VerifiedResult } from './types';

type PrivateState = { employerSecretKey: number[]; employeeSecretKey: number[]; payslips: Record<string, { employerId: number[]; employeeId: number[]; amount: string; period: string; salt: number[] }> };
const STATE_KEY = 'payslip:midnight-private-state:v1';
const META_KEY = 'payslip:midnight-meta:v1';
const CONTRACT_KEY = 'payslip:midnight-contract-address:v1';
const bytes = (input: number[] | Uint8Array) => new Uint8Array(input);
const hex = (input: Uint8Array) => Array.from(input, (part) => part.toString(16).padStart(2, '0')).join('');
const txRef = (tx: any) => String(tx?.public?.txId ?? tx?.public?.blockHeight ?? `midnight-${Date.now()}`);

function randomKey(): number[] { return Array.from(crypto.getRandomValues(new Uint8Array(32))); }
function privateState(): PrivateState {
  const stored = localStorage.getItem(STATE_KEY);
  if (stored) return JSON.parse(stored) as PrivateState;
  const state = { employerSecretKey: randomKey(), employeeSecretKey: randomKey(), payslips: {} };
  localStorage.setItem(STATE_KEY, JSON.stringify(state)); return state;
}
function savePrivateState(state: PrivateState): void { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
function meta(): { employer?: Employer; payRuns: PayRun[]; requests: VerificationRequest[]; results: VerifiedResult[] } {
  return JSON.parse(localStorage.getItem(META_KEY) ?? '{"payRuns":[],"requests":[],"results":[]}');
}
function saveMeta(next: ReturnType<typeof meta>): void { localStorage.setItem(META_KEY, JSON.stringify(next)); }

const witnesses = {
  employerSecretKey: ({ privateState: state }: any) => [state, bytes(state.employerSecretKey)],
  employeeSecretKey: ({ privateState: state }: any) => [state, bytes(state.employeeSecretKey)],
  payslipPreimage: ({ ledger, privateState: state }: any, requestId: bigint) => {
    const request = ledger.requests.lookup(requestId);
    const slip = (Object.values(state.payslips) as Array<PrivateState['payslips'][string]>).find((candidate) => BigInt(candidate.period) === request.period);
    if (!slip) throw new Error('No private payslip is available for this verification request.');
    return [state, { employerId: bytes(slip.employerId), employeeId: bytes(slip.employeeId), amount: BigInt(slip.amount), period: BigInt(slip.period), salt: bytes(slip.salt) }];
  },
  findPayslipPath: ({ ledger, privateState: state }: any, commitment: Uint8Array) => {
    const path = ledger.payslips.findPathForLeaf(commitment);
    if (!path) throw new Error('The private payslip commitment is not in the public tree.');
    return [state, path];
  },
};

const compiledContract = CompiledContract.make('payslip', PaySlip.Contract).pipe(CompiledContract.withWitnesses(witnesses as any));

export class MidnightChainService implements ChainService {
  readonly demoMode = false;
  private deployed: any | null = null;
  private providers: any | null = null;
  private contractAddress: string | null = null;

  private async contract(): Promise<any> {
    if (this.deployed) return this.deployed;
    const configuredAddress = import.meta.env.VITE_MIDNIGHT_CONTRACT_ADDRESS;
    const address = configuredAddress && !configuredAddress.includes('PASTE_') ? configuredAddress : localStorage.getItem(CONTRACT_KEY);
    const connection = walletSnapshot().api ?? (await connectMidnightWallet()).api;
    if (!connection) throw new Error('Connect a Midnight wallet before interacting with PaySlip.');
    const config = await connection.getConfiguration();
    setNetworkId(config.networkId as any);
    const addresses = await connection.getShieldedAddresses();
    const zk = new FetchZkConfigProvider(window.location.origin + '/midnight', fetch.bind(window));
    const walletProvider = {
      getCoinPublicKey: () => addresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => addresses.shieldedEncryptionPublicKey,
      balanceTx: async (unbound: any) => {
        const result = await connection.balanceUnsealedTransaction(toHex(unbound.serialize()));
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>('signature', 'proof', 'binding', fromHex(result.tx));
      },
    };
    this.providers = {
      privateStateProvider: { setContractAddress() {}, async get() { return privateState(); }, async set(_id: string, state: PrivateState) { savePrivateState(state); }, async remove() {}, async clear() {} },
      publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
      zkConfigProvider: zk,
      proofProvider: httpClientProofProvider(config.proverServerUri ?? import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300', zk),
      walletProvider,
      midnightProvider: { submitTx: async (transaction: any) => { await connection.submitTransaction(toHex(transaction.serialize())); return transaction.identifiers()[0]; } },
    };
    if (address) {
      this.deployed = await findDeployedContract(this.providers, { contractAddress: address, compiledContract: compiledContract as any, privateStateId: 'payslip-private-state', initialPrivateState: privateState() });
      this.contractAddress = address;
    } else {
      // First real employer action deploys through the connected wallet. The wallet, not this
      // app, balances, proves, and signs the deployment transaction.
      this.deployed = await deployContract(this.providers, { compiledContract: compiledContract as any, args: [], privateStateId: 'payslip-private-state', initialPrivateState: privateState() });
      const deployedAddress = String(this.deployed.deployTxData.public.contractAddress);
      this.contractAddress = deployedAddress;
      localStorage.setItem(CONTRACT_KEY, deployedAddress);
    }
    return this.deployed;
  }

  async getEmployer() { return meta().employer ?? null; }
  async registerEmployer(name: string) {
    const contract = await this.contract(); const tx = await contract.callTx.registerEmployer(name);
    const employer: Employer = { id: hex(PaySlip.pureCircuits.employerPublicKey(bytes(privateState().employerSecretKey))), name, registeredAt: Date.now(), txHash: txRef(tx) };
    const next = meta(); next.employer = employer; saveMeta(next); return employer;
  }
  async getEmployees(): Promise<Employee[]> { return [{ id: 'self', name: 'Connected Employee', role: 'Private Credential Holder', address: walletSnapshot().address ?? 'Connect Wallet' }]; }
  async getVaultBalance() { return 0; }
  async getPayRuns() { return meta().payRuns; }
  async runPayroll(period: number, entries: PayrollEntry[], progress: (id: string, tx: string) => void) {
    const employer = await this.getEmployer(); if (!employer) throw new Error('Register your organization before running payroll.');
    const contract = await this.contract(); const state = privateState(); const employeeId = PaySlip.pureCircuits.employeePublicKey(bytes(state.employeeSecretKey)); const employerId = PaySlip.pureCircuits.employerPublicKey(bytes(state.employerSecretKey)); const hashes: string[] = [];
    for (const entry of entries) {
      const slip = { employerId, employeeId, amount: BigInt(entry.amount), period: BigInt(period), salt: crypto.getRandomValues(new Uint8Array(32)) };
      const commitment = PaySlip.pureCircuits.payslipCommitment(slip); const tx = await contract.callTx.postPayslip(commitment); const reference = txRef(tx); hashes.push(reference); progress(entry.employeeId, reference);
      state.payslips[`pending-${period}`] = { employerId: Array.from(employerId), employeeId: Array.from(employeeId), amount: String(entry.amount), period: String(period), salt: Array.from(slip.salt) };
    }
    savePrivateState(state); const run = { id: `RUN-${Date.now()}`, period, employeeCount: entries.length, txHashes: hashes, timestamp: Date.now() }; const next = meta(); next.payRuns.unshift(run); saveMeta(next); return run;
  }
  async getPayslips(_employeeId: string): Promise<Payslip[]> { return Object.entries(privateState().payslips).map(([commitment, value]) => ({ commitment, employerId: hex(bytes(value.employerId)), employerName: meta().employer?.name ?? 'Registered employer', employeeId: 'self', amount: Number(value.amount), period: Number(value.period), salt: hex(bytes(value.salt)), txHash: 'private', timestamp: Date.now() })); }
  async createRequest(threshold: number, period: number, label: string) { const contract = await this.contract(); const tx = await contract.callTx.createRequest(BigInt(threshold), BigInt(period), label); const raw = await this.providers.publicDataProvider.queryContractState(this.contractAddress); const ledger = PaySlip.ledger(raw.data); const request = { id: String(ledger.requestCount), threshold, period, label, status: 'open' as const, createdAt: Date.now(), txHash: txRef(tx) }; const next = meta(); next.requests.unshift(request); saveMeta(next); return request; }
  async getRequest(id: string) { return meta().requests.find((request) => request.id === id) ?? null; }
  async listRequests() { return meta().requests; }
  async getResult(id: string) { return meta().results.find((result) => result.requestId === id) ?? null; }
  async proveIncome(requestId: string, _employee: string, stage: (value: ProofStage) => void) { const request = await this.getRequest(requestId); if (!request) throw new Error('Verification request not found.'); const slip = Object.values(privateState().payslips).find((item) => Number(item.period) === request.period); if (!slip || BigInt(slip.amount) < BigInt(request.threshold)) throw new ProofRejectedError('Proof could not be generated — income is below the requested threshold.'); stage('witness'); stage('proving'); const contract = await this.contract(); stage('submitting'); const tx = await contract.callTx.proveIncome(BigInt(requestId)); const result = { requestId, passed: true as const, txHash: txRef(tx), timestamp: Date.now() }; const next = meta(); next.results.unshift(result); saveMeta(next); stage('done'); return result; }
  async getLedger(): Promise<LedgerSnapshot> { await this.contract(); const raw = await this.providers.publicDataProvider.queryContractState(this.contractAddress); const ledger = PaySlip.ledger(raw.data); const now = Date.now(); return { employers: Array.from(ledger.employers).map(([id, name]: any) => ({ id: hex(id), name, registeredAt: now, txHash: 'indexed' })), commitments: Array.from(ledger.commitmentIndex).map(([commitment]: any, index: number) => ({ commitment: hex(commitment), leafIndex: index, txHash: 'indexed', blockHeight: 0, timestamp: now })), requests: await this.listRequests(), results: meta().results, merkleRoot: String(ledger.payslips.root().field), blockHeight: 0 }; }
  async reset() { throw new Error('Reset is available only in DEMO_MODE.'); }
}
