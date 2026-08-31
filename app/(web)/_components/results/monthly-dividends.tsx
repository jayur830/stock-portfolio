'use client';

import { CalendarDays, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

import DividendCalendar from './dividend-calendar';

export interface MonthlyDividendsProps {
  amounts: number[];
}

/** 월별 배당금 목록 (세후) 및 배당 캘린더 */
export default function MonthlyDividends({ amounts }: MonthlyDividendsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  return (
    <div className="monthly-surface">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="monthly-title mb-0">예상 월별 배당금 (세후)</h3>

        {/* 뷰 전환 탭 버튼 */}
        <div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5">
          <button
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === 'grid' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('grid')}
            type="button"
          >
            <LayoutGrid size={13} />
            <span>12개월 요약</span>
          </button>
          <button
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
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
          {amounts.map((amount, index) => (
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
