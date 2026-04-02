/** Convert a buy-in count to big blinds. */
export function buyinsToBb(buyins: number, buyinSize: number): number {
  return buyins * buyinSize;
}

/** Convert big blinds to buy-in count. */
export function bbToBuyins(bb: number, buyinSize: number): number {
  return bb / buyinSize;
}
