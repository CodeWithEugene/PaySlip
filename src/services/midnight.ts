/**
 * MidnightChainService — the testnet-backed implementation of ChainService.
 *
 * The Compact contract in /contracts compiles with compact 0.31.1 (language
 * 0.23.0) and produces the artifacts this service consumes:
 *   contracts/build/contract/index.js  — typed circuit bindings
 *   contracts/build/keys/*             — prover/verifier keys per circuit
 *
 * Wiring (per the official example-counter dApp, midnight-js 3.x):
 *
 *   1. Providers:
 *      - indexer:      wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws
 *      - node:         https://rpc.testnet-02.midnight.network
 *      - proof server: http://127.0.0.1:6300  (docker compose -f docker/proof-server.yml up)
 *   2. Wallet: Lace (Midnight edition) via the dApp connector API
 *      (window.midnight.mnLace), or a headless wallet from @midnight-ntwrk/wallet
 *      for the seed script.
 *   3. deployContract / findDeployedContract from @midnight-ntwrk/midnight-js-contracts,
 *      passing witnesses that read the employee's private state store:
 *        employerSecretKey()  → 32 bytes from local secure storage
 *        payslipPreimage(id)  → the stored PayslipPreimage for the request's period
 *        findPayslipPath(c)   → contract.ledger.payslips.findPathForLeaf(c)
 *
 * Each ChainService method maps 1:1 onto a circuit:
 *   registerEmployer → registerEmployer(name)
 *   runPayroll       → postPayslip(commitment) per employee
 *   createRequest    → createRequest(threshold, period, label)
 *   proveIncome      → proveIncome(requestId)   ← the ZK income proof
 *   getLedger        → indexer ledger-state query (public state only)
 *
 * Honest scope note (also in README): the hackathon demo runs DEMO_MODE.
 * The contract is real and compiles to full prover/verifier keys; this
 * network binding is the documented integration seam, not yet exercised
 * against testnet-02.
 */
export {};
