'use client';

import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { memo, useMemo, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Stock } from '@/types';

import CombinedChart from './combined-chart';
import ProfitChart from './profit-chart';

export interface StockChartsProps {
  stocks: Stock[];
  totalInvestment: number;
  exchangeRates: { [key: string]: number };
}

export interface HistoryData {
  symbol: string;
  data: {
    date: Date;
    close: number;
  }[];
  dividends: {
    date: Date;
    amount: number;
  }[];
}

const StockCharts = ({ stocks, totalInvestment, exchangeRates }: StockChartsProps) => {
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || resolvedTheme === 'dark';

  const [currency, setCurrency] = useState('KRW');

  /** ticker만 추출하여 메모이제이션 (ratio, price 등 변경 시 재fetch 방지) */
  const tickers = useMemo(() => stocks.map((s) => s.ticker).filter(Boolean).join(','), [stocks]);

  /** 주식 히스토리 데이터 조회 */
  const { data: histories = [], isLoading } = useQuery({
    queryKey: ['stockHistories', tickers] as const,
    async queryFn({ queryKey: [, tickers] }) {
      const symbols = tickers.split(',');
      const response = await fetch('/api/stock/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stock histories');
      }

      const data = await response.json();
      return (data.histories || []) as HistoryData[];
    },
    enabled: !!tickers, // tickers가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분
  });

  const currencies = useMemo(() => ['KRW', ...Object.keys(exchangeRates)], [exchangeRates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full" />
          <span className="text-sm text-muted-foreground">차트 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (histories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="flex justify-end">
        <Select onValueChange={setCurrency} value={currency}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="통화 선택" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 통합 포트폴리오 차트 */}
      <CombinedChart
        currency={currency}
        exchangeRates={exchangeRates}
        histories={histories}
        isDark={isDark}
        stocks={stocks}
      />

      {/* 누적 수익금 차트 */}
      <ProfitChart
        currency={currency}
        exchangeRates={exchangeRates}
        histories={histories}
        isDark={isDark}
        stocks={stocks}
        totalInvestment={totalInvestment}
      />
    </div>
  );
};

export default memo(StockCharts);
