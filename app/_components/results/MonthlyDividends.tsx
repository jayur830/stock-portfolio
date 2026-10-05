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

  const { data: histories = [] } = useQuery({
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

  const displayAmounts = useMemo(() => {
    if (!weightedStockDividends) {
      return amounts;
    }
    return mergeMonthlyDividends(weightedStockDividends);
  }, [weightedStockDividends, amounts]);

  const ledgerMax = useMemo(() => Math.max(0, ...displayAmounts), [displayAmounts]);
  const ledgerTotal = useMemo(() => displayAmounts.reduce((sum, v) => sum + v, 0), [displayAmounts]);

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
      <div className="monthly-head">
        <div className="flex items-center gap-2">
          <h3 className="monthly-title">월별 현금흐름</h3>
        </div>

        {/* 뷰 전환 탭 버튼 */}
        <div className="inline-flex items-center gap-1">
          <button
            className={`ledger-tab ${viewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => setViewMode('grid')}
            type="button"
          >
            <LayoutGrid size={13} />
            <span>월별</span>
          </button>
          <button
            className={`ledger-tab ${viewMode === 'calendar' ? 'is-active' : ''}`}
            onClick={() => setViewMode('calendar')}
            type="button"
          >
            <CalendarDays size={13} />
            <span>달력</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <>
          <div className="ledger-rows">
            {displayAmounts.map((amount, index) => (
              <div
                className={`ledger-row${amount <= 0 ? ' is-zero' : ''}${amount > 0 && amount === ledgerMax ? ' is-peak' : ''}`}
                key={index}
              >
                <span className="ledger-month">{String(index + 1).padStart(2, '0')}월</span>
                <span aria-hidden="true" className="ledger-bar">
                  <span className="ledger-bar-fill" style={{ width: `${ledgerMax > 0 ? (amount / ledgerMax) * 100 : 0}%` }} />
                </span>
                <span className="ledger-amount">
                  {amount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                </span>
              </div>
            ))}
          </div>
          <div className="ledger-total">
            <span className="ledger-total-label">연간 합계 · 세후</span>
            <span className="ledger-total-value">
              {ledgerTotal.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </span>
          </div>
        </>
      ) : (
        <div className="calendar-pad">
          <DividendCalendar />
        </div>
      )}
    </div>
  );
}
