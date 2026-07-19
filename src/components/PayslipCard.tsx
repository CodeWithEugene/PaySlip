import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/LockOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpenOutlined';
import PublicIcon from '@mui/icons-material/PublicOutlined';
import HashChip from './HashChip';
import type { Payslip } from '../services/types';
import { formatCurrency, formatPeriod, formatTimestamp } from '../utils/format';

interface PayslipCardProps {
  payslip: Payslip;
  /** true when rendered inside the owner's wallet — private fields unlock. */
  ownerView: boolean;
}

/**
 * The product thesis as UI: every payslip shows its public on-chain face
 * (an opaque commitment) beside its private face (amount, employer, period),
 * which only renders unblurred in the owner's view.
 */
export default function PayslipCard({ payslip, ownerView }: PayslipCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ minHeight: 132 }}>
          {/* Public face — what the chain sees */}
          <Box sx={{ flex: 1, p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <PublicIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="subtitle2" color="text.secondary">
                On-chain · public
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Payslip commitment
            </Typography>
            <HashChip value={payslip.commitment} chars={8} />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
              tx {payslip.txHash.slice(0, 10)}… · {formatTimestamp(payslip.timestamp)}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />

          {/* Private face — witness state, owner's device only */}
          <Box
            sx={{
              flex: 1,
              p: 2.5,
              bgcolor: 'action.hover',
              borderTopRightRadius: { sm: 12 },
              borderBottomRightRadius: { sm: 12 },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              {ownerView ? (
                <LockOpenIcon sx={{ fontSize: 15, color: 'primary.light' }} />
              ) : (
                <LockIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              )}
              <Typography variant="subtitle2" sx={{ color: ownerView ? 'primary.light' : 'text.secondary' }}>
                {ownerView ? 'Private · your device' : 'Private · locked'}
              </Typography>
            </Stack>
            <Box sx={ownerView ? undefined : { filter: 'blur(7px)', userSelect: 'none', pointerEvents: 'none' }} aria-hidden={!ownerView}>
              <Typography
                variant="h4"
                className="tnum"
                sx={{ color: ownerView ? 'primary.light' : 'text.primary', mb: 0.5 }}
              >
                {ownerView ? formatCurrency(payslip.amount) : '$•,•••.••'}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={ownerView ? payslip.employerName : 'Employer hidden'} />
                <Chip size="small" variant="outlined" label={formatPeriod(payslip.period)} />
              </Stack>
            </Box>
            {!ownerView && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Only the recipient can open this payslip.
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
