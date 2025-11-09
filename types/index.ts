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
  /** 배당 입력 방식 ('amount' | 'yield') */
  dividendInputType?: 'amount' | 'yield';
}

export interface FormValues {
  totalInvestment: number;
  targetAnnualDividend: number;
  exchangeRate: number;
  stocks: Stock[];
}
