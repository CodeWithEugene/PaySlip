import { useState, type FormEvent } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../components/AuthContext';

type AuthMode = 'sign-in' | 'sign-up';

export default function Auth({ mode }: { mode: AuthMode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isSignUp = mode === 'sign-up';
  const destination = (location.state as { from?: string } | null)?.from ?? '/';

  if (auth.status === 'loading') {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading authentication" /></Box>;
  }
  if (auth.user) return <Navigate to={destination} replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (isSignUp && name.trim().length < 2) {
      setError('Enter the name you would like to use on PaySlip.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const result = isSignUp
        ? await auth.signUp(name.trim(), email.trim(), password)
        : await auth.signIn(email.trim(), password);
      if (result.authenticated) {
        navigate(destination, { replace: true });
      } else if (result.verificationRequired) {
        setNotice('Your account was created. Check your email to verify it, then sign in.');
      } else {
        setNotice('Your request was received. You can now continue with PaySlip.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(420px, 0.9fr)' } }}>
      <Box
        component="section"
        aria-label="PaySlip introduction"
        sx={{
          position: 'relative', minHeight: { xs: 320, md: '100dvh' }, overflow: 'hidden', bgcolor: '#000000', color: '#F5F7F6',
          display: { xs: 'none', md: 'flex' }, alignItems: 'flex-end', p: { md: 6, lg: 9 },
          '&::after': { content: '""', position: 'absolute', inset: 0, backgroundColor: '#000000', opacity: 0.58 },
        }}
      >
        <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, maxWidth: 540 }}>
          <BrandLogo size={46} />
          <Typography variant="overline" color="primary.light">Private By Default</Typography>
          <Typography variant="h1" sx={{ fontSize: 'clamp(3rem, 5vw, 5.4rem)', maxWidth: 520 }}>
            The Payment Is The Credential.
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 440, fontSize: '1.02rem', color: '#A3B0A9' }}>
            Run payroll confidentially, hold a reusable income credential, and disclose exactly one fact when it matters.
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.light', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Built On Midnight · Secured By Neon Auth
          </Typography>
        </Stack>
      </Box>

      <Box component="main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2.5, sm: 5, md: 7 }, py: { xs: 4, md: 7 }, bgcolor: 'background.paper' }}>
        <Box sx={{ width: '100%', maxWidth: 410 }}>
          <Stack spacing={3.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Link component={RouterLink} to="/" aria-label="Back to PaySlip home" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.82rem', fontWeight: 600 }}>
                <ArrowBackIcon sx={{ fontSize: 17 }} /> Back To PaySlip
              </Link>
              <Box sx={{ display: { xs: 'block', md: 'none' } }}><BrandLogo size={34} /></Box>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="h2">{isSignUp ? 'Create Your Account' : 'Welcome Back'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {isSignUp ? 'Create a secure PaySlip account to keep your workspace ready across devices.' : 'Sign in to continue with your private payroll workspace.'}
              </Typography>
            </Stack>

            {!auth.configured && <Alert severity="warning">Authentication is not configured for this environment yet. Add `VITE_NEON_AUTH_URL` and reload.</Alert>}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {notice && <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert>}

            <Box component="form" noValidate onSubmit={submit}>
              <Stack spacing={2}>
                {isSignUp && <TextField label="Full Name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required disabled={submitting || !auth.configured} fullWidth />}
                <TextField label="Email Address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={submitting || !auth.configured} fullWidth />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={submitting || !auth.configured}
                  fullWidth
                  helperText={isSignUp ? 'At least 8 characters.' : undefined}
                  slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Hide Password' : 'Show Password'} onClick={() => setShowPassword((visible) => !visible)} edge="end">{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment> } }}
                />
                <Button type="submit" variant="contained" size="large" disabled={submitting || !auth.configured} fullWidth>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </Stack>
            </Box>

            <Divider />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {isSignUp ? 'Already have an account?' : 'New to PaySlip?'}{' '}
              <Link component={RouterLink} to={isSignUp ? '/sign-in' : '/sign-up'} fontWeight={700}>
                {isSignUp ? 'Sign In' : 'Create An Account'}
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
