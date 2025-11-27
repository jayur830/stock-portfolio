import type { Dayjs } from 'dayjs';

export interface Stock {
  /** 종목명 */
  name: string;
  /** 종목코드 */
  ticker: string;
  /** 주가 */
  price: number;
  /** 통화 */
  currency: 'KRW' | 'USD';
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
  exchangeRate: number;
  stocks: Stock[];
}
