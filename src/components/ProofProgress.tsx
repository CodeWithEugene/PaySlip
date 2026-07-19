import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import type { ProofStage } from '../services/types';

const STAGES: { key: ProofStage; label: string; detail: string }[] = [
  { key: 'witness', label: 'Building witness', detail: 'Opening your payslip preimage and Merkle path locally — nothing leaves your device.' },
  { key: 'proving', label: 'Generating ZK proof', detail: 'The proof server is proving amount ≥ threshold inside the circuit. Real proofs take a few seconds.' },
  { key: 'submitting', label: 'Submitting on-chain', detail: 'Posting the proof to the Midnight ledger. The chain will record exactly one bit.' },
];

export default function ProofProgress({ stage }: { stage: ProofStage }) {
  const activeIndex = STAGES.findIndex((s) => s.key === stage);
  const current = STAGES[activeIndex] ?? STAGES[STAGES.length - 1];
  const done = stage === 'done';

  return (
    <Box>
      <Stepper activeStep={done ? STAGES.length : activeIndex} alternativeLabel sx={{ mb: 3 }}>
        {STAGES.map((s) => (
          <Step key={s.key}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {!done && (
        <Stack spacing={1.5} alignItems="center">
          <LinearProgress sx={{ width: '100%', maxWidth: 420 }} />
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 460 }}>
            {current.detail}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
