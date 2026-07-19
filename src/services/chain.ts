import { MockChainService } from './mock';
import { MidnightChainService } from './midnight';
import type { ChainService } from './types';

/**
 * Provider selection.
 *
 * DEMO_MODE (default, zero external dependencies) uses MockChainService.
 * Setting VITE_DEMO_MODE=false selects the Midnight-backed service, which
 * requires a running proof server, indexer access, and a funded wallet —
 * see /docker and README "Running against testnet".
 */
const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';


let service: ChainService;

if (demoMode) {
  service = new MockChainService();
} else {
  service = new MidnightChainService();
}

export const chain: ChainService = service;
export const IS_DEMO = demoMode;
