/** Expected profit in bb over N hands. */
export function profitMean(wr: number, N: number): number {
  return wr * (N / 100);
}

/** Standard deviation of profit in bb over N hands. */
export function profitStdDev(sd: number, N: number): number {
  return sd * Math.sqrt(N / 100);
}
