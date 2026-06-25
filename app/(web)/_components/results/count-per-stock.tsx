import { useController, useFormContext } from 'react-hook-form';

import { convertToKRW } from '@/lib/utils';
import type { Category, FormValues } from '@/types';

const containerStyle = {
  dividend: 'flex flex-col gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg',
  investment: 'flex flex-col gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg',
};

const labelStyle = {
  dividend: 'text-sm font-semibold text-green-900 dark:text-green-100',
  investment: 'text-sm font-semibold text-purple-900 dark:text-purple-100',
};

export interface CountPerStockProps {
  /** 탭 - 배당금 계산 / 투자금 계산 */
  tab: Category;
}

export default function CountPerStock({ tab }: CountPerStockProps) {
  const { control } = useFormContext<FormValues>();
  const { field: { value: chartData } } = useController({ control, name: 'chartData' });

  if (!chartData || chartData.stocks.length === 0) {
    return <></>;
  }

  return (
    <div className={containerStyle[tab]}>
      <h3 className={labelStyle[tab]}>종목별 보유 수량</h3>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
        {chartData.stocks.map((stock, index) => {
          const investmentAmount = (chartData.totalInvestment * (stock.ratio || 0)) / 100;
          const priceInKRW = convertToKRW(stock.price, stock.currency, chartData.exchangeRates);
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
    </div>
  );
}
