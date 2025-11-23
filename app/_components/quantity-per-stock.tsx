import { convertToKRW } from '@/lib/utils';
import type { Stock } from '@/types';

export interface QuantityPerStockProps {
  stocks: Stock[];
  totalInvestment: number;
  exchangeRate: number;
}

/** 종목별 보유 수량 */
export default function QuantityPerStock({ stocks, totalInvestment, exchangeRate }: QuantityPerStockProps) {
  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
      {stocks.map((stock, index) => {
        const investmentAmount = (totalInvestment * (stock.ratio || 0)) / 100;
        const priceInKRW = convertToKRW(stock.price, stock.currency, exchangeRate);
        const quantity = priceInKRW > 0 ? Math.floor(investmentAmount / priceInKRW) : 0;
        return (
          <div
            className="flex justify-between items-center p-2 bg-white rounded border border-grey-100"
            key={index}
          >
            <span className="md:block hidden text-sm font-medium text-gray-600">
              {stock.name ? `[${stock.ticker}] ${stock.name}` : stock.ticker}
            </span>
            <span className="md:hidden block text-sm font-medium text-gray-600">
              {stock.ticker}
            </span>
            <span className="text-sm font-semibold text-gray-600">
              {quantity.toLocaleString('ko-KR')}주
            </span>
          </div>
        );
      })}
    </div>
  );
}
