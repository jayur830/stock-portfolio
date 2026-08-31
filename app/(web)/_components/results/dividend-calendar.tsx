'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { generateMonthCalendar } from '@/lib/calendar-utils';
import type { FormValues } from '@/types';

export default function DividendCalendar() {
  const { watch } = useFormContext<FormValues>();
  const stocks = watch('stocks') || [];
  const stockDividends = watch('stockDividends') || [];

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(today.getMonth()); // 0 ~ 11
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  /** ticker 문자열 메모이제이션 */
  const tickers = useMemo(() => stocks.map((s) => s.ticker).filter(Boolean).join(','), [stocks]);

  /** 실제 야후 파이낸스 배당 히스토리 데이터 조회 (StockCharts와 동일한 캐시 공유) */
  const { data: histories = [] } = useQuery({
    enabled: !!tickers,
    queryFn: async ({ queryKey: [, tickersParam] }) => {
      const symbols = tickersParam.split(',');
      const response = await fetch('/api/stock/history', {
        body: JSON.stringify({ symbols }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stock histories');
      }

      const data = await response.json();
      return (data.histories || []);
    },
    queryKey: ['stockHistories', tickers] as const,
    staleTime: 1000 * 60 * 60,
  });

  /** 해당 연월의 달력 데이터 생성 (실제 배당 히스토리 반영) */
  const weeks = useMemo(() => {
    return generateMonthCalendar(selectedYear, selectedMonthIndex, stocks, stockDividends, histories);
  }, [
    selectedYear, selectedMonthIndex, stocks, stockDividends, histories,
  ]);

  /** 이번 달 전체 배당 이벤트 집계 */
  const currentMonthEvents = useMemo(() => {
    return weeks
      .flat()
      .filter((cell) => cell.isCurrentMonth && cell.events.length > 0)
      .flatMap((cell) => cell.events)
      .sort((a, b) => a.day - b.day);
  }, [weeks]);

  const monthTotalGross = useMemo(() => {
    return currentMonthEvents.reduce((sum, e) => sum + e.grossAmount, 0);
  }, [currentMonthEvents]);

  const monthTotalNet = useMemo(() => {
    return currentMonthEvents.reduce((sum, e) => sum + e.netAmount, 0);
  }, [currentMonthEvents]);

  const handlePrevMonth = () => {
    setSelectedDay(null);
    if (selectedMonthIndex === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonthIndex(11);
    } else {
      setSelectedMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    if (selectedMonthIndex === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonthIndex(0);
    } else {
      setSelectedMonthIndex((prev) => prev + 1);
    }
  };

  const dayOfWeekHeaders = [
    '일', '월', '화', '수', '목', '금', '토',
  ];

  // 선택된 특정 날짜의 이벤트 목록 (선택 없으면 이번 달 전체)
  const displayEvents = selectedDay ? currentMonthEvents.filter((e) => e.day === selectedDay) : currentMonthEvents;

  return (
    <div className="flex flex-col gap-4">
      {/* 캘린더 상단 헤더 & 월 선택 바 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Button
            aria-label="이전 달"
            className="size-8 p-0"
            onClick={handlePrevMonth}
            type="button"
            variant="outline"
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-baseline gap-1.5 px-1">
            <span className="text-base font-bold text-foreground tracking-tight">
              {selectedYear}년 {selectedMonthIndex + 1}월
            </span>
          </div>
          <Button
            aria-label="다음 달"
            className="size-8 p-0"
            onClick={handleNextMonth}
            type="button"
            variant="outline"
          >
            <ChevronRight size={16} />
          </Button>
          {today.getMonth() !== selectedMonthIndex && (
            <Button
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedYear(today.getFullYear());
                setSelectedMonthIndex(today.getMonth());
                setSelectedDay(null);
              }}
              type="button"
              variant="ghost"
            >
              오늘
            </Button>
          )}
        </div>

        {/* 이번 달 총 배당금 뱃지 */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20"
            title={`세전 합계: ${monthTotalGross.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원`}
          >
            <DollarSign className="size-3.5" />
            <span>이달의 예상 배당금:</span>
            <strong className="text-sm font-bold text-foreground">
              {monthTotalNet.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </strong>
            <span className="text-[10px] text-muted-foreground font-normal">(세후)</span>
          </div>
        </div>
      </div>

      {/* 1월 ~ 12월 퀵 셀렉터 칩 */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {Array.from({ length: 12 }, (_, i) => {
          const isSelected = selectedMonthIndex === i;
          return (
            <button
              className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${
                isSelected ? 'bg-primary text-primary-foreground shadow-2xs font-bold' : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              key={i}
              onClick={() => {
                setSelectedMonthIndex(i);
                setSelectedDay(null);
              }}
              type="button"
            >
              {i + 1}월
            </button>
          );
        })}
      </div>

      {/* 달력 그리드 */}
      <div className="rounded-xl border border-border/70 bg-card/40 overflow-hidden shadow-xs">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30 text-center text-xs font-semibold text-muted-foreground py-2">
          {dayOfWeekHeaders.map((day, idx) => (
            <div
              className={idx === 0 ? 'text-destructive/80' : idx === 6 ? 'text-blue-500' : ''}
              key={day}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 셀 그리드 */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/40">
          {weeks.flat().map((cell, idx) => {
            const hasEvents = cell.events.length > 0;
            const isSelected = selectedDay === cell.dayNumber && cell.isCurrentMonth;
            const dayOfWeek = cell.date.getDay();

            return (
              <div
                className={`min-h-[5.25rem] sm:min-h-[6rem] p-1.5 sm:p-2 transition-all flex flex-col justify-between ${
                  !cell.isCurrentMonth ? 'bg-muted/10 opacity-35' : hasEvents ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-muted/20'
                } ${isSelected ? 'ring-2 ring-primary ring-inset bg-primary/10' : ''}`}
                key={idx}
                onClick={() => {
                  if (cell.isCurrentMonth && hasEvents) {
                    setSelectedDay((prev) => (prev === cell.dayNumber ? null : cell.dayNumber));
                  }
                }}
                role="button"
                tabIndex={hasEvents ? 0 : -1}
              >
                {/* 상단 날짜 번호 */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex size-5.5 sm:size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      cell.isToday ? 'bg-primary text-primary-foreground font-bold shadow-xs' : dayOfWeek === 0 && cell.isCurrentMonth ? 'text-destructive' : dayOfWeek === 6 && cell.isCurrentMonth ? 'text-blue-500' : 'text-foreground/90'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {hasEvents && (
                    <span className="hidden sm:inline-flex rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      +{cell.totalNetAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>

                {/* 배당 이벤트 뱃지 목록 */}
                <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                  {cell.events.slice(0, 2).map((event, eIdx) => (
                    <div
                      className="flex items-center justify-between rounded bg-card/90 px-1 py-0.5 text-[10px] border border-border/60 shadow-2xs"
                      key={eIdx}
                    >
                      <span className="font-bold text-foreground truncate max-w-[4rem] sm:max-w-none">
                        {event.ticker}
                      </span>
                      <span className="font-semibold text-primary text-[9px] shrink-0">
                        {event.netAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                      </span>
                    </div>
                  ))}
                  {cell.events.length > 2 && (
                    <span className="text-[9px] text-muted-foreground pl-0.5 font-medium">
                      +{cell.events.length - 2}개 더보기
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 일자별 배당 타임라인 목록 */}
      <div className="rounded-xl border border-border/70 bg-card/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">
              {selectedDay ? `${selectedMonthIndex + 1}월 ${selectedDay}일 배당 입금 상세` : `${selectedMonthIndex + 1}월 전체 배당 타임라인`}
            </h4>
          </div>
          {selectedDay && (
            <button
              className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
              onClick={() => setSelectedDay(null)}
              type="button"
            >
              전체 보기
            </button>
          )}
        </div>

        {displayEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {selectedMonthIndex + 1}월에는 예정된 배당금 입금 일정이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayEvents.map((event, idx) => (
              <div
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-3 shadow-2xs hover:border-primary/50 transition-colors"
                key={idx}
              >
                {/* 좌측: 날짜 배지 & 종목 정보 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-center font-bold">
                    <span className="text-[9px] text-muted-foreground uppercase leading-none">DAY</span>
                    <span className="text-sm font-extrabold text-foreground leading-none mt-0.5">{event.day}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{event.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[10rem] sm:max-w-[16rem]">
                        {event.stockName}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground/80 mt-0.5">
                      {selectedMonthIndex + 1}월 {event.day}일 지급 예정
                    </span>
                  </div>
                </div>

                {/* 우측: 세후 / 세전 배당금 */}
                <div className="flex flex-col items-end text-right shrink-0">
                  <strong className="text-xs sm:text-sm font-bold text-foreground">
                    +{event.netAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </strong>
                  <span className="text-[10px] text-muted-foreground">
                    세전 {event.grossAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
