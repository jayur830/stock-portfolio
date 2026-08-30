import { useController, useFormContext } from 'react-hook-form';

import { convertToKRW } from '@/lib/utils';
import type { FormValues } from '@/types';

export default function CountPerStock() {
  const { control } = useFormContext<FormValues>();
  const { field: { value: chartData } } = useController({ control, name: 'chartData' });

  if (!chartData || chartData.stocks.length === 0) {
    return null;
  }

  return (
    <div className="result-surface">
      <h3 className="result-surface-title">종목별 보유 수량</h3>
      <div className="quantity-grid">
        {chartData.stocks.map((stock, index) => {
          const investmentAmount = (chartData.totalInvestment * (stock.ratio || 0)) / 100;
          const priceInKRW = convertToKRW(stock.price, stock.currency, chartData.exchangeRates);
          const quantity = priceInKRW > 0 ? Math.floor(investmentAmount / priceInKRW) : 0;
          return (
            <div
              className="quantity-item"
              key={index}
            >
              <span className="quantity-name">
                {stock.name ? `[${stock.ticker}] ${stock.name}` : stock.ticker}
              </span>
              <span className="quantity-value">
                {quantity.toLocaleString('ko-KR')}주
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
