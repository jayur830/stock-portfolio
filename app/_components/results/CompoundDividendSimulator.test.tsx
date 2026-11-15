import { render } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { AppliedCalculation, FormValues, Stock } from '@/types';

import { AppliedCalculationContext } from '../AppliedCalculationContext';
import CompoundDividendSimulator from './CompoundDividendSimulator';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as any;

// echarts-for-react mock
jest.mock('echarts-for-react', () => {
  return function MockECharts() {
    return <div data-testid="mock-echarts" />;
  };
});

const mockStocks: Stock[] = [
  {
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity ETF',
    price: 80,
    currency: 'USD',
    yield: 3.5,
    ratio: 100,
    enabled: true,
    dividendMonths: [3, 6, 9, 12],
    dividendGrowth: {
      cagr5Y: 8.5,
      growthStreak: 12,
      badge: {
        type: 'champion',
        label: '배당 챔피언',
        icon: '🥈',
        colorClass: 'text-blue-500',
        description: '10년 이상 연속 배당 증액',
      },
    },
  },
];

function Wrapper({ children }: PropsWithChildren) {
  const compoundSettings = { monthlyContribution: 500000, years: 10, reinvestDividend: true, priceGrowthRate: 3 };
  const methods = useForm<FormValues>({ defaultValues: { compoundSettings } });
  const applied = { compoundSettings } as AppliedCalculation;
  return (
    <FormProvider {...methods}>
      <AppliedCalculationContext.Provider value={applied}>{children}</AppliedCalculationContext.Provider>
    </FormProvider>
  );
}

describe('CompoundDividendSimulator', () => {
  it('renders correctly with given portfolio values', () => {
    const { container } = render(
      <CompoundDividendSimulator initialInvestment={10_000_000} portfolioDividendYield={4.0} stocks={mockStocks} />,
      { wrapper: Wrapper },
    );

    expect(container.textContent).toContain('미래 복리 & 배당 성장 시뮬레이터');
    expect(container.textContent).toContain('매월 추가 적립금');
    expect(container.textContent).toContain('투자 기간');
    expect(container.textContent).toContain('배당금 100% 재투자 (DRIP)');
    expect(container.textContent).toContain('예상 총 자산');
    expect(container.textContent).toContain('월 배당금');
  });
});
