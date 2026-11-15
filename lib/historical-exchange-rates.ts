export interface HistoricalRate {
  date: string | Date;
  close: number;
}

export function dayKey(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export function findHistoricalRate(rates: HistoricalRate[], date: string | Date, maxGapDays = 7): number | null {
  const target = Date.parse(`${dayKey(date)}T00:00:00Z`);
  let bestTime = -Infinity;
  let best: number | null = null;
  for (const rate of rates) {
    const time = Date.parse(`${dayKey(rate.date)}T00:00:00Z`);
    if (!Number.isFinite(time) || time > target || time <= bestTime || !Number.isFinite(rate.close) || rate.close <= 0)
      continue;
    bestTime = time;
    best = rate.close;
  }
  return best !== null && target - bestTime <= maxGapDays * 86400000 ? best : null;
}

export function convertHistoricalDividend(
  amount: number,
  from: string,
  to: string,
  date: string | Date,
  ratesByCurrency: Record<string, HistoricalRate[]>,
  maxGapDays = 7,
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  const rate = (currency: string) =>
    currency === 'KRW' ? 1 : findHistoricalRate(ratesByCurrency[currency] || [], date, maxGapDays);
  const fromRate = rate(from);
  const toRate = rate(to);
  return fromRate === null || toRate === null ? null : (amount * fromRate) / toRate;
}

export function sumHistoricalDividendEvents(
  events: { date: string | Date; amount: number }[],
  from: string,
  to: string,
  ratesByCurrency: Record<string, HistoricalRate[]>,
  maxGapDays = 7,
) {
  let total = 0;
  for (const event of events) {
    const converted = convertHistoricalDividend(event.amount, from, to, event.date, ratesByCurrency, maxGapDays);
    if (converted === null) return null;
    total += converted;
  }
  return total;
}
