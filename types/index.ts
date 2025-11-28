import type { Dayjs } from 'dayjs';

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
}

export interface FormValues {
  totalInvestment: number;
  targetAnnualDividend: number;
  exchangeRates: { [key in Currency]?: number };
  stocks: Stock[];
}
