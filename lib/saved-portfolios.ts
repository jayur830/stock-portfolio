import dayjs from 'dayjs';

import type { AppliedCalculation, FormValues, Stock } from '@/types';

import { calculateStockMonthlyDividends, convertToKRW, getStockDividends } from './utils';

export interface SavedPortfolio {
  version: 1;
  id: string;
  name: string;
  savedAt: string;
  mode: 'dividend' | 'investment';
  investment: number;
  targetAnnualDividend: number;
  stocks: (Omit<Stock, 'purchaseDate'> & { purchaseDate?: string })[];
  exchangeRates: FormValues['exchangeRates'];
}
export const STORAGE_KEY = 'dividend-lab-portfolios-v1';
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function validateSaved(value: unknown): asserts value is SavedPortfolio[] {
  if (
    !Array.isArray(value) ||
    value.some(
      (p) =>
        !p ||
        p.version !== 1 ||
        typeof p.id !== 'string' ||
        !p.id ||
        typeof p.name !== 'string' ||
        !p.name.trim() ||
        !Number.isFinite(Date.parse(p.savedAt)) ||
        !['dividend', 'investment'].includes(p.mode) ||
        !finite(p.investment) ||
        !finite(p.targetAnnualDividend) ||
        !p.exchangeRates ||
        Object.values(p.exchangeRates).some((v) => !finite(v)) ||
        !Array.isArray(p.stocks) ||
        p.stocks.some(
          (s: SavedPortfolio['stocks'][number]) =>
            !s ||
            typeof s.name !== 'string' ||
            typeof s.ticker !== 'string' ||
            !['KRW', 'USD', 'EUR', 'JPY', 'GBP', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD'].includes(s.currency) ||
            typeof s.enabled !== 'boolean' ||
            !finite(s.price) ||
            !finite(s.yield) ||
            !finite(s.ratio) ||
            !Array.isArray(s.dividendMonths) ||
            s.dividendMonths.some((m) => !Number.isInteger(m) || m < 1 || m > 12) ||
            (s.purchaseDate !== undefined && !dayjs(s.purchaseDate).isValid()),
        ),
    )
  )
    throw new Error('저장 데이터의 형식 또는 버전을 확인할 수 없습니다.');
  if (new Set(value.map((p) => p.id)).size !== value.length) throw new Error('저장 ID가 중복되었습니다.');
}
export function readPortfolios(): SavedPortfolio[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  validateSaved(parsed);
  return parsed;
}
export function writePortfolios(items: SavedPortfolio[]) {
  validateSaved(items);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
export function savePortfolio(applied: AppliedCalculation, name: string): SavedPortfolio {
  if (!name.trim()) throw new Error('이름을 입력해주세요.');
  return JSON.parse(
    JSON.stringify({
      version: 1,
      id: crypto.randomUUID(),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      mode: applied.calculatedCategory,
      investment: applied.requiredInvestment,
      targetAnnualDividend: applied.targetAnnualDividend || 0,
      stocks: (applied.configurationStocks || applied.stocks).map((s) => ({
        ...s,
        purchaseDate: s.purchaseDate?.format('YYYY-MM-DD'),
      })),
      exchangeRates: applied.exchangeRates,
    }),
  );
}
export function restorePortfolio(item: SavedPortfolio): FormValues {
  const copy: SavedPortfolio = JSON.parse(JSON.stringify(item));
  return {
    totalInvestment: copy.investment,
    targetAnnualDividend: copy.targetAnnualDividend,
    stocks: copy.stocks.map((s) => ({ ...s, purchaseDate: s.purchaseDate ? dayjs(s.purchaseDate) : undefined })),
    exchangeRates: copy.exchangeRates,
    stockDividends: [],
  };
}
export function comparePortfolios(items: SavedPortfolio[], investment: number, baseline: string) {
  if (items.length < 2 || !finite(investment) || investment <= 0 || !items.some((p) => p.id === baseline))
    throw new Error('2개 이상 선택하고 기준과 유효한 공통 투자금을 입력해주세요.');
  return items.map((item) => {
    const form = restorePortfolio(item);
    const stocks = form.stocks.filter((s) => s.enabled);
    if (
      !stocks.length ||
      stocks.reduce((sum, s) => sum + s.ratio, 0) > 100 ||
      stocks.some((s) => s.price <= 0 || (s.currency !== 'KRW' && !(form.exchangeRates[s.currency]! > 0)))
    )
      throw new Error(item.name + ': 종목·비중·환율을 확인해주세요.');
    const active = stocks.map((stock, index) => ({ stock, index }));
    const dividends = getStockDividends(stocks, investment, form.exchangeRates);
    const positions = active
      .map(({ stock }, index) => {
        const priceKRW = convertToKRW(stock.price, stock.currency, form.exchangeRates);
        const quantity = priceKRW > 0 ? Math.floor((investment * stock.ratio) / 100 / priceKRW) : 0;
        return { stock, dividend: dividends[index], quantity, cost: quantity * priceKRW };
      })
      .filter((position) => position.quantity > 0);
    const actualCost = positions.reduce((sum, p) => sum + p.cost, 0);
    const monthlyGross = Array(12).fill(0) as number[];
    const monthlyNet = Array(12).fill(0) as number[];
    positions.forEach(({ stock, dividend: d }) => {
      const gross = calculateStockMonthlyDividends(
        stock.dividendMonths,
        stock.currency,
        d.annualDividend,
        undefined,
        0,
      );
      Object.entries(gross).forEach(([m, amount]) => (monthlyGross[+m - 1] += amount));
      Object.entries(d.monthlyDividends).forEach(([m, amount]) => (monthlyNet[+m - 1] += amount));
    });
    const annualGross = positions.reduce((sum, p) => sum + p.dividend.annualDividend, 0);
    const annualNet = positions.reduce((sum, p) => sum + p.dividend.annualDividend * (1 - p.dividend.taxRate), 0);
    const monthsWithIncome = monthlyGross.filter((value) => value > 0).length;
    const monthlyNetValues = monthlyNet;
    const grouped = new Map<string, typeof positions>();
    positions.forEach((position) =>
      grouped.set(position.stock.ticker, [...(grouped.get(position.stock.ticker) || []), position]),
    );
    const holdings = [...grouped.values()].map((group) => ({
      ticker: group[0].stock.ticker,
      cost: group.reduce((sum, p) => sum + p.cost, 0),
      gross: group.reduce((sum, p) => sum + p.dividend.annualDividend, 0),
    }));
    const stockWeights = holdings.map((h) => (actualCost > 0 ? (h.cost / actualCost) * 100 : 0)).sort((a, b) => b - a);
    const monthlyAvg = monthlyNetValues.reduce((sum, value) => sum + value, 0) / 12;
    return {
      id: item.id,
      name: item.name,
      investment,
      baseline,
      annualGross: Math.round(annualGross),
      annualNet: Math.round(annualNet),
      monthlyGross: monthlyGross.map(Math.round),
      monthlyNet: monthlyNet.map(Math.round),
      metrics: {
        grossYield: investment > 0 ? (annualGross / investment) * 100 : null,
        netYield: investment > 0 ? (annualNet / investment) * 100 : null,
        invested: actualCost,
        cash: investment - actualCost,
        utilization: investment > 0 ? (actualCost / investment) * 100 : null,
        incomeMonths: monthsWithIncome,
        noIncomeMonths: 12 - monthsWithIncome,
        monthlyNetMin: Math.min(...monthlyNetValues),
        monthlyNetMax: Math.max(...monthlyNetValues),
        monthlyNetAverage: monthlyAvg,
        stockCount: holdings.length,
        maxStockShare: stockWeights.length ? stockWeights[0] : null,
        topThreeShare: stockWeights.length ? stockWeights.slice(0, 3).reduce((a, b) => a + b, 0) : null,
      },
    };
  });
}
