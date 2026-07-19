import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import FingerprintIcon from '@mui/icons-material/FingerprintOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUserOutlined';
import ApartmentIcon from '@mui/icons-material/ApartmentOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlineOutlined';
import GavelIcon from '@mui/icons-material/GavelOutlined';
import TableRowsIcon from '@mui/icons-material/TableRowsOutlined';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

const STEPS = [
  {
    icon: <PaymentsIcon />,
    title: 'Pay Privately',
    body: 'Employers run stablecoin payroll on Midnight. The public ledger records one opaque commitment per payslip — no amounts, no names, no org chart to reverse-engineer.',
  },
  {
    icon: <FingerprintIcon />,
    title: 'Hold the Credential',
    body: 'Each payment leaves a signed payslip preimage in the employee’s private state. The payment is the credential — no issuer, no PDF, no bank statement.',
  },
  {
    icon: <VerifiedUserIcon />,
    title: 'Prove Without Revealing',
    body: 'A landlord asks "income ≥ $1,500?" — the employee answers with a zero-knowledge proof. The verifier learns exactly one bit. The salary never appears anywhere.',
  },
];

const ROLES = [
  {
    to: '/employer',
    icon: <ApartmentIcon />,
    eyebrow: '01 / Issue',
    title: 'Run Private Payroll',
    body: 'Fund a payroll vault, issue payslip commitments, and keep every salary out of the public record.',
    action: 'Open employer console',
    size: { xs: 12, md: 7 },
  },
  {
    to: '/employee',
    icon: <PersonIcon />,
    eyebrow: '02 / Hold',
    title: 'Keep the Credential',
    body: 'Your payslip stays in private device state. It is yours to inspect and reuse when needed.',
    action: 'Open employee wallet',
    size: { xs: 12, md: 5 },
  },
  {
    to: '/verify',
    icon: <GavelIcon />,
    eyebrow: '03 / Prove',
    title: 'Ask One Question',
    body: 'Create an income threshold request and receive a cryptographic answer, not paperwork.',
    action: 'Open verifier portal',
    size: { xs: 12, md: 5 },
  },
  {
    to: '/ledger',
    icon: <TableRowsIcon />,
    eyebrow: '04 / Inspect',
    title: 'See Exactly What Is Public',
    body: 'Explore commitments, requests, and proof results. There are no names, amounts, or salary history to find.',
    action: 'Inspect public ledger',
    size: { xs: 12, md: 7 },
  },
];

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <Box
        sx={{
          minHeight: 'calc(100dvh - 60px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: { xs: 8, md: 10 }, textAlign: 'center' }}>
          <Chip
            component="a"
            href="https://midnight-hackathon-july-2026.devpost.com/"
            target="_blank"
            rel="noopener"
            clickable
            size="small"
            variant="outlined"
            color="primary"
            label="Built on Midnight · MLH Midnight Hackathon 2026"
            sx={{ mb: 3 }}
          />
          <Typography variant="h1" sx={{ maxWidth: 1100, mx: 'auto', fontSize: 'clamp(3.15rem, 7.4vw, 7rem)', lineHeight: 0.98 }}>
            Private Payroll.{' '}
            <Box component="span" sx={{ color: 'primary.light' }}>
              Provable Income.
            </Box>{' '}
            Zero Disclosure.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mx: 'auto', mt: 2.5, fontSize: '1.05rem' }}>
            On-chain payroll leaks every salary, forever. Income verification over-discloses your whole
            financial life. PaySlip fixes both with one confidential smart contract —{' '}
            <Box component="strong" sx={{ color: 'text.primary' }}>the payment is the credential.</Box>
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 4.5 }}>
            <Button component={RouterLink} to="/employer" variant="contained" size="large">
              Run Payroll
            </Button>
            <Button component={RouterLink} to="/employee" variant="outlined" size="large">
              Prove Your Income
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* How it works */}
      <Container id="how-it-works" maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: { xs: 6, md: 9 } }}>
        <Typography variant="overline" color="primary.light" display="block" textAlign="center">
          How It Works
        </Typography>
        <Typography variant="h2" textAlign="center" sx={{ mb: 5 }}>
          One Contract, Three Superpowers
        </Typography>
        <Grid container spacing={2.5}>
          {STEPS.map((step, i) => (
            <Grid key={step.title} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    borderColor: 'primary.main',
                    transform: 'translateY(-3px)',
                    '& .how-step-icon': { bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white' },
                    '& .how-step-label, & .how-step-body': { color: 'rgba(255,255,255,0.82)' },
                    '& .how-step-title': { color: 'common.white' },
                  },
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box
                      className="how-step-icon"
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'action.hover',
                        color: 'primary.light',
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Typography className="how-step-label" variant="overline" color="text.secondary">
                      Step {i + 1}
                    </Typography>
                  </Stack>
                  <Typography className="how-step-title" variant="h4" gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography className="how-step-body" variant="body2" color="text.secondary">
                    {step.body}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Role dashboards */}
      <Box id="roles" sx={{ bgcolor: 'common.black' }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: { xs: 7, md: 11 } }}>
          <Grid container spacing={{ xs: 3, md: 6 }} alignItems="end" sx={{ mb: { xs: 4, md: 6 } }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="overline" sx={{ color: 'primary.light', display: 'block', mb: 1 }}>
                The PaySlip Network
              </Typography>
              <Typography variant="h2" sx={{ color: 'common.white', maxWidth: 620 }}>
                Every Role Sees Only the Information It Earns.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="body1" sx={{ color: 'grey.400', maxWidth: 460, ml: { md: 'auto' } }}>
                Use the demo as an employer, employee, verifier, or public observer. The workflow changes; the disclosure rule does not.
              </Typography>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {ROLES.map((role) => (
              <Grid key={role.to} size={role.size}>
                <Card
                  sx={{
                    height: '100%',
                    minHeight: { xs: 250, md: role.to === '/employer' || role.to === '/ledger' ? 306 : 274 },
                    bgcolor: 'rgba(255,255,255,0.045)',
                    borderColor: 'rgba(255,255,255,0.16)',
                    color: 'common.white',
                    transition: 'background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      borderColor: 'primary.main',
                      transform: 'translateY(-3px)',
                      '& .role-icon': { bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white' },
                      '& .role-label, & .role-title, & .role-body, & .role-action': { color: 'common.white' },
                    },
                  }}
                >
                  <CardActionArea component={RouterLink} to={role.to} sx={{ height: '100%', p: { xs: 0.75, md: 1 } }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3.5 }}>
                        <Typography className="role-label" variant="overline" sx={{ color: 'grey.400' }}>{role.eyebrow}</Typography>
                        <Box
                          className="role-icon"
                          sx={{
                            width: 44,
                            height: 44,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            color: 'primary.light',
                            '& svg': { fontSize: 26 },
                          }}
                        >
                          {role.icon}
                        </Box>
                      </Stack>
                      <Typography className="role-title" variant="h3" sx={{ color: 'common.white', maxWidth: 430, mb: 1.25 }}>
                        {role.title}
                      </Typography>
                      <Typography className="role-body" variant="body1" sx={{ color: 'grey.400', maxWidth: 520 }}>
                        {role.body}
                      </Typography>
                      <Stack className="role-action" direction="row" spacing={0.75} alignItems="center" sx={{ color: 'primary.light', mt: 'auto', pt: 4 }}>
                        <Typography variant="subtitle2" sx={{ color: 'inherit' }}>{role.action}</Typography>
                        <ArrowOutwardIcon sx={{ fontSize: 18 }} />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
