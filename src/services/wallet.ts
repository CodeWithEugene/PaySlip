import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'unavailable' | 'error';
export type WalletSnapshot = { status: WalletStatus; address: string | null; error: string | null; api: ConnectedAPI | null };

let snapshot: WalletSnapshot = { status: 'disconnected', address: null, error: null, api: null };
const listeners = new Set<(next: WalletSnapshot) => void>();

function emit(next: WalletSnapshot): void { snapshot = next; listeners.forEach((listener) => listener(next)); }

function compatibleWallet(): InitialAPI | undefined {
  if (typeof window === 'undefined' || !window.midnight) return undefined;
  return Object.values(window.midnight).find((wallet): wallet is InitialAPI => Boolean(wallet) && typeof wallet === 'object' && typeof wallet.connect === 'function');
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return /reject|denied|cancel/i.test(message) ? 'Wallet connection was cancelled. You can try again when ready.' : (message || 'Could not connect to a Midnight wallet.');
}

export function walletSnapshot(): WalletSnapshot { return snapshot; }
export function onWalletChange(listener: (next: WalletSnapshot) => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }

export async function connectMidnightWallet(networkId = import.meta.env.VITE_MIDNIGHT_NETWORK_ID || 'preprod'): Promise<WalletSnapshot> {
  const wallet = compatibleWallet();
  if (!wallet) {
    const next: WalletSnapshot = { status: 'unavailable', address: null, api: null, error: 'No Midnight wallet was found. Install or unlock 1AM or Lace, then refresh this page.' };
    emit(next); throw new Error(next.error ?? 'No Midnight wallet was found.');
  }
  emit({ ...snapshot, status: 'connecting', error: null });
  try {
    const api = await wallet.connect(networkId);
    const { shieldedAddress } = await api.getShieldedAddresses();
    const next: WalletSnapshot = { status: 'connected', address: shieldedAddress, api, error: null };
    emit(next); return next;
  } catch (error) {
    const next: WalletSnapshot = { status: 'error', address: null, api: null, error: friendlyError(error) };
    emit(next); throw new Error(next.error ?? 'Could not connect to a Midnight wallet.');
  }
}
