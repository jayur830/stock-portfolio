import { convertToKRW } from '@/lib/utils';
import type { Stock } from '@/types';

const containerStyle = {
  dividend: 'flex flex-col gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg',
  investment: 'flex flex-col gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg',
};

const labelStyle = {
  dividend: 'text-sm font-semibold text-green-900 dark:text-green-100',
  investment: 'text-sm font-semibold text-purple-900 dark:text-purple-100',
};

interface QuantityPerStockProps {
  exchangeRates: { [key: string]: number };
  stocks: Stock[];
  totalInvestment: number;
}

function QuantityPerStock({ exchangeRates, stocks, totalInvestment }: QuantityPerStockProps) {
  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
      {stocks.map((stock, index) => {
        const investmentAmount = (totalInvestment * (stock.ratio || 0)) / 100;
        const priceInKRW = convertToKRW(stock.price, stock.currency, exchangeRates);
        const quantity = priceInKRW > 0 ? Math.floor(investmentAmount / priceInKRW) : 0;
        return (
          <div
            className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-grey-100 dark:border-gray-700"
            key={index}
          >
            <span className="md:block hidden text-sm font-medium text-gray-600 dark:text-gray-400">
              {stock.name ? `[${stock.ticker}] ${stock.name}` : stock.ticker}
            </span>
            <span className="md:hidden block text-sm font-medium text-gray-600 dark:text-gray-400">
              {stock.ticker}
            </span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {quantity.toLocaleString('ko-KR')}주
            </span>
          </div>
        );
      })}
    </div>
  );
}

export interface CountPerStockProps {
  /** 탭 - 배당금 계산 / 투자금 계산 */
  tab: 'dividend' | 'investment';
  /** 차트 데이터 */
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
