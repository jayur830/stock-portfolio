import dayjs from 'dayjs';

import type { Stock } from '@/types';

import { calculateComprehensiveTax, calculateStockAnnualDividend, calculateStockMonthlyDividends, convertToKRW, mergeMonthlyDividends, setSearchParams } from './utils';

describe('@/lib/utils', () => {
  beforeEach(() => {
    jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** {@link setSearchParams} */
  it('setSearchParams()', () => {
    setSearchParams('/', { key: 'value' });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '?key=value');

    setSearchParams('/search', { query: 'test' });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/search?query=test');

    setSearchParams('/', {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '?key1=value1&key2=value2&key3=value3');

    setSearchParams('/', {
      enabled: true,
      disabled: false,
    });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '?enabled=true&disabled=false');

    setSearchParams('/', {
      key1: 'value',
      key2: null,
      key3: undefined,
      key4: '',
    });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '?key1=value');

    setSearchParams('/', {});
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '?');

    setSearchParams('/search', {
      query: 'test',
      page: 1,
      active: true,
      empty: null,
    });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/search?query=test&page=1&active=true');
  });

  /** {@link convertToKRW} */
  it('convertToKRW()', () => {
    // KRW - 환율 무관하게 원래 금액 반환
    expect(convertToKRW(1000, 'KRW', { USD: 1 })).toBe(1000);
    expect(convertToKRW(1000, 'KRW', { USD: 1300 })).toBe(1000);

    // USD - 환율 적용
    expect(convertToKRW(1000, 'USD', { USD: 1 })).toBe(1000);
    expect(convertToKRW(1000, 'USD', { USD: 1.2 })).toBe(1200);
    expect(convertToKRW(100, 'USD', { USD: 1300 })).toBe(130000);
    expect(convertToKRW(50.5, 'USD', { USD: 1300 })).toBe(65650);

    // 환율이 1보다 작은 경우
    expect(convertToKRW(1000, 'USD', { USD: 0.5 })).toBe(500);

    // 환율이 0인 경우
    expect(convertToKRW(1000, 'USD', { USD: 0 })).toBe(0);

    // 금액이 0인 경우
    expect(convertToKRW(0, 'USD', { USD: 1300 })).toBe(0);
    expect(convertToKRW(0, 'KRW', { USD: 1 })).toBe(0);

    // 소수점이 있는 금액
    expect(convertToKRW(123.45, 'USD', { USD: 1300 })).toBe(160485);
    expect(convertToKRW(99.99, 'KRW', { USD: 1 })).toBe(99.99);

    // 매우 큰 금액
    expect(convertToKRW(1000000, 'USD', { USD: 1300 })).toBe(1300000000);
    expect(convertToKRW(1000000, 'KRW', { USD: 1 })).toBe(1000000);

    // EUR - 유로 환율 적용
    expect(convertToKRW(100, 'EUR', { EUR: 1400 })).toBe(140000);
    expect(convertToKRW(50.25, 'EUR', { EUR: 1400 })).toBe(70350);

    // JPY - 엔화 환율 적용 (일반적으로 낮은 환율)
    expect(convertToKRW(1000, 'JPY', { JPY: 9.5 })).toBe(9500);
    expect(convertToKRW(10000, 'JPY', { JPY: 9.5 })).toBe(95000);

    // 환율 정보가 없는 경우
    expect(convertToKRW(1000, 'USD', {})).toBe(0);
    expect(convertToKRW(1000, 'EUR', { USD: 1300 })).toBe(0);
  });

  const TQQQ: Stock = {
    name: 'Proshares QQQ 3X',
    ticker: 'TQQQ',
    currency: 'USD',
    dividendMonths: [3, 6, 9, 12],
    price: 150,
    yield: 2.5,
    ratio: 0.1,
    purchaseDate: dayjs('2023-01-01'),
  };
  const JEPQ: Stock = {
    name: 'JP Morgan Nasdaq Equity Premium Income',
    ticker: 'JEPQ',
    currency: 'USD',
    dividendMonths: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ],
    price: 58,
    yield: 10.2,
    ratio: 1,
    purchaseDate: dayjs('2024-01-01'),
  };
  const SGOV: Stock = {
    name: 'iShares 0-3M Treasury Bond',
    ticker: 'SGOV',
    currency: 'USD',
    dividendMonths: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ],
    price: 100.64,
    yield: 4.2,
    ratio: 1,
    purchaseDate: dayjs('2024-01-01'),
  };

  /** {@link calculateStockAnnualDividend} */
  it('calculateStockAnnualDividend()', () => {
    expect(calculateStockAnnualDividend(TQQQ, 10000, { USD: 1 })).toBe(250);
    expect(calculateStockAnnualDividend(JEPQ, 10000, { USD: 1 })).toBe(1020);
    expect(calculateStockAnnualDividend(SGOV, 10000, { USD: 1.2 })).toBe(420);
  });

  /** {@link calculateStockMonthlyDividends} */
  it('calculateStockMonthlyDividends()', () => {
    expect(
      calculateStockMonthlyDividends(
        {
          name: 'AST SpaceMobile, Inc.',
          ticker: 'ASTS',
          currency: 'USD',
          dividendMonths: [],
          price: 55.52,
          yield: 0,
          ratio: 1,
          purchaseDate: dayjs('2024-01-01'),
        },
        10000,
      ),
    ).toEqual({});

    expect(calculateStockMonthlyDividends(TQQQ, 10000)).toEqual({
      3: 2125,
      6: 2125,
      9: 2125,
      12: 2125,
    });

    expect(calculateStockMonthlyDividends(JEPQ, 10000)).toEqual({
      1: 708.33,
      2: 708.33,
      3: 708.33,
      4: 708.33,
      5: 708.33,
      6: 708.33,
      7: 708.33,
      8: 708.33,
      9: 708.33,
      10: 708.33,
      11: 708.33,
      12: 708.33,
    });

    expect(calculateStockMonthlyDividends(SGOV, 3000)).toEqual({
      1: 212.5,
      2: 212.5,
      3: 212.5,
      4: 212.5,
      5: 212.5,
      6: 212.5,
      7: 212.5,
      8: 212.5,
      9: 212.5,
      10: 212.5,
      11: 212.5,
      12: 212.5,
    });
  });

  /** {@link mergeMonthlyDividends} */
  it('mergeMonthlyDividends()', () => {
    /** 빈 배열 */
    expect(mergeMonthlyDividends([])).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);

    /** 단일 종목 - 분기 배당 (3, 6, 9, 12월) */
    expect(
      mergeMonthlyDividends([
        {
          monthlyDividends: {
            3: 102.45,
            6: 98.76,
            9: 105.33,
            12: 99.12,
          },
        },
      ]),
    ).toEqual([
      0, 0, 102.45, 0, 0, 98.76, 0, 0, 105.33, 0, 0, 99.12,
    ]);

    /** 단일 종목 - 매월 배당 */
    expect(
      mergeMonthlyDividends([
        {
          monthlyDividends: {
            1: 51.23,
            2: 49.87,
            3: 52.14,
            4: 50.65,
            5: 48.92,
            6: 51.78,
            7: 50.34,
            8: 49.56,
            9: 52.89,
            10: 51.45,
            11: 50.21,
            12: 49.67,
          },
        },
      ]),
    ).toEqual([
      51.23, 49.87, 52.14, 50.65, 48.92, 51.78, 50.34, 49.56, 52.89, 51.45, 50.21, 49.67,
    ]);

    /** 여러 종목 합산 */
    expect(
      mergeMonthlyDividends([
        {
          monthlyDividends: {
            3: 103.5,
            6: 101.25,
            9: 99.75,
            12: 102.5,
          },
        },
        {
          monthlyDividends: {
            1: 48.75,
            2: 51.25,
            3: 49.75,
            4: 50.5,
            5: 52.25,
            6: 48.5,
            7: 51.75,
            8: 49.25,
            9: 50.5,
            10: 52.5,
            11: 49.0,
            12: 51.5,
          },
        },
      ]),
    ).toEqual([
      48.75, 51.25, 153.25, 50.5, 52.25, 149.75, 51.75, 49.25, 150.25, 52.5, 49.0, 154.0,
    ]);

    /** 실제 Stock 데이터 활용 */
    const tqqqMonthly = calculateStockMonthlyDividends(TQQQ, calculateStockAnnualDividend(TQQQ, 10000, { USD: 1 }));
    const jepqMonthly = calculateStockMonthlyDividends(JEPQ, calculateStockAnnualDividend(JEPQ, 10000, { USD: 1 }));
    const sgovMonthly = calculateStockMonthlyDividends(SGOV, calculateStockAnnualDividend(SGOV, 10000, { USD: 1.2 }));

    /** 실제 계산된 값 사용 */
    const merged = mergeMonthlyDividends([
      { monthlyDividends: tqqqMonthly },
      { monthlyDividends: jepqMonthly },
      { monthlyDividends: sgovMonthly },
    ]);

    expect(merged).toEqual([
      102, // 1월: JEPQ + SGOV
      102, // 2월: JEPQ + SGOV
      155.13, // 3월: TQQQ + JEPQ + SGOV
      102, // 4월: JEPQ + SGOV
      102, // 5월: JEPQ + SGOV
      155.13, // 6월: TQQQ + JEPQ + SGOV
      102, // 7월: JEPQ + SGOV
      102, // 8월: JEPQ + SGOV
      155.13, // 9월: TQQQ + JEPQ + SGOV
      102, // 10월: JEPQ + SGOV
      102, // 11월: JEPQ + SGOV
      155.13, // 12월: TQQQ + JEPQ + SGOV
    ]);

    /** 소수점 처리 */
    expect(
      mergeMonthlyDividends([
        {
          monthlyDividends: {
            1: 87.75,
            6: 142.5,
          },
        },
        {
          monthlyDividends: {
            1: 12.5,
            6: 57.25,
          },
        },
      ]),
    ).toEqual([
      100.25, 0, 0, 0, 0, 199.75, 0, 0, 0, 0, 0, 0,
    ]);
  });

  /** {@link calculateComprehensiveTax} */
  it('calculateComprehensiveTax()', () => {
    /** 2,000만원 이하: 분리과세 */
    expect(calculateComprehensiveTax(1000000)).toBe(null);
    expect(calculateComprehensiveTax(20000000)).toBe(null);

    /** 국내 배당만 (배당세액공제 적용으로 환급액 증가) */
    expect(calculateComprehensiveTax(40000000)).toBe(-4133000);
    expect(calculateComprehensiveTax(77600000)).toBe(-7917696);
    expect(calculateComprehensiveTax(80000000)).toBe(-7983600);
    expect(calculateComprehensiveTax(100000000)).toBe(-8436000);

    /** 국내 + 해외 배당 혼합 */
    expect(calculateComprehensiveTax(80000000, 40000000)).toBe(-1242600);
    expect(calculateComprehensiveTax(100000000, 100000000)).toBe(6516000);

    /** 고액 배당 (납부세액 발생) */
    expect(calculateComprehensiveTax(1000000000)).toBe(151837000);
    expect(calculateComprehensiveTax(1000000000, 1000000000)).toBe(272466000);
  });
});
