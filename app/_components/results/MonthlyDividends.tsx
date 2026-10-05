'use client';

import { CalendarDays, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import DividendCalendar from './DividendCalendar';

export interface MonthlyDividendsProps {
  amounts: number[];
}

/** 월별 배당금 목록 (세후) 및 배당 캘린더 */
export default function MonthlyDividends({ amounts }: MonthlyDividendsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const displayAmounts = amounts;
  const ledgerMax = Math.max(0, ...displayAmounts);
  const ledgerTotal = displayAmounts.reduce((sum, v) => sum + v, 0);

  return (
    <div className="monthly-surface">
      <div className="monthly-head">
        <div className="flex items-center gap-2">
          <h3 className="monthly-title">월별 현금흐름</h3>
        </div>

        {/* 뷰 전환 탭 버튼 */}
        <div className="inline-flex items-center gap-1">
          <Button
            className={`ledger-tab ${viewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => setViewMode('grid')}
            size="sm"
            type="button"
            variant="ghost"
          >
            <LayoutGrid size={13} />
            <span>월별</span>
          </Button>
          <Button
            className={`ledger-tab ${viewMode === 'calendar' ? 'is-active' : ''}`}
            onClick={() => setViewMode('calendar')}
            size="sm"
            type="button"
            variant="ghost"
          >
            <CalendarDays size={13} />
            <span>달력</span>
          </Button>
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
