import { useController, useFormContext } from 'react-hook-form';

import { calculateDividendGrowth } from '@/lib/dividend-growth';
import { cn, convertToKRW } from '@/lib/utils';
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
          const growthInfo = stock.dividendGrowth || (stock.ticker ? calculateDividendGrowth(stock.ticker) : null);

          return (
            <div
              className="quantity-item"
              key={index}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {growthInfo?.badge && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0',
                      growthInfo.badge.colorClass,
                    )}
                    title={growthInfo.badge.description}
                  >
                    <span>{growthInfo.badge.icon}</span>
                    <span>{growthInfo.badge.label}</span>
                  </span>
                )}
                <span className="quantity-name truncate">
                  {stock.name ? `[${stock.ticker}] ${stock.name}` : stock.ticker}
                </span>
              </div>
              <span className="quantity-value shrink-0 font-bold">
                {quantity.toLocaleString('ko-KR')}주
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
