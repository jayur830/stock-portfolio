import dayjs from 'dayjs';

import type { Stock, StockDividend } from '@/types';

export interface DividendEvent {
  day: number;
  stockName: string;
  ticker: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
  isForeign: boolean;
}

export interface DayCalendarCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: DividendEvent[];
  totalGrossAmount: number;
  totalNetAmount: number;
}

export interface HistoryDataForCalendar {
  symbol: string;
  dividends?: {
    date: Date | string;
    amount: number;
  }[];
}

/**
 * 종목의 티커/이름 기반으로 고정된 배당 지급일을 결정(1~28일 중)
 */
export function getEstimatedDividendDay(ticker: string, name: string): number {
  const upper = ticker.toUpperCase();
  if ([
    'JEPI',
    'JEPQ',
    'O',
    'MAIN',
    'STAG',
  ].includes(upper)) {
    return 15;
  }
  if ([
    'SCHD',
    'SPY',
    'VOO',
    'QQQ',
    'IVV',
  ].includes(upper)) {
    return 25;
  }
  if ([
    'AAPL',
    'MSFT',
    'NVDA',
    'KO',
    'PEP',
  ].includes(upper)) {
    return 22;
  }
  if (ticker.endsWith('.KS') || ticker.endsWith('.KQ') || name.includes('삼성전자') || name.includes('현대차')) {
    return 20;
  }

  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = (hash << 5) - hash + ticker.charCodeAt(i);
    hash |= 0;
  }
  const dayOffset = Math.abs(hash) % 19;
  return 10 + dayOffset;
}

/**
 * 특정 연/월에 해당하는 달력 셀 그리드 데이터 생성
 * - 실제 Yahoo Finance 과거 배당 이력(histories)이 있으면 실제 일자 및 횟수(예: 12월 2회 지급)를 정확히 반영
 * - 없으면 종목의 기본 dividendMonths 정보를 기반으로 계산
 */
export function generateMonthCalendar(
  year: number,
  monthIndex: number, // 0 = 1월, 11 = 12월
  stocks: Stock[],
  stockDividends: StockDividend[],
  histories?: HistoryDataForCalendar[],
): DayCalendarCell[][] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0: 일요일 ~ 6: 토요일

  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  const currentMonthNumber = monthIndex + 1;
  const monthEventsMap = new Map<number, DividendEvent[]>();

  const historyList = Array.isArray(histories) ? histories : (histories && typeof histories === 'object' && 'histories' in histories && Array.isArray((histories as { histories: HistoryDataForCalendar[] }).histories)) ? (histories as { histories: HistoryDataForCalendar[] }).histories : [];

  stocks.forEach((stock, index) => {
    if (!stock.enabled) return;
    const dividendInfo = stockDividends[index];
    if (!dividendInfo) return;

    const taxRate = dividendInfo.taxRate ?? (dividendInfo.isForeign ? 0.15 : 0.154);
    const history = historyList.find((h) => h.symbol === stock.ticker);

    // 1. 실제 야후 파이낸스 배당 히스토리 매칭 시도
    let actualDividendsInThisMonth: { day: number; amount: number }[] = [];

    if (history?.dividends && history.dividends.length > 0) {
      // 선택한 해당 연도/월의 실제 배당 내역 필터링
      const exactDivs = history.dividends.filter((d) => {
        const dDate = dayjs(d.date);
        return dDate.year() === year && dDate.month() === monthIndex;
      });

      if (exactDivs.length > 0) {
        actualDividendsInThisMonth = exactDivs.map((d) => ({
          amount: d.amount,
          day: dayjs(d.date).date(),
        }));
      } else {
        // 해당 연도의 기록이 아직 없는 미래/과거 월의 경우, 최근 1~2년 내 같은 월(monthIndex)의 지급 패턴(일자 및 횟수) 차용
        const sameMonthDivs = history.dividends.filter((d) => dayjs(d.date).month() === monthIndex);
        if (sameMonthDivs.length > 0) {
          // 가장 최근 연도의 해당 월 배당 내역 추출
          const latestYear = Math.max(...sameMonthDivs.map((d) => dayjs(d.date).year()));
          const latestDivs = sameMonthDivs.filter((d) => dayjs(d.date).year() === latestYear);
          actualDividendsInThisMonth = latestDivs.map((d) => ({
            amount: d.amount,
            day: dayjs(d.date).date(),
          }));
        }
      }
    }

    // 2. 실제 배당 데이터가 있는 경우 (12월 2회 지급, 실제 일자 등 정확히 반영)
    if (actualDividendsInThisMonth.length > 0) {
      const totalDivAmount = actualDividendsInThisMonth.reduce((sum, d) => sum + d.amount, 0);
      const totalDivMonthsCount = stock.dividendMonths?.length || 4;
      const singleMonthNet = dividendInfo.monthlyDividends[currentMonthNumber] ?? (dividendInfo.annualDividend * (1 - taxRate) / totalDivMonthsCount);
      const singleMonthGross = singleMonthNet / (1 - taxRate > 0 ? 1 - taxRate : 1);

      actualDividendsInThisMonth.forEach(({ day, amount }) => {
        // 각 배당일의 비중에 맞춰 월 총배당금 배분
        const weight = totalDivAmount > 0 ? amount / totalDivAmount : 1 / actualDividendsInThisMonth.length;
        const grossAmount = singleMonthGross * weight;
        const netAmount = singleMonthNet * weight;
        if (grossAmount <= 0) return;

        const event: DividendEvent = {
          currency: stock.currency,
          day,
          grossAmount,
          isForeign: dividendInfo.isForeign,
          netAmount,
          stockName: stock.name,
          ticker: stock.ticker,
        };

        const list = monthEventsMap.get(day) || [];
        list.push(event);
        monthEventsMap.set(day, list);
      });
      return;
    }

    // 3. Fallback: 배당 히스토리가 없을 때는 기존 dividendMonths 기반 계산
    if (stock.dividendMonths && stock.dividendMonths.includes(currentMonthNumber)) {
      const monthlyNet = dividendInfo.monthlyDividends[currentMonthNumber] || 0;
      if (monthlyNet <= 0) return;

      const monthlyGross = monthlyNet / (1 - taxRate > 0 ? 1 - taxRate : 1);
      const day = getEstimatedDividendDay(stock.ticker, stock.name);

      const event: DividendEvent = {
        currency: stock.currency,
        day,
        grossAmount: monthlyGross,
        isForeign: dividendInfo.isForeign,
        netAmount: monthlyNet,
        stockName: stock.name,
        ticker: stock.ticker,
      };

      const list = monthEventsMap.get(day) || [];
      list.push(event);
      monthEventsMap.set(day, list);
    }
  });

  const weeks: DayCalendarCell[][] = [];
  let currentWeek: DayCalendarCell[] = [];

  // 이전 달 날짜 채우기
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = 0; i < startDayOfWeek; i++) {
    const dayNum = prevMonthLastDay - startDayOfWeek + i + 1;
    currentWeek.push({
      date: new Date(year, monthIndex - 1, dayNum),
      dayNumber: dayNum,
      events: [],
      isCurrentMonth: false,
      isToday: false,
      totalGrossAmount: 0,
      totalNetAmount: 0,
    });
  }

  // 이번 달 날짜 채우기
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const events = monthEventsMap.get(day) || [];
    const totalGross = events.reduce((sum, e) => sum + e.grossAmount, 0);
    const totalNet = events.reduce((sum, e) => sum + e.netAmount, 0);

    currentWeek.push({
      date: new Date(year, monthIndex, day),
      dayNumber: day,
      events,
      isCurrentMonth: true,
      isToday: isThisMonth && today.getDate() === day,
      totalGrossAmount: totalGross,
      totalNetAmount: totalNet,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // 다음 달 날짜 채우기
  if (currentWeek.length > 0) {
    let nextMonthDay = 1;
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: new Date(year, monthIndex + 1, nextMonthDay),
        dayNumber: nextMonthDay,
        events: [],
        isCurrentMonth: false,
        isToday: false,
        totalGrossAmount: 0,
        totalNetAmount: 0,
      });
      nextMonthDay++;
    }
    weeks.push(currentWeek);
  }

  return weeks;
}
