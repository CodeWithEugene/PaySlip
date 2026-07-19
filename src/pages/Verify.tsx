import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VerifiedIcon from '@mui/icons-material/Verified';
import HourglassIcon from '@mui/icons-material/HourglassTopOutlined';
import GavelIcon from '@mui/icons-material/GavelOutlined';
import HashChip from '../components/HashChip';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/ToastContext';
import { chain } from '../services/chain';
import type { VerificationRequest, VerifiedResult } from '../services/types';
import { currentPeriod, formatCurrency, formatPeriod, formatTimestamp } from '../utils/format';

function periodOptions(): number[] {
  const cur = currentPeriod();
  const y = Math.floor(cur / 100);
  const m = cur % 100;
  const prev = m === 1 ? (y - 1) * 100 + 12 : cur - 1;
  const prev2 = (prev % 100) === 1 ? (Math.floor(prev / 100) - 1) * 100 + 12 : prev - 1;
  return [cur, prev, prev2];
}

/** Result view for /verify/:requestId — the demo's money shot. */
function ResultView({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [result, setResult] = useState<VerifiedResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const req = await chain.getRequest(requestId);
      if (!req) {
        setError(`Request ${requestId} was not found on-chain.`);
      } else {
        setRequest(req);
        setResult(await chain.getResult(req.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the verification result.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton variant="rounded" height={340} sx={{ maxWidth: 640, mx: 'auto' }} />;
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: 640, mx: 'auto' }}
        action={<Button color="inherit" size="small" onClick={() => void load()}>Retry</Button>}>
        {error}
      </Alert>
    );
  }
  if (!request) return null;

  const verified = request.status === 'verified' && result;

  return (
    <Card sx={{ maxWidth: 640, mx: 'auto', textAlign: 'center' }}>
      <CardContent sx={{ p: { xs: 3.5, sm: 6 } }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {request.id} · {request.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="tnum" sx={{ mb: 4 }}>
          Asked: monthly income ≥ {formatCurrency(request.threshold)} for {formatPeriod(request.period)}
        </Typography>

        {verified ? (
          <>
            <VerifiedIcon sx={{ fontSize: 84, color: 'success.main', mb: 1.5 }} />
            <Typography variant="h2" sx={{ color: 'success.main', letterSpacing: '0.02em', mb: 1 }}>
              Income Verified
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 3.5 }}>
              You learned exactly one bit: income ≥ {formatCurrency(request.threshold)}.{' '}
              <Box component="strong" sx={{ color: 'text.primary' }}>Nothing else.</Box>{' '}
              No salary figure, no employer, no payment history.
            </Typography>
            <Stack spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                On-chain proof transaction
              </Typography>
              <HashChip value={result.txHash} chars={8} />
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(result.timestamp)}
              </Typography>
            </Stack>
          </>
        ) : (
          <>
            <HourglassIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h3" sx={{ mb: 1 }}>
              Awaiting Proof
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
              Share the request ID <strong>{request.id}</strong> with the applicant. The moment they
              submit a valid zero-knowledge proof, this page flips to a green check.
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Verify() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [threshold, setThreshold] = useState('1500');
  const [period, setPeriod] = useState(currentPeriod());
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<VerificationRequest | null>(null);

  const [requests, setRequests] = useState<VerificationRequest[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setListError(null);
    try {
      setRequests(await chain.listRequests());
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Failed to load requests.');
    }
  }, []);

  useEffect(() => {
    if (!requestId) void loadRequests();
  }, [requestId, loadRequests]);

  if (requestId) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: 6 }}>
        <Button onClick={() => navigate('/verify')} sx={{ mb: 3 }}>
          ← All Requests
        </Button>
        <ResultView requestId={requestId} />
      </Container>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(threshold) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setCreateError('Enter a valid threshold amount.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const req = await chain.createRequest(cents, period, label.trim() || 'Income verification');
      setCreated(req);
      toast(`Request ${req.id} created on-chain.`);
      void loadRequests();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create the request.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary.light">
          Verifier Portal
        </Typography>
        <Typography variant="h2">Ask One Question, Learn One Bit</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
          Landlords, lenders, and platforms create a request; applicants answer with a zero-knowledge
          proof. You never see a salary, a bank statement, or an employer name.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card component="form" onSubmit={submit}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2.5 }}>
                New Verification Request
              </Typography>
              {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
              <Stack spacing={2.5}>
                <TextField
                  label="Label"
                  placeholder="Apartment 4B application"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Monthly income at least"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  slotProps={{
                    input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                    htmlInput: { inputMode: 'decimal', 'aria-label': 'threshold amount in dollars' },
                  }}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="Pay period"
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  fullWidth
                >
                  {periodOptions().map((p) => (
                    <MenuItem key={p} value={p}>
                      {formatPeriod(p)}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={creating}
                  startIcon={creating ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                  {creating ? 'Creating On-Chain…' : 'Create Request'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {created && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setCreated(null)}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>{created.id}</strong> is live. Share it with the applicant:
              </Typography>
              <HashChip value={`${window.location.origin}/verify/${created.id}`} chars={12} />
            </Alert>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h4" sx={{ mb: 1.5 }}>
            Your Requests
          </Typography>
          {listError ? (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadRequests()}>Retry</Button>}>
              {listError}
            </Alert>
          ) : requests === null ? (
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" height={92} />
              <Skeleton variant="rounded" height={92} />
            </Stack>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<GavelIcon />}
              title="No Requests Yet"
              body="Create your first verification request — you'll get a shareable ID the applicant answers with a ZK proof."
            />
          ) : (
            <Stack spacing={1.5}>
              {requests.map((r) => (
                <Card key={r.id}>
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {r.id}
                          </Typography>
                          {r.status === 'verified' ? (
                            <Chip size="small" color="success" icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label="Income verified" />
                          ) : (
                            <Chip size="small" variant="outlined" label="Awaiting proof" />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {r.label} · ≥ {formatCurrency(r.threshold)} · {formatPeriod(r.period)}
                        </Typography>
                      </Box>
                      <Button component={RouterLink} to={`/verify/${r.id}`} size="small" variant="outlined">
                        Open Result
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
