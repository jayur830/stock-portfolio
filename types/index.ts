export interface Stock {
  name: string;
  ticker: string;
  price: number;
  dividend: number;
  dividendMonths: number[]; // 1~12월 중 배당을 받는 달
  yield: number;
  ratio: number;
}
