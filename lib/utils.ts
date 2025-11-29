import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import dayjs from 'dayjs';
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

/**
 * Stocks를 Base64로 인코딩
 * @param stocks 종목 리스트
 * @returns Base64로 인코딩된 문자열
 */
export function encodeStocksToBase64(stocks: Stock[]): string {
  try {
    // Dayjs 객체를 ISO 문자열로 변환
    const serializedStocks = stocks.map((stock) => ({
      ...stock,
      purchaseDate: stock.purchaseDate ? stock.purchaseDate.toISOString() : undefined,
    }));
    const jsonString = JSON.stringify(serializedStocks);
    // Base64 인코딩 (브라우저 환경)
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error('Failed to encode stocks:', error);
    return '';
  }
}

/**
 * Base64에서 Stocks 디코딩
 * @param base64String Base64로 인코딩된 문자열
 * @returns 종목 리스트
 */
export function decodeStocksFromBase64(base64String: string): Stock[] {
  try {
    // Base64 디코딩
    const jsonString = decodeURIComponent(atob(base64String));
    const parsed = JSON.parse(jsonString);
    // ISO 문자열을 Dayjs 객체로 변환
    return parsed.map((stock: any) => ({
      ...stock,
      purchaseDate: stock.purchaseDate ? dayjs(stock.purchaseDate) : undefined,
    }));
  } catch (error) {
    console.error('Failed to decode stocks:', error);
    return [];
  }
}

/** 국내 배당소득세율 15.4% (소득세 14% + 지방소득세 1.4%) */
export const DIVIDEND_TAX_RATE = 0.154;

/** 국가별 배당소득세율 */
export const FOREIGN_TAX_RATES: { [key: string]: number } = {
  USD: 0.15, // 미국
  EUR: 0.26375, // 유럽 (독일 기준, 국가마다 상이)
  JPY: 0.15315, // 일본
  GBP: 0.0, // 영국 (배당세 면제)
  CNY: 0.10, // 중국
  AUD: 0.0, // 호주 (배당세 면제)
  CAD: 0.25, // 캐나다
  CHF: 0.35, // 스위스
  HKD: 0.0, // 홍콩 (배당세 없음)
};

/** 해외 배당소득세율 (미국 기준, 하위 호환성) */
export const FOREIGN_DIVIDEND_TAX_RATE = FOREIGN_TAX_RATES.USD;

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
  { limit: 14000000, rate: 0.06, deduction: 0 },
  { limit: 50000000, rate: 0.15, deduction: 1260000 },
  { limit: 88000000, rate: 0.24, deduction: 5760000 },
  { limit: 150000000, rate: 0.35, deduction: 15440000 },
  { limit: 300000000, rate: 0.38, deduction: 19940000 },
  { limit: 500000000, rate: 0.40, deduction: 25940000 },
  { limit: 1000000000, rate: 0.42, deduction: 35940000 },
  { limit: Infinity, rate: 0.45, deduction: 65940000 },
];

/** 금액을 KRW로 환산 */
export function convertToKRW(
  /** 금액 */
  amount: number,
  /** 통화 */
  currency: Stock['currency'],
  /** 환율 정보 */
  exchangeRates: { [key: string]: number },
): number {
  if (currency === 'KRW') {
    return amount;
  }

  const rate = exchangeRates[currency];
  if (!rate || rate <= 0) {
    return 0;
  }

  return amount * rate;
}

/** 단일 종목의 연 배당금 계산 */
export function calculateStockAnnualDividend(
  /** 종목 */
  stock: Stock,
  /** 투자금 */
  investmentAmount: number,
  /** 환율 정보 */
  exchangeRates: { [key: string]: number },
): number {
  const priceInKRW = convertToKRW(stock.price, stock.currency, exchangeRates);
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
  const taxRate = stock.currency === 'KRW' ? DIVIDEND_TAX_RATE : (FOREIGN_TAX_RATES[stock.currency] ?? FOREIGN_DIVIDEND_TAX_RATE);

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
 * @param averageForeignTaxRate 평균 해외 배당소득세율 (가중평균)
 * @returns 추가 납부세액 (양수: 납부, 음수: 환급), null이면 분리과세 종결
 */
export function calculateComprehensiveTax(
  annualDividendIncome: number,
  foreignDividendIncome: number = 0,
  averageForeignTaxRate: number = FOREIGN_DIVIDEND_TAX_RATE,
): number | null {
  /** 2,000만원 이하면 분리과세로 종결 */
  if (annualDividendIncome <= SEPARATE_TAX_THRESHOLD) {
    return null;
  }

  /** 국내 배당소득 */
  const domesticDividendIncome = annualDividendIncome - foreignDividendIncome;

  /** 이미 원천징수된 세액 */
  const domesticWithheldTax = domesticDividendIncome * DIVIDEND_TAX_RATE; // 국내: 15.4%
  const foreignWithheldTax = foreignDividendIncome * averageForeignTaxRate; // 해외: 국가별 세율 (외국납부세액공제 계산용)

  /** 분리과세: 국내 배당 중 2,000만원 이하만 해당 (해외 배당은 무조건 종합과세) */
  const domesticSeparateTaxIncome = Math.min(domesticDividendIncome, SEPARATE_TAX_THRESHOLD);
  const separateTax = domesticSeparateTaxIncome * DIVIDEND_TAX_RATE;

  /** 종합과세 대상: 국내 배당 중 2,000만원 초과 + 해외 배당 전액 */
  const domesticExcess = Math.max(0, domesticDividendIncome - SEPARATE_TAX_THRESHOLD);
  const foreignExcess = foreignDividendIncome; // 해외 배당은 전액 종합과세

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

  /** 추가 납부세액 = 총 세액 - 국내 원천징수 - 외국납부세액공제 */
  return Math.round(totalTax - domesticWithheldTax - foreignTaxCredit);
}
