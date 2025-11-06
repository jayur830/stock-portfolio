export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface Stock {
  name: string;
  ticker: string;
  price: number;
  dividend: number;
  dividendFrequency: DividendFrequency;
  yield: number;
  ratio: number;
}
