import type { Stock, StockDividend } from '@/types';

import { generateMonthCalendar, getEstimatedDividendDay } from './calendar-utils';

describe('calendar-utils', () => {
  describe('getEstimatedDividendDay', () => {
    it('대표 월배당 ETF는 15일을 반환해야 함', () => {
      expect(getEstimatedDividendDay('JEPI', 'JPMorgan Equity Premium')).toBe(15);
      expect(getEstimatedDividendDay('O', 'Realty Income')).toBe(15);
    });

    it('대표 분기배당 ETF는 25일을 반환해야 함', () => {
      expect(getEstimatedDividendDay('SCHD', 'Schwab US Dividend')).toBe(25);
    });

    it('국내 주식은 20일을 반환해야 함', () => {
      expect(getEstimatedDividendDay('005930.KS', '삼성전자')).toBe(20);
    });

    it('기타 티커는 10~28일 사이의 일정한 날짜를 반환해야 함', () => {
      const day = getEstimatedDividendDay('UNKNOWN', '테스트 종목');
      expect(day).toBeGreaterThanOrEqual(10);
      expect(day).toBeLessThanOrEqual(28);
      // 동일한 티커는 동일한 날짜 반환
      expect(getEstimatedDividendDay('UNKNOWN', '테스트 종목')).toBe(day);
    });
  });

  describe('generateMonthCalendar', () => {
    const mockStocks: Stock[] = [
      {
        currency: 'USD',
        dividendMonths: [1, 4, 7, 10],
        enabled: true,
        name: 'Schwab US Dividend ETF',
        price: 80,
        purchaseDate: '2025-01-01',
        ratio: 50,
        ticker: 'SCHD',
        yield: 3.5,
      },
      {
        currency: 'USD',
        dividendMonths: [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
        ],
        enabled: true,
        name: 'JPMorgan Equity Premium ETF',
        price: 55,
        purchaseDate: '2025-01-01',
        ratio: 50,
        ticker: 'JEPI',
        yield: 7.5,
      },
    ];

    const mockStockDividends: StockDividend[] = [
      {
        annualDividend: 400000,
        isForeign: true,
        monthlyDividends: [
          100000, 0, 0, 100000, 0, 0, 100000, 0, 0, 100000, 0, 0,
        ],
        taxRate: 0.15,
      },
      {
        annualDividend: 600000,
        isForeign: true,
        monthlyDividends: [
          50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000,
        ],
        taxRate: 0.15,
      },
    ];

    it('4월(monthIndex 3) 캘린더 생성 시 4월의 배당 이벤트가 올바르게 매핑되어야 함', () => {
      const weeks = generateMonthCalendar(2026, 3, mockStocks, mockStockDividends);
      expect(weeks.length).toBeGreaterThanOrEqual(4);

      // 전체 셀 중 4월 15일(JEPI)과 4월 25일(SCHD) 확인
      const allCells = weeks.flat();
      const currentMonthCells = allCells.filter((c) => c.isCurrentMonth);
      expect(currentMonthCells.length).toBe(30); // 4월은 30일

      const day15 = currentMonthCells.find((c) => c.dayNumber === 15);
      expect(day15).toBeDefined();
      expect(day15?.events.some((e) => e.ticker === 'JEPI')).toBe(true);

      const day25 = currentMonthCells.find((c) => c.dayNumber === 25);
      expect(day25).toBeDefined();
      expect(day25?.events.some((e) => e.ticker === 'SCHD')).toBe(true);
    });

    it('실제 배당 이력(12월 2회 지급) 전달 시 두 날짜에 각각 배당 이벤트가 생성되어야 함', () => {
      const mockHistories = [
        {
          dividends: [
            { amount: 0.5, date: '2024-12-05' },
            { amount: 0.6, date: '2024-12-28' },
          ],
          symbol: 'JEPI',
        },
      ];

      const weeks = generateMonthCalendar(2024, 11, mockStocks, mockStockDividends, mockHistories);
      const allCells = weeks.flat();
      const currentMonthCells = allCells.filter((c) => c.isCurrentMonth);

      const day5 = currentMonthCells.find((c) => c.dayNumber === 5);
      expect(day5?.events.some((e) => e.ticker === 'JEPI')).toBe(true);

      const day28 = currentMonthCells.find((c) => c.dayNumber === 28);
      expect(day28?.events.some((e) => e.ticker === 'JEPI')).toBe(true);
    });
  });
});
