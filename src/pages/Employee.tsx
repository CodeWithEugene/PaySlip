import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { QRCodeSVG } from 'qrcode.react';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUserOutlined';
import WalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PayslipCard from '../components/PayslipCard';
import ProofProgress from '../components/ProofProgress';
import EmptyState from '../components/EmptyState';
import HashChip from '../components/HashChip';
import { useToast } from '../components/ToastContext';
import { chain } from '../services/chain';
import { DEMO_EMPLOYEES } from '../services/mock';
import { ProofRejectedError, type Payslip, type ProofStage, type VerificationRequest, type VerifiedResult } from '../services/types';
import { formatCurrency, formatPeriod } from '../utils/format';

type ProofPhase = 'pick' | 'running' | 'success' | 'failed';

export default function Employee() {
  const toast = useToast();
  const [personaId, setPersonaId] = useState('emp-ada');
  const persona = DEMO_EMPLOYEES.find((e) => e.id === personaId)!;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [openRequests, setOpenRequests] = useState<VerificationRequest[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [phase, setPhase] = useState<ProofPhase>('pick');
  const [requestId, setRequestId] = useState('');
  const [stage, setStage] = useState<ProofStage>('witness');
  const [proofError, setProofError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifiedResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [slips, requests] = await Promise.all([
        chain.getPayslips(personaId),
        chain.listRequests(),
      ]);
      setPayslips(slips);
      setOpenRequests(requests.filter((r) => r.status === 'open'));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load wallet state.');
    } finally {
      setLoading(false);
    }
  }, [personaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const history = useMemo(
    () => [...payslips].sort((a, b) => a.period - b.period),
    [payslips],
  );
  const maxAmount = Math.max(...history.map((p) => p.amount), 1);

  const openProofDialog = () => {
    setPhase('pick');
    setRequestId(openRequests[0]?.id ?? '');
    setProofError(null);
    setResult(null);
    setDialogOpen(true);
  };

  const generate = async () => {
    setPhase('running');
    setStage('witness');
    setProofError(null);
    try {
      const res = await chain.proveIncome(requestId.trim(), personaId, setStage);
      setResult(res);
      setPhase('success');
      toast('Income proof verified on-chain.');
      void load();
    } catch (e) {
      setProofError(
        e instanceof ProofRejectedError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Proof generation failed.',
      );
      setPhase('failed');
    }
  };

  const verifyUrl = result ? `${window.location.origin}/verify/${result.requestId}` : '';

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: 5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="overline" color="primary.light">
            Employee Wallet
          </Typography>
          <Typography variant="h2">{persona.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {persona.role} · private state on this device
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <TextField
            select
            size="small"
            label="Demo persona"
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            sx={{ minWidth: 190 }}
          >
            {DEMO_EMPLOYEES.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            size="large"
            startIcon={<VerifiedUserIcon />}
            onClick={openProofDialog}
            disabled={loading || payslips.length === 0}
          >
            Generate Income Proof
          </Button>
        </Stack>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => void load()}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={140} />
              <Skeleton variant="rounded" height={140} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={220} />
          </Grid>
        </Grid>
      ) : payslips.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title="No Payslips Yet"
          body="Ask your employer to run payroll — each private payment lands here as a payslip credential. In DEMO_MODE, head to the Employer dashboard and run a pay cycle."
          action={
            <Button component={RouterLink} to="/employer" variant="contained">
              Go To Employer Dashboard
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h4" sx={{ mb: 1.5 }}>
              Payslips ({payslips.length})
            </Typography>
            <Stack spacing={2}>
              {payslips.map((p) => (
                <PayslipCard key={p.commitment} payslip={p} ownerView />
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h4" sx={{ mb: 1.5 }}>
              Income History
            </Typography>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  {history.map((p) => (
                    <Box key={p.commitment}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatPeriod(p.period)}
                        </Typography>
                        <Typography variant="caption" className="tnum" sx={{ fontWeight: 600 }}>
                          {formatCurrency(p.amount)}
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 8, borderRadius: 99, bgcolor: 'action.hover', overflow: 'hidden' }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${(p.amount / maxAmount) * 100}%`,
                            borderRadius: 99,
                            bgcolor: 'primary.main',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                  Visible only in your wallet. The chain holds commitments, not this chart.
                </Typography>
              </CardContent>
            </Card>

            {openRequests.length > 0 && (
              <>
                <Typography variant="h4" sx={{ mt: 3, mb: 1.5 }}>
                  Open Requests
                </Typography>
                <Stack spacing={1.5}>
                  {openRequests.map((r) => (
                    <Card key={r.id}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {r.id}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {r.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className="tnum">
                          Prove income ≥ <strong>{formatCurrency(r.threshold)}</strong> for {formatPeriod(r.period)}
                        </Typography>
                        <Button size="small" sx={{ mt: 1.5, ml: -1 }} onClick={() => { setRequestId(r.id); setPhase('pick'); setProofError(null); setResult(null); setDialogOpen(true); }}>
                          Answer With a ZK Proof →
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}
          </Grid>
        </Grid>
      )}

      {/* Proof dialog */}
      <Dialog open={dialogOpen} onClose={phase === 'running' ? undefined : () => setDialogOpen(false)} fullWidth maxWidth="sm">
        {phase === 'pick' && (
          <>
            <DialogTitle>Generate Income Proof</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Pick or paste a verification request. Your payslips never leave this device — only a
                zero-knowledge proof is submitted.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select={openRequests.length > 0}
                  label="Verification request"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  placeholder="REQ-1042"
                  fullWidth
                >
                  {openRequests.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.id} — {r.label} (≥ {formatCurrency(r.threshold)}, {formatPeriod(r.period)})
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => void generate()} disabled={!requestId.trim()}>
                Generate Proof
              </Button>
            </DialogActions>
          </>
        )}

        {phase === 'running' && (
          <>
            <DialogTitle>Proving in Zero Knowledge…</DialogTitle>
            <DialogContent sx={{ pb: 4 }}>
              <ProofProgress stage={stage} />
            </DialogContent>
          </>
        )}

        {phase === 'success' && result && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" /> Proof Verified On-Chain
            </DialogTitle>
            <DialogContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, lineHeight: 0 }}>
                  <QRCodeSVG value={verifyUrl} size={116} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    The verifier can now see the green check at:
                  </Typography>
                  <HashChip value={verifyUrl} chars={14} />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                    They learn exactly one bit: income ≥ threshold. Your salary, employer, and history
                    stay yours.
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button component={RouterLink} to={`/verify/${result.requestId}`} variant="contained" onClick={() => setDialogOpen(false)}>
                View Verifier Result
              </Button>
            </DialogActions>
          </>
        )}

        {phase === 'failed' && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorOutlineIcon color="error" /> Proof Could Not Be Generated
            </DialogTitle>
            <DialogContent>
              <Alert severity="error" sx={{ mb: 2 }}>{proofError}</Alert>
              <Typography variant="body2" color="text.secondary">
                This is zero-knowledge working as intended: the circuit refuses to produce a proof for a
                false statement, and the failed attempt discloses nothing on-chain.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="contained" onClick={() => setPhase('pick')}>
                Try Another Request
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
