'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { act, StrictMode, useEffect } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import { getStockDividends, mergeMonthlyDividends } from '@/lib/utils';
import type { FormValues, Stock } from '@/types';

import MonthlyDividends from './MonthlyDividends';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** 최근 1년 내 편향된 배당 이력 (월 비중 1:3) */
const MOCK_DIVIDENDS = [
  { amount: 100, date: daysAgo(300) },
  { amount: 100, date: daysAgo(290) },
  { amount: 300, date: daysAgo(120) },
  { amount: 300, date: daysAgo(110) },
];

const MONTHS = Array.from(
  new Set(MOCK_DIVIDENDS.map((d) => new Date(d.date).getMonth() + 1)),
).sort((a, b) => a - b);

const BASE_STOCK: Stock = {
  currency: 'KRW',
  dividendMonths: MONTHS,
  enabled: true,
  name: '테스트',
  price: 10000,
  ratio: 100,
  ticker: 'AAA',
  yield: 5,
};

const STABLE_QUERY_CLIENT = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function Harness({ onReady }: { onReady: (methods: UseFormReturn<FormValues>) => void }) {
  const methods = useForm<FormValues>({
    defaultValues: {
      chartData: undefined,
      exchangeRates: {},
      stockDividends: [],
      stocks: [BASE_STOCK],
      targetAnnualDividend: 0,
      totalInvestment: 10000000,
    },
  });
  useEffect(() => {
    onReady(methods);
  }, [onReady, methods]);
  const stockDividends = methods.watch('stockDividends') || [];
  const amounts = mergeMonthlyDividends(stockDividends);
  return (
    <StrictMode>
      <FormProvider {...methods}>
        <QueryClientProvider client={STABLE_QUERY_CLIENT}>
          <MonthlyDividends amounts={amounts} />
        </QueryClientProvider>
      </FormProvider>
    </StrictMode>
  );
}

describe('MonthlyDividends recalc', () => {
  beforeEach(() => {
    STABLE_QUERY_CLIENT.clear();
    global.fetch = jest.fn(async () => ({
      json: async () => ({ histories: [{ dividends: MOCK_DIVIDENDS, symbol: 'AAA' }] }),
      ok: true,
    }) as Response);
  });

  it('2차 계산 후 월별 현금흐름이 갱신된다', async () => {
    let api: UseFormReturn<FormValues> | null = null;
    const { container } = render(
      <Harness
        onReady={(m) => {
          api = m;
        }}
      />,
    );
    expect(MONTHS.length).toBeGreaterThanOrEqual(2);

    // 1차 계산 시뮬레이션: E1 (연 500,000 → 세후 430,000)
    const e1 = getStockDividends([BASE_STOCK], 10000000);
    await act(async () => {
      api!.setValue('stockDividends', e1);
    });

    const totalEl = () => container.querySelector('.ledger-total-value')?.textContent;
    await waitFor(() => expect(totalEl()).toContain('430,000'));
    const firstRows = Array.from(container.querySelectorAll('.ledger-amount')).map((el) => el.textContent);
    // 가중 분배가 적용되면 322,500 / 107,500 (균등이면 215,000 / 215,000)
    expect(firstRows).toContain('322,500원');
    expect(firstRows).toContain('107,500원');

    // 2차 계산 시뮬레이션: 투자금 2배 → E2 (연 1,000,000 → 세후 860,000)
    const e2 = getStockDividends([BASE_STOCK], 20000000);
    await act(async () => {
      api!.setValue('totalInvestment', 20000000);
      api!.setValue('stockDividends', e2);
    });

    await waitFor(() => expect(totalEl()).toContain('860,000'), { timeout: 3000 });
    const secondRows = Array.from(container.querySelectorAll('.ledger-amount')).map((el) => el.textContent);
    expect(secondRows).not.toEqual(firstRows);
  });

  it('비중 변경 후 재계산하면 월별 현금흐름이 갱신된다 (2종목)', async () => {
    const stockA: Stock = { ...BASE_STOCK, ratio: 50, ticker: 'AAA' };
    // B는 이력과 겹치지 않는 월 → 균등 분할 fallback
    const stockB: Stock = { ...BASE_STOCK, dividendMonths: [1, 2], name: '테스트B', ratio: 50, ticker: 'BBB' };
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        histories: [
          { dividends: MOCK_DIVIDENDS, symbol: 'AAA' },
          { dividends: MOCK_DIVIDENDS, symbol: 'BBB' },
        ],
      }),
      ok: true,
    } as Response);

    let api: UseFormReturn<FormValues> | null = null;
    const { container } = render(
      <Harness
        onReady={(m) => {
          api = m;
        }}
      />,
    );
    await act(async () => {
      api!.setValue('stocks', [stockA, stockB]);
      api!.setValue('stockDividends', getStockDividends([stockA, stockB], 10000000));
    });
    const totalEl = () => container.querySelector('.ledger-total-value')?.textContent;
    await waitFor(() => expect(totalEl()).toContain('430,000'));
    const firstRows = Array.from(container.querySelectorAll('.ledger-amount')).map((el) => el.textContent);

    // 비중 80/20으로 변경 후 재계산 (연 총액은 동일, 월별도 동일해야 함은 아님 - 종목별 annual이 바뀜)
    const stockA2: Stock = { ...stockA, ratio: 80 };
    const stockB2: Stock = { ...stockB, ratio: 20 };
    await act(async () => {
      api!.setValue('stocks', [stockA2, stockB2]);
      api!.setValue('stockDividends', getStockDividends([stockA2, stockB2], 10000000));
    });
    await waitFor(
      () => expect(
        Array.from(container.querySelectorAll('.ledger-amount')).map((el) => el.textContent),
      ).not.toEqual(firstRows),
      { timeout: 3000 },
    );
  });

  it('종목 비활성화 후 재계산하면 월별 현금흐름이 갱신된다', async () => {
    const stockA: Stock = { ...BASE_STOCK, ratio: 50, ticker: 'AAA' };
    const stockB: Stock = { ...BASE_STOCK, dividendMonths: [1, 2], name: '테스트B', ratio: 50, ticker: 'BBB' };
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        histories: [
          { dividends: MOCK_DIVIDENDS, symbol: 'AAA' },
          { dividends: MOCK_DIVIDENDS, symbol: 'BBB' },
        ],
      }),
      ok: true,
    } as Response);

    let api: UseFormReturn<FormValues> | null = null;
    const { container } = render(
      <Harness
        onReady={(m) => {
          api = m;
        }}
      />,
    );
    await act(async () => {
      api!.setValue('stocks', [stockA, stockB]);
      api!.setValue('stockDividends', getStockDividends([stockA, stockB], 10000000));
    });
    const textOf = (sel: string) => container.querySelector(sel)?.textContent;
    await waitFor(() => expect(textOf('.ledger-total-value')).toContain('430,000'));

    // B 비활성화 후 재계산 (B는 균등분할 월 [1,2]에만 금액이 있었음 → 1월·2월 0원 예상)
    const stockBOff: Stock = { ...stockB, enabled: false };
    await act(async () => {
      api!.setValue('stocks', [stockA, stockBOff]);
      api!.setValue('stockDividends', getStockDividends([stockA], 10000000));
    });
    await waitFor(
      () => expect(
        Array.from(container.querySelectorAll('.ledger-amount'))[0]?.textContent,
      ).toBe('0원'),
      { timeout: 3000 },
    );
    expect(textOf('.ledger-total-value')).toContain('215,000');
  });

  it('배당 지급월 변경 후 재계산하면 월별 현금흐름이 갱신된다', async () => {
    let api: UseFormReturn<FormValues> | null = null;
    const { container } = render(
      <Harness
        onReady={(m) => {
          api = m;
        }}
      />,
    );
    await act(async () => {
      api!.setValue('stockDividends', getStockDividends([BASE_STOCK], 10000000));
    });
    const rowsOf = () => Array.from(container.querySelectorAll('.ledger-amount')).map((el) => el.textContent);
    await waitFor(() => expect(container.querySelector('.ledger-total-value')?.textContent).toContain('430,000'));
    const skewedMonth = MONTHS[0];
    expect(rowsOf()[skewedMonth - 1]).not.toBe('0원');

    // 지급월을 [1,2]로 변경 후 재계산 → 기존 가중 월은 0원이 되어야 함
    const changed: Stock = { ...BASE_STOCK, dividendMonths: [1, 2] };
    await act(async () => {
      api!.setValue('stocks', [changed]);
      api!.setValue('stockDividends', getStockDividends([changed], 10000000));
    });
    await waitFor(() => expect(rowsOf()[skewedMonth - 1]).toBe('0원'), { timeout: 3000 });
  });

  it('실사용 순서(수정→대기→재계산)에서도 월별 현금흐름이 갱신된다', async () => {
    let api: UseFormReturn<FormValues> | null = null;
    const { container } = render(
      <Harness
        onReady={(m) => {
          api = m;
        }}
      />,
    );
    // 1차 계산
    await act(async () => {
      api!.setValue('stockDividends', getStockDividends([BASE_STOCK], 10000000));
    });
    const rowsOf = () => Array.from(container.querySelectorAll('.ledger-amount')).map((el) => el.textContent);
    await waitFor(() => expect(container.querySelector('.ledger-total-value')?.textContent).toContain('430,000'));

    // 종목 수정만 하고 대기 (이펙트가 중간 가중값을 폼에 쓰는 단계)
    const changed: Stock = { ...BASE_STOCK, dividendMonths: [1, 2] };
    await act(async () => {
      api!.setValue('stocks', [changed]);
    });
    await act(async () => {});

    // 재계산 (프로바이더와 동일하게 stockDividends 통째로 교체)
    await act(async () => {
      api!.setValue('stockDividends', getStockDividends([changed], 10000000));
    });
    await waitFor(() => expect(rowsOf()[MONTHS[0] - 1]).toBe('0원'), { timeout: 3000 });
    expect(rowsOf()[0]).not.toBe('0원');
  });

  it('티커 교체 후 재계산하면 월별 현금흐름이 갱신된다', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: RequestInit) => {
      const symbols = JSON.parse(init?.body as string).symbols as string[];
      return {
        json: async () => ({
          histories: symbols.map((symbol) => ({ dividends: MOCK_DIVIDENDS, symbol })),
        }),
        ok: true,
      } as Response;
    });
    let api: UseFormReturn<FormValues> | null = null;
    const { container } = render(
      <Harness
        onReady={(m) => {
          api = m;
        }}
      />,
    );
    await act(async () => {
      api!.setValue('stockDividends', getStockDividends([BASE_STOCK], 10000000));
    });
    const rowsOf = () => Array.from(container.querySelectorAll('.ledger-amount')).map((el) => el.textContent);
    await waitFor(() => expect(container.querySelector('.ledger-total-value')?.textContent).toContain('430,000'));
    const firstRows = rowsOf();

    // 티커 교체 + 배당률 변경 후 재계산 (연 500,000 → 1,000,000)
    const stockB: Stock = { ...BASE_STOCK, name: '테스트B', ticker: 'BBB', yield: 10 };
    await act(async () => {
      api!.setValue('stocks', [stockB]);
    });
    await act(async () => {});
    await act(async () => {
      api!.setValue('stockDividends', getStockDividends([stockB], 10000000));
    });
    await waitFor(() => expect(container.querySelector('.ledger-total-value')?.textContent).toContain('860,000'), { timeout: 3000 });
    expect(rowsOf()).not.toEqual(firstRows);
  });
});
