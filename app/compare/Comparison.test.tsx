import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { type SavedPortfolio, writePortfolios } from '../../lib/saved-portfolios';
import Comparison from './Comparison';
it('selects three saved items, freezes results until calculation and changes baseline', async () => {
  const items: SavedPortfolio[] = ['하나', '둘', '셋'].map((name, i) => ({
    version: 1,
    id: String(i),
    name,
    savedAt: '2026-01-01',
    mode: 'dividend',
    investment: 1000000 * (i + 1),
    targetAnnualDividend: 0,
    exchangeRates: {},
    stocks: [
      {
        ticker: 'TEST',
        name: '종목',
        currency: 'KRW',
        price: 10000,
        yield: i === 2 ? 20 : 10,
        ratio: 100,
        enabled: true,
        dividendMonths: [1, 7],
      },
    ],
  }));
  writePortfolios(items);
  render(<Comparison />);
  await waitFor(() => expect(screen.getByText('하나')).toBeTruthy());
  fireEvent.click(screen.getByText('모두 선택'));
  fireEvent.click(screen.getByRole('button', { name: '비교 계산' }));
  const result = screen.getByRole('region', { name: '비교 결과' });
  expect(within(result).queryByText('하나 (기준)')).toBeNull();
  expect(within(result).queryByText('차이 +100,000원')).toBeNull();
  const before = result.textContent;
  fireEvent.change(screen.getByLabelText('공통 투자금'), { target: { value: '2000000' } });
  expect(result.textContent).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: '비교 계산' }));
  expect(within(result).queryByText('셋 (기준)')).toBeNull();
  fireEvent.click(screen.getByText('선택 해제'));
  fireEvent.click(screen.getByRole('button', { name: '비교 계산' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(within(result).queryByText('셋 (기준)')).toBeNull();
});

it('saves three named applied configurations then compares them after mounting the page', async () => {
  localStorage.clear();
  const { AppliedCalculationContext } = await import('../_components/AppliedCalculationContext');
  const { default: SavePortfolio } = await import('../_components/results/SavePortfolio');
  const applied = {
    totalInvestment: 1000000,
    targetAnnualDividend: 0,
    requiredInvestment: 1000000,
    calculatedCategory: 'dividend' as const,
    weightedDividendYield: 0.1,
    compoundSettings: { monthlyContribution: 0, years: 10, reinvestDividend: true, priceGrowthRate: 3 },
    stocks: [
      {
        name: '종목',
        ticker: 'TEST',
        currency: 'KRW' as const,
        price: 10000,
        yield: 10,
        ratio: 100,
        enabled: true,
        dividendMonths: [1, 7],
      },
    ],
    exchangeRates: {},
    stockDividends: [],
  };
  const saved = render(
    <AppliedCalculationContext.Provider value={applied}>
      <SavePortfolio />
    </AppliedCalculationContext.Provider>,
  );
  for (const name of ['저장1', '저장2', '저장3']) {
    fireEvent.change(screen.getByLabelText('저장할 포트폴리오 이름'), { target: { value: name } });
    fireEvent.click(screen.getByRole('button', { name: '포트폴리오 저장' }));
    expect(screen.getByRole('status').textContent).toBe('저장했습니다.');
  }
  saved.unmount();
  render(<Comparison />);
  await waitFor(() => expect(screen.getByText('저장3')).toBeTruthy());
  fireEvent.click(screen.getByText('모두 선택'));
  fireEvent.click(screen.getByRole('button', { name: '비교 계산' }));
  const result = screen.getByRole('region', { name: '비교 결과' });
  expect(result.querySelectorAll('td[class*=emerald]').length).toBeGreaterThan(0);
});
