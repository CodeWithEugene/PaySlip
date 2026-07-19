import { createTheme } from '@mui/material/styles';

/**
 * PaySlip brand system.
 *
 * Everything derives from the logo green #15994E.
 * - Raw #15994E: buttons, fills, large display text only (3.7:1 on black).
 * - #4CC97F ("mint"): links, accents, highlighted figures on dark (10:1 on black).
 * - #0E6B37 ("forest"): hover states and accents on light.
 *
 * Dark mode is the default. Page background is pure black; cards sit on
 * near-black elevated surfaces (#0A0A0A / #111111) to preserve depth.
 */

export const brand = {
  50: '#E8F7EE',
  100: '#C9EDD8',
  200: '#9DDFBA',
  300: '#6ED098',
  400: '#4CC97F',
  500: '#2FB56A',
  600: '#15994E',
  700: '#0E6B37',
  800: '#0A4F29',
  900: '#06341B',
} as const;

const mono = '"SF Mono", "Roboto Mono", ui-monospace, Menlo, monospace';
const display = '"Space Grotesk", "Inter Variable", system-ui, sans-serif';
const body = '"Inter Variable", system-ui, -apple-system, sans-serif';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: brand[600], light: brand[400], dark: brand[700], contrastText: '#FFFFFF' },
        secondary: { main: brand[400], contrastText: '#04130A' },
        success: { main: brand[400], contrastText: '#04130A' },
        error: { main: '#F07A6A', contrastText: '#1A0603' },
        warning: { main: '#E5B458', contrastText: '#1C1303' },
        info: { main: brand[300], contrastText: '#04130A' },
        background: { default: '#000000', paper: '#0A0A0A' },
        text: {
          primary: '#F5F7F6',
          secondary: '#A3B0A9',
          disabled: '#5C6660',
        },
        divider: 'rgba(163, 176, 169, 0.16)',
        action: { hover: 'rgba(76, 201, 127, 0.06)' },
      },
    },
    light: {
      palette: {
        primary: { main: brand[600], light: brand[400], dark: brand[700], contrastText: '#FFFFFF' },
        secondary: { main: brand[700], contrastText: '#FFFFFF' },
        success: { main: brand[700], contrastText: '#FFFFFF' },
        error: { main: '#B3362A', contrastText: '#FFFFFF' },
        warning: { main: '#8A6215', contrastText: '#FFFFFF' },
        info: { main: brand[700], contrastText: '#FFFFFF' },
        background: { default: '#FFFFFF', paper: '#FFFFFF' },
        text: {
          primary: '#111827',
          secondary: '#4B5563',
          disabled: '#9CA3AF',
        },
        divider: 'rgba(17, 24, 39, 0.10)',
        action: { hover: 'rgba(21, 153, 78, 0.05)' },
      },
    },
  },
  shape: { borderRadius: 10 },
  spacing: 8,
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.02em', fontSize: 'clamp(2.1rem, 5vw, 3.4rem)', lineHeight: 1.08 },
    h2: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.015em', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', lineHeight: 1.15 },
    h3: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.45rem' },
    h4: { fontFamily: display, fontWeight: 600, fontSize: '1.2rem' },
    h5: { fontFamily: display, fontWeight: 600, fontSize: '1.05rem' },
    h6: { fontFamily: display, fontWeight: 600, fontSize: '0.95rem' },
    subtitle1: { fontWeight: 500, fontSize: '0.95rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.85rem', lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    caption: { fontSize: '0.75rem' },
    overline: { fontFamily: display, fontWeight: 600, letterSpacing: '0.12em', fontSize: '0.7rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (t) => ({
        html: { scrollBehavior: 'smooth' },
        body: { minHeight: '100vh' },
        code: { fontFamily: mono },
        '.tnum': { fontVariantNumeric: 'tabular-nums' },
        '::selection': { backgroundColor: brand[600], color: '#fff' },
        a: { color: t.vars ? `var(--mui-palette-primary-light)` : brand[400] },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 18,
          paddingBlock: 8,
          fontSize: '0.9rem',
        },
        containedPrimary: ({ theme: t }) => ({
          '&:hover': { backgroundColor: brand[700] },
          ...t.applyStyles('dark', { '&:hover': { backgroundColor: brand[500] } }),
        }),
        outlined: ({ theme: t }) => ({
          borderColor: t.vars.palette.divider,
          '&:hover': { borderColor: brand[500], backgroundColor: t.vars.palette.action.hover },
        }),
        sizeLarge: { paddingInline: 26, paddingBlock: 11, fontSize: '0.95rem' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundImage: 'none',
          ...t.applyStyles('dark', { backgroundColor: '#0A0A0A' }),
        }),
        outlined: ({ theme: t }) => ({
          borderColor: t.vars.palette.divider,
        }),
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 14,
          ...t.applyStyles('dark', { backgroundColor: '#0A0A0A' }),
          ...t.applyStyles('light', { backgroundColor: '#FFFFFF' }),
        }),
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: ({ theme: t }) => ({
          backdropFilter: 'blur(12px)',
          ...t.applyStyles('dark', { backgroundColor: 'rgba(0,0,0,0.72)' }),
          ...t.applyStyles('light', { backgroundColor: 'rgba(255,255,255,0.82)' }),
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme: t }) => ({ borderColor: t.vars.palette.divider }),
        head: ({ theme: t }) => ({
          fontFamily: display,
          fontWeight: 600,
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: t.vars.palette.text.secondary,
          whiteSpace: 'nowrap',
        }),
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: t.vars.palette.divider },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand[500] },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
        outlined: ({ theme: t }) => ({ borderColor: t.vars.palette.divider }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRadius: 16,
          border: `1px solid ${t.vars.palette.divider}`,
          backgroundImage: 'none',
          ...t.applyStyles('dark', { backgroundColor: '#0D0D0D' }),
        }),
      },
    },
    MuiAlert: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: 10, alignItems: 'center' },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: ({ theme: t }) => ({
          color: brand[700],
          ...t.applyStyles('dark', { color: brand[400] }),
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', borderRadius: 6 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6, backgroundColor: 'rgba(76,201,127,0.15)' },
      },
    },
    MuiSkeleton: { defaultProps: { animation: 'wave' } },
  },
});

export { mono };
