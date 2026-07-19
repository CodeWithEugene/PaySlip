import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum REQUEST_STATUS { open = 0, verified = 1 }

export type PayslipPreimage = { employerId: Uint8Array;
                                employeeId: Uint8Array;
                                amount: bigint;
                                period: bigint;
                                salt: Uint8Array
                              };

export type VerificationRequest = { threshold: bigint;
                                    period: bigint;
                                    label: string;
                                    status: REQUEST_STATUS
                                  };

export type Witnesses<PS> = {
  employerSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  employeeSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  payslipPreimage(context: __compactRuntime.WitnessContext<Ledger, PS>,
                  requestId_0: bigint): [PS, PayslipPreimage];
  findPayslipPath(context: __compactRuntime.WitnessContext<Ledger, PS>,
                  commitment_0: Uint8Array): [PS, { leaf: Uint8Array,
                                                    path: { sibling: { field: bigint
                                                                     },
                                                            goes_left: boolean
                                                          }[]
                                                  }];
}

export type ImpureCircuits<PS> = {
  registerEmployer(context: __compactRuntime.CircuitContext<PS>, name_0: string): __compactRuntime.CircuitResults<PS, []>;
  postPayslip(context: __compactRuntime.CircuitContext<PS>,
              commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createRequest(context: __compactRuntime.CircuitContext<PS>,
                threshold_0: bigint,
                period_0: bigint,
                label_0: string): __compactRuntime.CircuitResults<PS, bigint>;
  proveIncome(context: __compactRuntime.CircuitContext<PS>, requestId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerEmployer(context: __compactRuntime.CircuitContext<PS>, name_0: string): __compactRuntime.CircuitResults<PS, []>;
  postPayslip(context: __compactRuntime.CircuitContext<PS>,
              commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createRequest(context: __compactRuntime.CircuitContext<PS>,
                threshold_0: bigint,
                period_0: bigint,
                label_0: string): __compactRuntime.CircuitResults<PS, bigint>;
  proveIncome(context: __compactRuntime.CircuitContext<PS>, requestId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  employerPublicKey(sk_0: Uint8Array): Uint8Array;
  employeePublicKey(sk_0: Uint8Array): Uint8Array;
  payslipCommitment(slip_0: PayslipPreimage): Uint8Array;
}

export type Circuits<PS> = {
  employerPublicKey(context: __compactRuntime.CircuitContext<PS>,
                    sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  employeePublicKey(context: __compactRuntime.CircuitContext<PS>,
                    sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  payslipCommitment(context: __compactRuntime.CircuitContext<PS>,
                    slip_0: PayslipPreimage): __compactRuntime.CircuitResults<PS, Uint8Array>;
  registerEmployer(context: __compactRuntime.CircuitContext<PS>, name_0: string): __compactRuntime.CircuitResults<PS, []>;
  postPayslip(context: __compactRuntime.CircuitContext<PS>,
              commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createRequest(context: __compactRuntime.CircuitContext<PS>,
                threshold_0: bigint,
                period_0: bigint,
                label_0: string): __compactRuntime.CircuitResults<PS, bigint>;
  proveIncome(context: __compactRuntime.CircuitContext<PS>, requestId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  employers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): string;
    [Symbol.iterator](): Iterator<[Uint8Array, string]>
  };
  payslips: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  commitmentIndex: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly requestCount: bigint;
  requests: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): VerificationRequest;
    [Symbol.iterator](): Iterator<[bigint, VerificationRequest]>
  };
  results: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): boolean;
    [Symbol.iterator](): Iterator<[bigint, boolean]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
