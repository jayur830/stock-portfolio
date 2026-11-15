import dayjs from 'dayjs';

import type { AppliedCalculation } from '@/types';

import {
  comparePortfolios,
  readPortfolios,
  restorePortfolio,
  savePortfolio,
  writePortfolios,
} from './saved-portfolios';
export const example: AppliedCalculation = {
  calculatedCategory: 'dividend',
  totalInvestment: 1000000,
  targetAnnualDividend: 0,
  requiredInvestment: 1000000,
  weightedDividendYield: 0.1,
  compoundSettings: { monthlyContribution: 0, years: 10, reinvestDividend: true, priceGrowthRate: 3 },
  stocks: [
    {
      ticker: 'TEST',
      name: '테스트',
      currency: 'KRW',
      price: 10000,
      yield: 10,
      ratio: 100,
      enabled: true,
      dividendMonths: [1, 7],
      purchaseDate: dayjs('2024-01-01'),
    },
  ],
  exchangeRates: { USD: 1400 },
  stockDividends: [],
};
beforeEach(() => localStorage.clear());
it('serializes dates and preserves originals after restoring, editing and saving', () => {
  const a = savePortfolio(example, '원본');
  writePortfolios([a]);
  const restored = restorePortfolio(readPortfolios()[0]);
  expect(restored.stocks[0].purchaseDate?.format('YYYY-MM-DD')).toBe('2024-01-01');
  restored.stocks[0].dividendMonths.push(2);
  restored.exchangeRates.USD = 2000;
  expect(readPortfolios()[0].stocks[0].dividendMonths).toEqual([1, 7]);
  expect(readPortfolios()[0].exchangeRates.USD).toBe(1400);
});
it('compares three at a common investment, without taxing monthly dividends twice', () => {
  const items = ['1', '2', '3'].map((name) => savePortfolio(example, name));
  items[2].investment = 5000000;
  const result = comparePortfolios(items, 1000000, items[0].id);
  expect(result.map((r) => r.annualGross)).toEqual([100000, 100000, 100000]);
  expect(result.map((r) => r.annualNet)).toEqual([84600, 84600, 84600]);
  expect(result[0].monthlyGross[0]).toBe(50000);
  expect(result[0].monthlyNet[0]).toBe(42300);
  items[1].stocks[0].yield = 20;
  expect(comparePortfolios(items, 1000000, items[0].id)[1].annualGross - result[0].annualGross).toBe(100000);
  expect(items[0].stocks[0].yield).toBe(10);
});
it('rejects corrupt versions and invalid comparison', () => {
  localStorage.setItem('dividend-lab-portfolios-v1', '[{"version":5}]');
  expect(() => readPortfolios()).toThrow();
  expect(() => comparePortfolios([], 0, '')).toThrow();
});

it('calculates utilization, residual cash, monthly distribution and currency shares from actual lots', () => {
  const portfolio = {
    ...example,
    stocks: [
      { ...example.stocks[0], ticker: 'A', price: 30000, yield: 12, ratio: 40, dividendMonths: [1] },
      { ...example.stocks[0], ticker: 'A', price: 30000, yield: 12, ratio: 30, dividendMonths: [3] },
      {
        ...example.stocks[0],
        ticker: 'B',
        currency: 'USD' as const,
        price: 5,
        yield: 0,
        ratio: 10,
        dividendMonths: [1],
      },
      { ...example.stocks[0], ticker: 'ZERO', price: 2000000, yield: 10, ratio: 10, dividendMonths: [2] },
    ],
    exchangeRates: { USD: 1500 },
  };
  const item = savePortfolio(portfolio, 'metrics');
  const [result] = comparePortfolios([item, { ...item, id: 'other' }], 200000, 'other');
  expect(result.metrics.invested).toBeLessThan(200000);
  expect(result.metrics.cash).toBe(200000 - result.metrics.invested);
  expect(result.metrics.utilization).toBeCloseTo((result.metrics.invested / 200000) * 100);
  expect(result.metrics.stockCount).toBe(2);
  expect(result.metrics.incomeMonths).toBe(2);
  expect(result.metrics.noIncomeMonths).toBe(10);
});
it('returns unavailable ratios when denominators are zero', () => {
  const zero = savePortfolio({ ...example, stocks: [{ ...example.stocks[0], yield: 0, price: 1000000 }] }, 'zero');
  const [result] = comparePortfolios([zero, { ...zero, id: 'other' }], 200000, 'other');
  expect(result.metrics.grossYield).toBe(0);
  expect(result.metrics.maxStockShare).toBeNull();
  expect(result.metrics.topThreeShare).toBeNull();
});
