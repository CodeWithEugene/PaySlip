import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrowOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import HashChip from '../components/HashChip';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/ToastContext';
import { chain } from '../services/chain';
import type { Employee, Employer as EmployerModel, PayRun } from '../services/types';
import { currentPeriod, formatCurrency, formatPeriod, formatTimestamp } from '../utils/format';

const DEFAULT_AMOUNTS: Record<string, number> = {
  'emp-ada': 412500,
  'emp-grace': 318000,
  'emp-kofi': 129500,
};

type RunPhase = 'review' | 'running' | 'success';

export default function Employer() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employer, setEmployer] = useState<EmployerModel | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vault, setVault] = useState<number>(0);
  const [payRuns, setPayRuns] = useState<PayRun[]>([]);

  const [registering, setRegistering] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [runPhase, setRunPhase] = useState<RunPhase>('review');
  const [paidIds, setPaidIds] = useState<string[]>([]);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<PayRun | null>(null);

  const period = useMemo(() => {
    if (payRuns.length === 0) return currentPeriod();
    const lastRunPeriod = payRuns[0].period;
    const y = Math.floor(lastRunPeriod / 100);
    const m = lastRunPeriod % 100;
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    return nextY * 100 + nextM;
  }, [payRuns]);

  const totalPay = useMemo(
    () => employees.reduce((s, e) => s + (DEFAULT_AMOUNTS[e.id] ?? 0), 0),
    [employees],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [emp, emps, bal, runs] = await Promise.all([
        chain.getEmployer(),
        chain.getEmployees(),
        chain.getVaultBalance(),
        chain.getPayRuns(),
      ]);
      setEmployer(emp);
      setEmployees(emps);
      setVault(bal);
      setPayRuns(runs);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load employer state.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const register = async () => {
    setRegistering(true);
    try {
      const emp = await chain.registerEmployer('Acme Robotics Ltd');
      setEmployer(emp);
      toast('Organization registered on-chain.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Registration failed.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const startRun = () => {
    setRunPhase('review');
    setPaidIds([]);
    setRunError(null);
    setDialogOpen(true);
  };

  const confirmRun = async () => {
    setRunPhase('running');
    setRunError(null);
    try {
      const run = await chain.runPayroll(
        period,
        employees.map((e) => ({ employeeId: e.id, amount: DEFAULT_AMOUNTS[e.id] ?? 0 })),
        (employeeId) => setPaidIds((prev) => [...prev, employeeId]),
      );
      setLastRun(run);
      setRunPhase('success');
      toast(`Payroll for ${formatPeriod(period)} settled — ${run.employeeCount} employees paid privately.`);
      void load();
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Payroll run failed.');
      setRunPhase('review');
    }
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: 5 }}>
        <Skeleton width={280} height={44} sx={{ mb: 3 }} />
        <Grid container spacing={2.5}>
          {[0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rounded" height={110} />
            </Grid>
          ))}
          <Grid size={12}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: 5 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void load()}>Retry</Button>}>
          {loadError}
        </Alert>
      </Container>
    );
  }

  if (!employer) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <EmptyState
          icon={<ReceiptLongIcon />}
          title="No Organization Registered"
          body="Register your organization on-chain to open a payroll vault. Only your org name and a hashed public key become public — never your payroll."
          action={
            <Button variant="contained" onClick={() => void register()} disabled={registering}
              startIcon={registering ? <CircularProgress size={16} color="inherit" /> : undefined}>
              {registering ? 'Registering On-Chain…' : 'Register Acme Robotics Ltd'}
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: 5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="overline" color="primary.light">
            Employer Dashboard
          </Typography>
          <Typography variant="h2">{employer.name}</Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} onClick={startRun}>
          Run Payroll · {formatPeriod(period)}
        </Button>
      </Stack>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Vault Balance
              </Typography>
              <Typography variant="h3" className="tnum" sx={{ color: 'primary.light' }}>
                {formatCurrency(vault)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Shielded tUSD — balance visible only to you
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Employees
              </Typography>
              <Typography variant="h3" className="tnum">{employees.length}</Typography>
              <Typography variant="caption" color="text.secondary">
                Next run {formatCurrency(totalPay)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Pay Runs Completed
              </Typography>
              <Typography variant="h3" className="tnum">{payRuns.length}</Typography>
              <Typography variant="caption" color="text.secondary">
                {payRuns.length ? `Last: ${formatPeriod(payRuns[0].period)}` : 'None yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Employees */}
      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Team
      </Typography>
      <Card sx={{ mb: 4 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="employees">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Shielded address</TableCell>
                <TableCell align="right">Monthly pay (private)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{e.name}</TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell><HashChip value={e.address} chars={5} /></TableCell>
                  <TableCell align="right" className="tnum" sx={{ fontWeight: 600 }}>
                    {formatCurrency(DEFAULT_AMOUNTS[e.id] ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Pay run history */}
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Pay Run History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        What the public ledger stores for each run: opaque commitments. Amounts and recipients live only
        in employee private state — see the{' '}
        <RouterLink to="/ledger" style={{ color: 'inherit' }}>public ledger view</RouterLink>.
      </Typography>
      {payRuns.length === 0 ? (
        <EmptyState
          icon={<ReceiptLongIcon />}
          title="No Pay Runs Yet"
          body="Run your first confidential payroll — each employee receives a shielded payment plus a payslip credential."
          action={<Button variant="contained" onClick={startRun}>Run Payroll</Button>}
        />
      ) : (
        <Stack spacing={1.5}>
          {payRuns.map((run) => (
            <Card key={run.id}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip size="small" color="primary" variant="outlined" label={formatPeriod(run.period)} />
                    <Typography variant="body2" color="text.secondary">
                      {run.employeeCount} employees · {formatTimestamp(run.timestamp)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {run.txHashes.map((tx) => (
                      <HashChip key={tx} value={tx} chars={4} />
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Run payroll dialog */}
      <Dialog open={dialogOpen} onClose={runPhase === 'running' ? undefined : () => setDialogOpen(false)} fullWidth maxWidth="sm">
        {runPhase === 'review' && (
          <>
            <DialogTitle>Run Payroll — {formatPeriod(period)}</DialogTitle>
            <DialogContent>
              {runError && <Alert severity="error" sx={{ mb: 2 }}>{runError}</Alert>}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Each employee receives a shielded payment and a signed payslip commitment. The chain will
                see {employees.length} opaque hashes and nothing else.
              </Typography>
              <Table size="small">
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell sx={{ pl: 0 }}>{e.name}</TableCell>
                      <TableCell align="right" className="tnum" sx={{ pr: 0, fontWeight: 600 }}>
                        {formatCurrency(DEFAULT_AMOUNTS[e.id] ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ pl: 0, fontWeight: 700, borderBottom: 'none' }}>Total</TableCell>
                    <TableCell align="right" className="tnum" sx={{ pr: 0, fontWeight: 700, borderBottom: 'none', color: 'primary.light' }}>
                      {formatCurrency(totalPay)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => void confirmRun()}>
                Confirm & Pay Privately
              </Button>
            </DialogActions>
          </>
        )}

        {runPhase === 'running' && (
          <>
            <DialogTitle>Paying {employees.length} Employees Privately…</DialogTitle>
            <DialogContent>
              <LinearProgress sx={{ mb: 2.5 }} />
              <Stack spacing={1.25}>
                {employees.map((e) => {
                  const paid = paidIds.includes(e.id);
                  const active = !paid && paidIds.length === employees.findIndex((x) => x.id === e.id);
                  return (
                    <Stack key={e.id} direction="row" spacing={1.5} alignItems="center">
                      {paid ? (
                        <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                      ) : (
                        <CircularProgress size={16} sx={{ opacity: active ? 1 : 0.25 }} />
                      )}
                      <Typography variant="body2" sx={{ flex: 1 }}>{e.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {paid ? 'commitment posted' : active ? 'building commitment…' : 'queued'}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </DialogContent>
          </>
        )}

        {runPhase === 'success' && lastRun && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" /> Payroll Settled Privately
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {lastRun.employeeCount} employees paid for {formatPeriod(lastRun.period)}. The public record
                of this entire pay run:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                {lastRun.txHashes.map((tx) => (
                  <HashChip key={tx} value={tx} chars={6} />
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                That's it. No amounts. No names.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button component={RouterLink} to="/ledger" onClick={() => setDialogOpen(false)}>
                Inspect Public Ledger
              </Button>
              <Button variant="contained" onClick={() => setDialogOpen(false)}>
                Done
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
