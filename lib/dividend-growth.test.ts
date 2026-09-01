import { calculateDividendGrowth, DIVIDEND_ARISTOCRATS, DIVIDEND_CHAMPIONS, DIVIDEND_KINGS } from './dividend-growth';

describe('dividend-growth', () => {
  it('identifies Dividend Kings correctly', () => {
    const info = calculateDividendGrowth('KO');
    expect(info.badge?.type).toBe('king');
    expect(info.growthStreak).toBe(DIVIDEND_KINGS.KO.years);
    expect(info.badge?.label).toContain('배당킹');
  });

  it('identifies Dividend Aristocrats correctly', () => {
    const info = calculateDividendGrowth('O');
    expect(info.badge?.type).toBe('aristocrat');
    expect(info.growthStreak).toBe(DIVIDEND_ARISTOCRATS.O.years);
    expect(info.badge?.label).toContain('배당귀족');
  });

  it('identifies Dividend Champions (e.g. SCHD) correctly', () => {
    const info = calculateDividendGrowth('SCHD');
    expect(info.badge?.type).toBe('champion');
    expect(info.growthStreak).toBe(DIVIDEND_CHAMPIONS.SCHD.years);
    expect(info.badge?.label).toContain('배당성취');
  });

  it('calculates 5Y CAGR from dividend history correctly', () => {
    const history = [
      { date: '2018-03-15', amount: 1.0 },
      { date: '2019-03-15', amount: 1.1 },
      { date: '2020-03-15', amount: 1.2 },
      { date: '2021-03-15', amount: 1.3 },
      { date: '2022-03-15', amount: 1.4 },
      { date: '2023-03-15', amount: 1.61 }, // ~10% CAGR over 5 years (1.61 / 1.0)^(1/5) - 1 ≈ 10%
    ];

    const info = calculateDividendGrowth('CUSTOM', history);
    expect(info.cagr5Y).toBe(10);
    expect(info.growthStreak).toBeGreaterThanOrEqual(4);
  });
});
