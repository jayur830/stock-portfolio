import type { Dayjs } from 'dayjs';

import type { DividendGrowthInfo } from '@/lib/dividend-growth';

/** 계산 탭 (배당금 계산 / 투자금 계산) */
export type Category = 'dividend' | 'investment';

/** 지원 통화 */
export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'HKD';

export interface Stock {
  /** 종목명 */
  name: string;
  /** 종목코드 */
  ticker: string;
  /** 주가 */
  price: number;
  /** 통화 */
  currency: Currency;
  /** 배당 지급 월 */
  dividendMonths: number[];
  /** 배당률 */
  yield: number;
  /** 비율 */
  ratio: number;
  /** 매수일 */
  purchaseDate?: Dayjs;
  /** 활성화 여부 */
  enabled: boolean;
  /** 배당 성장 지표 (5년 CAGR, 연속 증액 연수, 배지) */
  dividendGrowth?: DividendGrowthInfo | null;
}

export interface StockDividend {
  /** 연 배당금 */
  annualDividend: number;
  /** 월별 배당금 */
  monthlyDividends: Record<number, number>;
  /** 해외종목 여부 */
  isForeign: boolean;
  /** 배당소득세율 */
  taxRate: number;
}

export interface FormValues {
  /** 총 투자금 */
  totalInvestment: number;
  /** 목표 연 배당금 */
  targetAnnualDividend: number;
  /** 환율 정보 */
  exchangeRates: { [key in Currency]?: number };
  /** 주식 종목 목록 */
  stocks: Stock[];
  /** 결과 계산 여부 */
  calculatedCategory?: Category;
  /** 종목별 배당정보 리스트 */
  stockDividends: StockDividend[];
  /** 차트 데이터 */
  chartData?: {
    /** 총 투자금 */
    totalInvestment: number;
    /** 환율 정보 */
    exchangeRates: { [key in Currency]?: number };
    /** 주식 종목 목록 */
    stocks: Stock[];
  };
}
