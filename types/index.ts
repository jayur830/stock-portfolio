export interface Stock {
  /** 종목명 */
  name: string;
  /** 종목코드 */
  ticker: string;
  /** 주가 */
  price: number;
  /** 통화 */
  currency: string;
  /** 주당 배당금 */
  dividend: number;
  /** 배당통화 */
  dividendCurrency: string;
  /** 배당 지급 월 */
  dividendMonths: number[];
  /** 배당률 */
  yield: number;
  /** 비율 */
  ratio: number;
  /** 매수일 */
  purchaseDate?: Date | string;
}

export interface FormValues {
  totalInvestment: number;
  targetAnnualDividend: number;
  exchangeRate: number;
  stocks: Array<{
    name: string;
    ticker: string;
    price: number;
    currency: string;
    dividend: number;
    dividendCurrency: string;
    dividendMonths: number[];
    yield: number;
    ratio: number;
    purchaseDate?: Date | string;
  }>;
}
