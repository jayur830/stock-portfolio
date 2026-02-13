import type { Stock } from '@/types';

import QuantityPerStock from './quantity-per-stock';

const containerStyle = {
  dividend: 'flex flex-col gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg',
  investment: 'flex flex-col gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg',
};

const labelStyle = {
  dividend: 'text-sm font-semibold text-green-900 dark:text-green-100',
  investment: 'text-sm font-semibold text-purple-900 dark:text-purple-100',
};

export interface CountPerStockProps {
  tab: 'dividend' | 'investment';
  chartData: {
    totalInvestment: number;
    exchangeRates: {
      [key: string]: number;
    };
    stocks: Stock[];
  } | null;
}

export default function CountPerStock({ tab, chartData }: CountPerStockProps) {
  if (!chartData || chartData.stocks.length === 0) {
    return <></>;
  }

  return (
    <div className={containerStyle[tab]}>
      <h3 className={labelStyle[tab]}>종목별 보유 수량</h3>
      <QuantityPerStock exchangeRates={chartData.exchangeRates} stocks={chartData.stocks} totalInvestment={chartData.totalInvestment} />
    </div>
  );
}
