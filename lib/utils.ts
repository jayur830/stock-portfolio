import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Stock } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 금액을 KRW로 환산 */
export function convertToKRW(
  /** 금액 */
  amount: number,
  /** 통화 */
  currency: string,
  /** 환율 */
  exchangeRate: number,
): number {
  return currency === 'USD' ? amount * exchangeRate : amount;
}

/** 단일 종목의 연 배당금 계산 */
export function calculateStockAnnualDividend(
  /** 종목 */
  stock: Stock,
  /** 투자금 */
  investmentAmount: number,
  /** 환율 */
  exchangeRate: number,
): number {
  const priceInKRW = convertToKRW(stock.price, stock.currency, exchangeRate);
  const dividendInKRW = convertToKRW(stock.dividend, stock.dividendCurrency, exchangeRate);
  const shares = investmentAmount / priceInKRW;
  return shares * dividendInKRW;
}

/** 단일 종목의 월별 배당금 계산 */
export function calculateStockMonthlyDividends(
  /** 종목 */
  stock: Stock,
  /** 연 배당금 */
  annualDividend: number,
): Record<number, number> {
  if (!stock.dividendMonths || stock.dividendMonths.length === 0) {
    return {};
  }

  return stock.dividendMonths.reduce((acc, month) => {
    acc[month] = (annualDividend / stock.dividendMonths.length) * (1 - 0.154);
    return acc;
  }, {} as Record<number, number>);
}

/** 배당 수익률 계산 */
export function calculateDividendYield(
  /** 종목 */
  stock: Stock,
  /** 환율 */
  exchangeRate: number,
): number {
  /** 종목의 현재가를 KRW로 환산 */
  const priceInKRW = convertToKRW(stock.price, stock.currency, exchangeRate);
  /** 종목의 배당금을 KRW로 환산 */
  const dividendInKRW = convertToKRW(stock.dividend, stock.dividendCurrency, exchangeRate);
  return dividendInKRW / priceInKRW;
}

/** 월별 배당금 배열 생성 */
export function mergeMonthlyDividends(
  /** 종목별 월별 배당금 */
  stockDividends: Array<{ monthlyDividends: Record<number, number> }>,
): number[] {
  return stockDividends.reduce((acc, { monthlyDividends }) => {
    /** reduce로 리팩토링 */
    Object.entries(monthlyDividends).forEach(([month, amount]) => {
      acc[Number(month) - 1] += amount;
    });
    return acc;
  }, Array(12).fill(0) as number[]);
}
