import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, NavLink, Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import BrandLogo from './BrandLogo';
import { useToast } from './ToastContext';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext';
import { chain, IS_DEMO } from '../services/chain';
import { mono } from '../theme/theme';

const NAV = [
  { to: '/', label: 'Home', wallet: null },
  { to: '/employer', label: 'Employer', wallet: 'mn_shield…acme' },
  { to: '/employee', label: 'Employee', wallet: 'mn_shield…x7ada' },
  { to: '/verify', label: 'Verifier', wallet: 'mn_shield…nglet' },
  { to: '/ledger', label: 'Ledger', wallet: null },
];

export const GITHUB_URL = 'https://github.com/CodeWithEugene/PaySlip';

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  const isDark = mode !== 'light';
  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        size="small"
        aria-label="toggle color mode"
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const location = useLocation();
  const toast = useToast();
  const wallet = useWallet();
  const auth = useAuth();
  const activeNav = NAV.find((n) => n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to));

  useEffect(() => {
    if (!location.hash) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView());
  }, [location.hash, location.pathname]);

  const resetDemo = async () => {
    setResettingDemo(true);
    try {
      await chain.reset();
      toast('Demo data restored. You can run the video flow again.');
      window.location.assign('/?demo=1');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not restore demo data. Please try again.', 'error');
      setResettingDemo(false);
    }
  };

  const connectWallet = async () => {
    try {
      await wallet.connect();
      toast('Midnight wallet connected.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not connect to a Midnight wallet.', 'error');
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      toast('You have been signed out.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not sign you out. Please try again.', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 } }}>
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 60, md: 68 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr auto', md: '1fr auto 1fr' },
              columnGap: 2,
            }}
          >
            <Link component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', justifySelf: 'start' }} aria-label="PaySlip home">
              <BrandLogo size={38} />
            </Link>

            {/* Desktop nav */}
            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, justifySelf: 'center' }}>
              {NAV.map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.to === '/'}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    px: 1.5,
                    '&.active': { color: 'text.primary', bgcolor: 'action.hover' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" justifySelf="end">
              {IS_DEMO && activeNav?.wallet && (
                <Tooltip title={`DEMO_MODE — acting as the ${activeNav.label.toLowerCase()} demo wallet`}>
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    label={activeNav.wallet}
                    sx={{ fontFamily: mono, fontSize: '0.68rem', display: { xs: 'none', lg: 'inline-flex' } }}
                  />
                </Tooltip>
              )}
              {!IS_DEMO && (
                <Button
                  onClick={() => void connectWallet()}
                  size="small"
                  variant={wallet.status === 'connected' ? 'outlined' : 'contained'}
                  disabled={wallet.status === 'connecting'}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontFamily: mono, maxWidth: 180 }}
                >
                  {wallet.status === 'connected' && wallet.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)}` : wallet.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
                </Button>
              )}
              {auth.status === 'ready' && (auth.user ? (
                <Button onClick={() => void signOut()} size="small" variant="outlined" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  Sign Out
                </Button>
              ) : (
                <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <Button component={RouterLink} to="/sign-in" size="small" variant="text">Sign In</Button>
                  <Button component={RouterLink} to="/sign-up" size="small" variant="contained">Sign Up</Button>
                </Stack>
              ))}
              <ModeToggle />
              <IconButton
                aria-label="open navigation menu"
                onClick={() => setDrawerOpen(true)}
                sx={{ display: { md: 'none' } }}
                size="small"
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 270, p: 2 }} role="navigation" aria-label="mobile">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <BrandLogo size={30} />
            <IconButton aria-label="close menu" onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
          <List>
            {NAV.map((item) => (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setDrawerOpen(false)}
                sx={{ borderRadius: 2, '&.active': { bgcolor: 'action.hover', color: 'primary.light' } }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          {IS_DEMO && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
              DEMO_MODE — each section uses its own mock wallet, so one person can play all three roles.
            </Typography>
          )}
          {!IS_DEMO && (
            <Box sx={{ px: 2, pt: 1 }}>
              <Button fullWidth variant="contained" onClick={() => void connectWallet()} disabled={wallet.status === 'connecting'}>
                {wallet.status === 'connected' ? 'Wallet Connected' : wallet.status === 'connecting' ? 'Connecting…' : 'Connect Midnight Wallet'}
              </Button>
            </Box>
          )}
          <Box sx={{ px: 2, pt: 2 }}>
            {auth.status === 'ready' && (auth.user ? (
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">Signed In As {auth.user.email}</Typography>
                <Button fullWidth variant="outlined" onClick={() => void signOut()}>Sign Out</Button>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Button component={RouterLink} to="/sign-up" variant="contained" fullWidth onClick={() => setDrawerOpen(false)}>Sign Up</Button>
                <Button component={RouterLink} to="/sign-in" variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Sign In</Button>
              </Stack>
            ))}
          </Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <Divider />
      <Container maxWidth={false} component="footer" sx={{ px: { xs: 2, sm: 3, lg: 5, xl: 8 }, py: { xs: 5, md: 6 } }}>
        <Grid container columnSpacing={{ xs: 3, md: 7 }} rowSpacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={1.5} alignItems="flex-start">
              <BrandLogo size={34} />
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
                Private payroll. Provable income. Zero disclosure.
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  component="a"
                  href="https://midnight.network/"
                  target="_blank"
                  rel="noopener"
                  clickable
                  size="small"
                  variant="outlined"
                  label="Built on Midnight"
                />
                {IS_DEMO && (
                  <Button size="small" variant="text" onClick={() => void resetDemo()} disabled={resettingDemo}>
                    {resettingDemo ? 'Resetting…' : 'Reset Demo'}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FooterGroup title="Product">
              <Link component={RouterLink} to="/#how-it-works">How It Works</Link>
              <Link component={RouterLink} to="/employer">Employer</Link>
              <Link component={RouterLink} to="/employee">Employee</Link>
              <Link component={RouterLink} to="/verify">Verifier</Link>
            </FooterGroup>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FooterGroup title="Explore">
              <Link component={RouterLink} to="/ledger">Public Ledger</Link>
              <Link href={GITHUB_URL} target="_blank" rel="noopener">Source Code</Link>
              <Link href="https://midnight.network/" target="_blank" rel="noopener">Midnight</Link>
              <Link href="https://midnight-hackathon-july-2026.devpost.com/" target="_blank" rel="noopener">Hackathon</Link>
            </FooterGroup>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <FooterGroup title="Proof, Not Paperwork">
              <Typography variant="body2" color="text.secondary">
                Verify income eligibility without collecting a salary figure or bank statement.
              </Typography>
              <Link href={GITHUB_URL} target="_blank" rel="noopener" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <GitHubIcon sx={{ fontSize: 17 }} />
                GitHub Repository
              </Link>
            </FooterGroup>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack spacing={1.1} alignItems="flex-start">
      <Typography variant="subtitle2" color="text.primary">{title}</Typography>
      {children}
    </Stack>
  );
}
