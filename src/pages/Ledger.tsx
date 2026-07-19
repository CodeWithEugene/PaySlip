import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import VerifiedIcon from '@mui/icons-material/Verified';
import RefreshIcon from '@mui/icons-material/Refresh';
import HashChip from '../components/HashChip';
import { chain } from '../services/chain';
import type { LedgerSnapshot } from '../services/types';
import { formatCurrency, formatPeriod, formatTimestamp } from '../utils/format';

export default function Ledger() {
  const [snapshot, setSnapshot] = useState<LedgerSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await chain.getLedger());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read the public ledger.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: 5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={2} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="overline" color="primary.light">
            Public Ledger Explorer
          </Typography>
          <Typography variant="h2">Everything the Chain Knows</Typography>
        </Box>
        <Button onClick={() => void load()} startIcon={<RefreshIcon />} disabled={loading}>
          Refresh
        </Button>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mb: 4 }}>
        This is the complete public state of the PaySlip contract. Look for a salary, a name, or an
        employer-employee link — <strong>there isn't one.</strong> Payroll privacy isn't a policy here;
        it's what the ledger physically stores.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => void load()}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading || !snapshot ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={280} />
          <Skeleton variant="rounded" height={200} />
        </Stack>
      ) : (
        <>
          {/* Chain meta */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Commitment Tree Root (Merkle)
                </Typography>
                <HashChip value={snapshot.merkleRoot} chars={10} />
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Block Height
                </Typography>
                <Typography variant="h4" className="tnum">{snapshot.blockHeight.toLocaleString()}</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Registered Employers
                </Typography>
                <Typography variant="h4" className="tnum">{snapshot.employers.length}</Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Payslip commitments */}
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Payslip Commitments ({snapshot.commitments.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            One opaque hash per payslip. No amount, no recipient, no employer linkage.
          </Typography>
          <Card sx={{ mb: 4 }}>
            <TableContainer sx={{ overflowX: 'auto', maxHeight: 420 }}>
              <Table size="small" stickyHeader aria-label="payslip commitments">
                <TableHead>
                  <TableRow>
                    <TableCell>Leaf</TableCell>
                    <TableCell>Commitment</TableCell>
                    <TableCell>Transaction</TableCell>
                    <TableCell>Block</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Amount / recipient</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {snapshot.commitments.map((c) => (
                    <TableRow key={c.commitment} hover>
                      <TableCell className="tnum">#{c.leafIndex}</TableCell>
                      <TableCell><HashChip value={c.commitment} chars={7} /></TableCell>
                      <TableCell><HashChip value={c.txHash} chars={5} /></TableCell>
                      <TableCell className="tnum">{c.blockHeight.toLocaleString()}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTimestamp(c.timestamp)}</TableCell>
                      <TableCell align="right">
                        <Chip size="small" variant="outlined" label="not on chain" sx={{ color: 'text.disabled' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Grid container spacing={2.5}>
            {/* Verification requests */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h4" sx={{ mb: 1.5 }}>
                Verification Requests ({snapshot.requests.length})
              </Typography>
              <Card>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" aria-label="verification requests">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Label</TableCell>
                        <TableCell align="right">Threshold</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {snapshot.requests.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{r.id}</TableCell>
                          <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.label}
                          </TableCell>
                          <TableCell align="right" className="tnum">{formatCurrency(r.threshold)}</TableCell>
                          <TableCell>{formatPeriod(r.period)}</TableCell>
                          <TableCell>
                            {r.status === 'verified' ? (
                              <Chip size="small" color="success" icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label="verified" />
                            ) : (
                              <Chip size="small" variant="outlined" label="open" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* Verified results */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="h4" sx={{ mb: 1.5 }}>
                Verified Results ({snapshot.results.length})
              </Typography>
              <Card>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" aria-label="verified results">
                    <TableHead>
                      <TableRow>
                        <TableCell>Request</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Proof tx</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {snapshot.results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                            No proofs submitted yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        snapshot.results.map((res) => (
                          <TableRow key={res.requestId} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{res.requestId}</TableCell>
                            <TableCell>
                              <Chip size="small" color="success" label="passed = true" />
                            </TableCell>
                            <TableCell><HashChip value={res.txHash} chars={5} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                One boolean per settled request. The proof transaction contains a ZK-SNARK — not the
                salary that satisfied it.
              </Typography>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}
