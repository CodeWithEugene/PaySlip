import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import '@fontsource-variable/inter';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import { theme } from './theme/theme';
import { ToastProvider } from './components/ToastContext';
import { WalletProvider } from './components/WalletContext';
import { AuthProvider } from './components/AuthContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InitColorSchemeScript attribute="class" defaultMode="dark" />
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <AuthProvider>
        <WalletProvider>
          <ToastProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ToastProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
