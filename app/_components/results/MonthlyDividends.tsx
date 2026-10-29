'use client';

import { CalendarDays, CircleHelp, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateHealthInsurance } from '@/lib/utils';
import type { StockDividend } from '@/types';

import DividendCalendar from './DividendCalendar';

export interface MonthlyDividendsProps {
  amounts: number[];
  stockDividends?: StockDividend[];
  annualDividend?: number;
}

/** 월별 배당금 목록 (세후) 및 배당 캘린더 */
export default function MonthlyDividends({ amounts, stockDividends = [], annualDividend = 0 }: MonthlyDividendsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const displayAmounts = amounts;
  const monthlyHealthInsurance = calculateHealthInsurance(annualDividend).monthlyExtraHealthInsurance;
  const monthlyBreakdown = displayAmounts.map((netAmount, monthIndex) => {
    if (stockDividends.length === 0) {
      return { gross: netAmount, tax: 0, healthInsurance: 0, net: netAmount };
    }

    const gross = stockDividends.reduce((sum, dividend) => {
      const net = dividend.monthlyDividends[monthIndex + 1] || 0;
      return sum + (dividend.taxRate < 1 ? net / (1 - dividend.taxRate) : net);
    }, 0);
    const tax = Math.max(0, gross - netAmount);
    const healthInsurance = monthlyHealthInsurance;

    return {
      gross,
      tax,
      healthInsurance,
      net: Math.max(0, netAmount - healthInsurance),
    };
  });
  const finalAmounts = monthlyBreakdown.map(({ net }) => net);
  const ledgerMax = Math.max(0, ...displayAmounts);
  const ledgerTotal = finalAmounts.reduce((sum, v) => sum + v, 0);

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
            {displayAmounts.map((amount, index) => {
              const breakdown = monthlyBreakdown[index];
              const finalAmount = breakdown.net;

              return (
                <div
                  className={`ledger-row${finalAmount <= 0 ? ' is-zero' : ''}${amount > 0 && amount === ledgerMax ? ' is-peak' : ''}`}
                  key={index}
                >
                  <span className="ledger-month">{String(index + 1).padStart(2, '0')}월</span>
                  <span aria-hidden="true" className="ledger-bar">
                    <span
                      className="ledger-bar-fill"
                      style={{ width: `${ledgerMax > 0 ? (amount / ledgerMax) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="ledger-amount">
                    <span className="ledger-formula">
                      {Math.round(breakdown.gross).toLocaleString('ko-KR')}원 - (
                      {Math.round(breakdown.tax).toLocaleString('ko-KR')}원 +{' '}
                      {Math.round(breakdown.healthInsurance).toLocaleString('ko-KR')}원)
                    </span>
                    <strong>{Math.round(finalAmount).toLocaleString('ko-KR')}원</strong>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="ledger-total">
            <span className="ledger-total-label">연간 합계 · 최종 실수령</span>
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

      <div className="monthly-info-footer">
        {stockDividends.length > 0 && (
          <p className="monthly-insurance-note">
            건보료는 연 추가 건보료를 12개월로 균등 배분합니다. 부과 대상이 아니면 0원입니다.
          </p>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button aria-label="세후 월별 배당금 계산 방식 안내" className="monthly-info-button" type="button">
              <CircleHelp size={15} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="monthly-info-popover">
            <strong>세후 월별 배당금 계산 방식</strong>
            <p>각 월의 세전 배당금에서 배당소득세와 예상 월별 건강보험료를 차감해 최종 실수령액을 계산합니다.</p>
            <p>
              건강보험료는 기존 연간 건보료 계산 결과를 12개월로 균등 배분한 예상치이며, 추가 부과 대상이 아니면 0원으로
              표시됩니다.
            </p>
            <p>표시 금액에는 종합소득세 신고에 따른 추가 납부·환급 정산이 반영되지 않습니다.</p>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
