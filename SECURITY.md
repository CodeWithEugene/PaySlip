# Security Policy

We take the security of **PaySlip** and the privacy of its users extremely seriously. As a zero-knowledge, privacy-preserving DeFi application built on the **Midnight network**, protecting financial credentials and transactions is our core mission.

Please read this policy to understand our security model, supported versions, and how to report vulnerabilities.

---

## Supported Versions

Only the latest release version of the PaySlip contracts and frontend is supported with security updates.

| Version | Supported | Notes |
| ------- | --------- | ----- |
| v1.x    | ✅ Yes    | Current Hackathon MVP & Testnet version. |
| < v1.0  | ❌ No     | Obsolete/Development branches. |

---

## Cryptographic & ZK Security Model

PaySlip relies on the following components for its security guarantees:
- **Zero-Knowledge Proofs (ZKP):** Circuited logic is written in the Compact language, where private states (salaries, employee identity, salts) remain local to the user's browser/witness generator and are never transmitted to the ledger.
- **Commitment Scheme:** Opaque commitments are recorded on-chain using cryptographically secure hashing. Salt parameters are appended to preimages to prevent brute-force rainbow table attacks on salary amounts.
- **Midnight Protocol:** We inherit the consensus, ledger integrity, and cryptographic primitives of the Midnight partnership chain.

Please note that in the initial release:
1. `DEMO_MODE` bypasses the live ledger using simulated providers for demonstration purposes. Avoid using `DEMO_MODE` configs in production environments.
2. Shielded token value transfers are simulated via proof commitments in the MVP. Production integrations will require full integration with Midnight's shielded token ledger.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** create a public GitHub issue. Instead, report it privately to our security team:

1. **Email:** Send a detailed security report to `security@payslip.network` (mock address for hackathon, please contact team members directly).
2. **Encrypted Communication:** If necessary, request a PGP public key to encrypt your report.
3. **Include Details:** Provide a clear description of the vulnerability, steps to reproduce, a proof of concept (PoC) if available, and the potential impact.

We will acknowledge receipt of your report within **24 hours** and provide status updates as we investigate and resolve the issue.

---

## Disclosure Process

We follow the principles of **Coordinated Vulnerability Disclosure (CVD)**:
- We ask researchers to give us reasonable time to patch the vulnerability before public disclosure.
- Once a patch is developed, tested, and deployed to testnet/mainnet, we will publish a security advisory and credit the researcher.

Thank you for helping us keep the Midnight ecosystem secure!
