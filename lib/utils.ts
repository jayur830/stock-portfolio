import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Stock } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * URL 파라미터 설정
 * @param params URLSearchParams의 인자 타입
 */
/** @client */
export function setSearchParams(pathname: string, params: { [key: string]: string | number | boolean | null | undefined }) {
  const filteredParams = Object.fromEntries(Object.entries(params).filter(([_, value]) => value != null && value !== ''));
  const qs = new URLSearchParams(filteredParams as any);
  window.history.replaceState({}, '', `${pathname === '/' ? '' : pathname}${qs ? `?${qs}` : ''}`);
}

/** 국내 배당소득세율 15.4% (소득세 14% + 지방소득세 1.4%) */
export const DIVIDEND_TAX_RATE = 0.154;

/** 해외 배당소득세율 (미국 등) 15% */
export const FOREIGN_DIVIDEND_TAX_RATE = 0.15;

/** 분리과세 기준 금액 */
export const SEPARATE_TAX_THRESHOLD = 20000000; // 2,000만원

/** 종합소득세 누진세율 구간 */
export const TAX_BRACKETS: {
  /** 구간 상한액 */
  limit: number;
  /** 구간 세율 */
  rate: number;
  /** 구간 누진공제액 */
  deduction: number;
}[] = [
  {
    limit: 14000000,
    rate: 0.06,
    deduction: 0,
  },
  {
    limit: 50000000,
    rate: 0.15,
    deduction: 1260000,
  },
  {
    limit: 88000000,
    rate: 0.24,
    deduction: 5760000,
  },
  {
    limit: 150000000,
    rate: 0.35,
    deduction: 15440000,
  },
  {
    limit: 300000000,
    rate: 0.38,
    deduction: 19940000,
  },
  {
    limit: 500000000,
    rate: 0.40,
    deduction: 25940000,
  },
  {
    limit: 1000000000,
    rate: 0.42,
    deduction: 35940000,
  },
  {
    limit: Infinity,
    rate: 0.45,
    deduction: 65940000,
  },
];

/** 금액을 KRW로 환산 */
export function convertToKRW(
  /** 금액 */
  amount: number,
  /** 통화 */
  currency: Stock['currency'],
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
  const shares = investmentAmount / priceInKRW;
  const dividendPerShare = priceInKRW * (stock.yield / 100);
  return Math.floor(shares * dividendPerShare);
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

  /** 통화에 따라 세율 선택 */
  const taxRate = stock.currency === 'USD' ? FOREIGN_DIVIDEND_TAX_RATE : DIVIDEND_TAX_RATE;

  return stock.dividendMonths.reduce((acc, month) => {
    acc[month] = +((annualDividend / stock.dividendMonths.length) * (1 - taxRate)).toFixed(2);
    return acc;
  }, {} as Record<number, number>);
}

/** 월별 배당금 배열 생성 */
export function mergeMonthlyDividends(
  /** 종목별 월별 배당금 */
  stockDividends: Array<{ monthlyDividends: Record<number, number> }>,
): number[] {
  return stockDividends
    .reduce((acc, { monthlyDividends }) => {
    /** reduce로 리팩토링 */
      Object.entries(monthlyDividends).forEach(([month, amount]) => {
        acc[Number(month) - 1] += amount;
      });
      return acc;
    }, Array(12).fill(0) as number[])
    .map((value) => +value.toFixed(2));
}

/**
 * 종합소득세 추가 납부세액 계산
 * @param annualDividendIncome 연간 배당소득(세전) - 국내 + 해외 전체
 * @param foreignDividendIncome 해외 배당소득(세전)
 * @returns 추가 납부세액 (양수: 납부, 음수: 환급), null이면 분리과세 종결
 */
export function calculateComprehensiveTax(
  annualDividendIncome: number,
  foreignDividendIncome: number = 0,
): number | null {
  /** 2,000만원 이하면 분리과세로 종결 */
  if (annualDividendIncome <= SEPARATE_TAX_THRESHOLD) {
    return null;
  }

  /** 국내 배당소득 */
  const domesticDividendIncome = annualDividendIncome - foreignDividendIncome;

  /** 이미 원천징수된 세액 */
  const domesticWithheldTax = domesticDividendIncome * DIVIDEND_TAX_RATE; // 국내: 15.4%
  const foreignWithheldTax = foreignDividendIncome * FOREIGN_DIVIDEND_TAX_RATE; // 해외: 15%
  const totalWithheldTax = domesticWithheldTax + foreignWithheldTax;

  /** 2,000만원 이하: 분리과세 선택 (15.4%) */
  const separateTax = SEPARATE_TAX_THRESHOLD * DIVIDEND_TAX_RATE;

  /** 2,000만원 초과분 */
  const excessIncome = annualDividendIncome - SEPARATE_TAX_THRESHOLD;

  /** 초과분 중 국내/해외 배당 비율로 구분 */
  const domesticRatio = domesticDividendIncome / annualDividendIncome;
  const domesticExcess = excessIncome * domesticRatio;
  const foreignExcess = excessIncome * (1 - domesticRatio);

  /** 배당세액공제: 국내 배당만 Gross-up (11% 가산) */
  const grossUpDomestic = domesticExcess * 1.11;

  /** 종합과세 과세표준 = Gross-up 국내 배당 + 해외 배당 */
  const comprehensiveIncome = grossUpDomestic + foreignExcess;

  /** 누진세율 구간 찾기 */
  const bracket = TAX_BRACKETS.find((b) => comprehensiveIncome <= b.limit)!;
  /** 소득세 = 과세표준 * 세율 - 누진공제 */
  const incomeTax = comprehensiveIncome * bracket.rate - bracket.deduction;
  /** 지방소득세 = 소득세 * 지방소득세율 (10%) */
  const localTax = incomeTax * 0.1;

  /** 배당세액공제 = Gross-up 금액 * 15% (일반기업 기준) */
  const dividendTaxCredit = grossUpDomestic * 0.15;

  /** 총 세액 = 분리과세분 + 종합과세분(소득세 + 지방소득세) - 배당세액공제 */
  const totalTax = separateTax + incomeTax + localTax - dividendTaxCredit;

  /** 외국납부세액공제: 해외에서 이미 낸 세금 중 공제 가능한 금액 */
  /** 공제한도 = (해외소득 / 총소득) * 산출세액 */
  const foreignTaxCreditLimit = (foreignDividendIncome / annualDividendIncome) * totalTax;
  /** 실제 공제액 = min(해외 납부세액, 공제한도) */
  const foreignTaxCredit = Math.min(foreignWithheldTax, foreignTaxCreditLimit);

  /** 추가 납부세액 = 총 세액 - 이미 원천징수된 세액 - 외국납부세액공제 */
  return Math.round(totalTax - totalWithheldTax - foreignTaxCredit);
}
