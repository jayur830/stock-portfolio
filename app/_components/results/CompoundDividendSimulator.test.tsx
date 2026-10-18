import { render } from '@testing-library/react';

import type { Stock } from '@/types';

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
      cagr5: 8.5,
      payoutYears: 12,
      tier: 'ACHIEVER',
      badge: '배당성취자 (10년+)',
      description: '',
    },
  },
];

describe('CompoundDividendSimulator', () => {
  it('renders correctly with given portfolio values', () => {
    const { container } = render(
      <CompoundDividendSimulator initialInvestment={10_000_000} portfolioDividendYield={4.0} stocks={mockStocks} />,
    );

    expect(container.textContent).toContain('미래 복리 & 배당 성장 시뮬레이터');
    expect(container.textContent).toContain('매월 추가 적립금');
    expect(container.textContent).toContain('투자 기간');
    expect(container.textContent).toContain('배당금 100% 재투자 (DRIP)');
    expect(container.textContent).toContain('예상 총 자산');
    expect(container.textContent).toContain('월 배당금');
  });
});
