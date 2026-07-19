import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { connectMidnightWallet, onWalletChange, walletSnapshot } from '../services/wallet';

type WalletContextValue = ReturnType<typeof walletSnapshot> & { connect: () => Promise<void> };
const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(walletSnapshot());
  useEffect(() => onWalletChange(setState), []);
  const value = useMemo<WalletContextValue>(() => ({ ...state, connect: async () => { await connectMidnightWallet(); } }), [state]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used inside WalletProvider.');
  return context;
}
