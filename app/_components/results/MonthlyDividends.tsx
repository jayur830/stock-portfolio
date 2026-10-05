'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, LayoutGrid } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { calculateStockMonthlyDividends, mergeMonthlyDividends } from '@/lib/utils';
import type { FormValues } from '@/types';

import DividendCalendar from './DividendCalendar';

export interface MonthlyDividendsProps {
  amounts: number[];
}

interface HistoryForWeight {
  symbol: string;
  dividends?: { date: Date | string; amount: number }[];
}

/** 월별 배당금 목록 (세후) 및 배당 캘린더 */
export default function MonthlyDividends({ amounts }: MonthlyDividendsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const { watch, setValue } = useFormContext<FormValues>();
  const stocks = watch('stocks') || [];
  const stockDividends = watch('stockDividends') || [];
  const enabledStocks = useMemo(() => stocks.filter((s) => s.enabled), [stocks]);

  /** StockCharts/DividendCalendar와 동일한 캐시 키 공유 */
  const tickers = useMemo(
    () => enabledStocks.map((s) => s.ticker).filter(Boolean).join(','),
    [enabledStocks],
  );

  const { data: histories = [], isLoading } = useQuery({
    enabled: !!tickers && stockDividends.length > 0,
    queryFn: async ({ queryKey: [, tickersParam] }) => {
      const symbols = (tickersParam as string).split(',').filter(Boolean);
      const response = await fetch('/api/stock/history', {
        body: JSON.stringify({ symbols }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stock histories');
      }

      const data = await response.json();
      return (data.histories || []) as HistoryForWeight[];
    },
    queryKey: ['stockHistories', tickers] as const,
    staleTime: 1000 * 60 * 60,
  });

  /** 최근 1년 실제 비율로 가중한 종목별 배당정보 (연 총액은 유지) */
  const { weightedStockDividends, appliedCount } = useMemo(() => {
    if (histories.length === 0 || enabledStocks.length === 0 || stockDividends.length === 0) {
      return { appliedCount: 0, weightedStockDividends: null };
    }

    const historiesMap = new Map(histories.map((h) => [h.symbol, h.dividends || []]));
    let applied = 0;

    const weighted = stockDividends.map((div, index) => {
      const stock = enabledStocks[index];
      if (!stock) {
        return div;
      }
      const history = historiesMap.get(stock.ticker);
      if (!history || history.length === 0) {
        return div;
      }
      const recalculated = calculateStockMonthlyDividends(
        stock.dividendMonths,
        stock.currency,
        div.annualDividend,
        history,
      );
      if (JSON.stringify(recalculated) !== JSON.stringify(div.monthlyDividends)) {
        applied += 1;
      }
      return {
        ...div,
        monthlyDividends: recalculated,
      };
    });

    return { appliedCount: applied, weightedStockDividends: weighted };
  }, [histories, enabledStocks, stockDividends]);

  const hasHistory = histories.some((h) => h.dividends && h.dividends.length > 0);
  const displayAmounts = useMemo(() => {
    if (!weightedStockDividends) {
      return amounts;
    }
    return mergeMonthlyDividends(weightedStockDividends);
  }, [weightedStockDividends, amounts]);

  /** props(amounts)가 폼 반영 후 가중값으로 바뀌어도 뱃지가 꺼지지 않도록 적용 여부로 판단 */
  const isWeighted = !!weightedStockDividends && hasHistory && appliedCount > 0;

  /** 가중 결과를 폼에 반영 (캘린더/CSV와 정합성 유지, 연 총액은 불변) */
  useEffect(() => {
    if (!weightedStockDividends || appliedCount === 0) {
      return;
    }
    const before = JSON.stringify(stockDividends.map((s) => s.monthlyDividends));
    const after = JSON.stringify(weightedStockDividends.map((s) => s.monthlyDividends));
    if (before !== after) {
      setValue('stockDividends', weightedStockDividends, { shouldDirty: false, shouldValidate: false });
    }
  }, [weightedStockDividends, appliedCount, stockDividends, setValue]);

  return (
    <div className="monthly-surface">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="monthly-title mb-0">예상 월별 배당금 (세후)</h3>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${isWeighted ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted/40 text-muted-foreground border-border/60'}`}
            title={isWeighted ? '최근 1년 실제 지급 비율로 월별 분배' : '실제 이력 없음 또는 분석 중: 균등 분할 표시'}
          >
            {isWeighted ? '실제 패턴 반영' : isLoading ? '패턴 분석 중...' : '균등 분할'}
          </span>
        </div>

        {/* 뷰 전환 탭 버튼 */}
        <div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5">
          <button
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'grid' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('grid')}
            type="button"
          >
            <LayoutGrid size={13} />
            <span>12개월 요약</span>
          </button>
          <button
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'calendar' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('calendar')}
            type="button"
          >
            <CalendarDays size={13} />
            <span>배당 캘린더</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="monthly-grid">
          {displayAmounts.map((amount, index) => (
            <div className="monthly-item" key={index}>
              <span className="monthly-month">{index + 1}월</span>
              <span className="monthly-amount">
                {amount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
              </span>
            </div>
          ))}
        </div>
      ) : (
        <DividendCalendar />
      )}
    </div>
  );
}
