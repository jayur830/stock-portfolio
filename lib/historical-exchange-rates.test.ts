import {
  convertHistoricalDividend,
  findHistoricalRate,
  sumHistoricalDividendEvents,
} from './historical-exchange-rates';

describe('historical dividend FX', () => {
  const usd = [
    { date: '2024-01-01', close: 1300 },
    { date: '2024-01-10', close: 1400 },
  ];
  it('converts each event on its own day and sums the converted amounts', () => {
    const events = [
      { date: '2024-01-01', amount: 1 * 10 * 0.85 },
      { date: '2024-01-10', amount: 1 * 10 * 0.85 },
    ];
    expect(
      events.map((event) =>
        Math.round(convertHistoricalDividend(event.amount, 'USD', 'KRW', event.date, { USD: usd })!),
      ),
    ).toEqual([11050, 11900]);
    expect(sumHistoricalDividendEvents(events, 'USD', 'KRW', { USD: usd })).toBe(22950);
    expect(sumHistoricalDividendEvents(events, 'USD', 'USD', {})).toBe(17);
    expect(
      sumHistoricalDividendEvents(events, 'USD', 'EUR', {
        USD: usd,
        EUR: [
          { date: '2024-01-01', close: 1400 },
          { date: '2024-01-10', close: 1500 },
        ],
      }),
    ).toBeCloseTo(15.8261904762);
  });
  it('handles native, cross currency, holiday fallback, and unavailable rates', () => {
    expect(convertHistoricalDividend(5, 'USD', 'USD', '2024-01-10', {})).toBe(5);
    expect(convertHistoricalDividend(1400, 'KRW', 'USD', '2024-01-10', { USD: usd })).toBe(1);
    expect(findHistoricalRate(usd, '2024-01-03')).toBe(1300);
    expect(findHistoricalRate(usd, '2024-01-09')).toBeNull();
    expect(findHistoricalRate(usd, '2023-12-30')).toBeNull();
    expect(findHistoricalRate([{ date: '2024-01-01', close: 0 }], '2024-01-01')).toBeNull();
    expect(convertHistoricalDividend(1, 'USD', 'EUR', '2024-01-10', { USD: usd })).toBeNull();
  });
});
