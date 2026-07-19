# Contributing to PaySlip

Thank you for your interest in contributing to **PaySlip**! We welcome contributions to help make on-chain payroll more private, secure, and accessible. As a privacy-first dApp built on the **Midnight network**, there are a few specific guidelines and workflows to follow to ensure the integrity of the zero-knowledge circuits and smart contracts.

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (detailed in the repository, maintaining a welcoming, inclusive, and professional environment).

---

## Getting Started

### Prerequisites
Before you start, make sure you have the following installed on your machine:
- **Node.js** (v18 or higher) and `npm`
- **Docker** and **Docker Compose** (for running the Midnight proof server)
- **Compact Compiler** (for compiling the zero-knowledge contracts)
  - Install via: `curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh`

### Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/CodeWithEugene/PaySlip.git
   cd PaySlip
   ```

2. **Smart Contract Development:**
   The Compact contract lives in `contracts/payslip.compact`.
   - Update your compiler to the pinned version:
     ```bash
     compact update 0.31.1
     ```
   - Compile the contracts and generate ZK circuits/prover keys:
     ```bash
     compact compile contracts/payslip.compact contracts/build
     ```

3. **Frontend Development:**
   The frontend is a React + TypeScript + Vite application styled with custom Material UI (MUI v7).
   - Install dependencies from the repository root:
     ```bash
     npm install
     ```
   - Create your environment file from the template:
     ```bash
     cp .env.example .env
     ```
   - Run the development server:
     ```bash
     npm run dev
     ```

---

## Development Workflow

### Git & Branching Strategy
We follow a structured branch naming convention:
- `feature/description` for new features or enhancements.
- `bugfix/description` for bug fixes.
- `docs/description` for documentation improvements.

### Commit Guidelines
We use **Conventional Commits** to keep our git history clean and readable. Please format your commit messages as:
- `feat: add income proof verification page`
- `fix: resolve ZK proof generation timeout`
- `docs: update quickstart instructions in README`
- `refactor: clean up MUI style overrides`

---

## Coding Standards & Quality Bar

### 1. Zero-Knowledge Circuit Security
- Keep all private/sensitive data in the **witness state**. Only publish non-reversible Merkle roots or opaque commitments.
- Ensure that circuits are fully constrained. Every state transition must be mathematically verifiable in the circuit.
- If you change the Compact contract, make sure to compile it and update the generated TypeScript bindings and prover/verifier keys in `contracts/build/`.

### 2. Frontend & Styling Conventions
- **Theming:** All styling must go through the custom MUI theme (`src/theme/theme.ts`). **Do not use inline hex colors or raw MUI color constants** directly in components.
- **Async UX:** Ensure all asynchronous actions (especially slow ZK proof generation) handle all states: loading (disabled buttons + progress indicators), success (toasts/animations), and error (user-friendly messages).
- **Responsive Design:** Validate that your pages look correct at 375px (mobile), 768px (tablet), and 1280px+ (desktop).
- **Demo Mode:** Ensure that any new feature has a fully functional fallback or mock implementation in `DEMO_MODE` to allow zero-dependency testing.

---

## Submitting Pull Requests

1. Create a branch from `main`.
2. Implement your changes, following styling and ZK contract guidelines.
3. Verify that the app compiles cleanly with no typescript errors:
   ```bash
   npm run build
   ```
4. Run standard linters and formatters.
5. Submit a Pull Request with a clear description of the problem solved, testing performed, and screenshots of UI modifications.

Thank you for contributing!
