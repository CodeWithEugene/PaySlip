/** Money: amounts are minor units (cents) of tUSD. */
export function formatCurrency(minorUnits: number): string {
  return (minorUnits / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

/** 202607 → "Jul 2026" */
export function formatPeriod(period: number): string {
  const y = Math.floor(period / 100);
  const m = period % 100;
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function currentPeriod(): number {
  const now = new Date();
  return now.getFullYear() * 100 + (now.getMonth() + 1);
}

export function truncateHash(hash: string, chars = 6): string {
  if (hash.length <= chars * 2 + 5) return hash;
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
