import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { useFormContext } from 'react-hook-form';

import type { FormValues } from '@/types';

import { exportPortfolioToCsv } from '../../lib/export-excel';
import { useAppliedCalculation } from './AppliedCalculationContext';
import CalculatorFormProvider from './CalculatorFormProvider';
import CompoundDividendSimulator from './results/CompoundDividendSimulator';
import CountPerStock from './results/CountPerStock';
import DividendCalendar from './results/DividendCalendar';
import ExportButton from './results/ExportButton';

jest.mock('../../lib/export-excel', () => ({ exportPortfolioToCsv: jest.fn() }));
jest.mock('echarts-for-react', () => ({
  __esModule: true,
  default: ({ option }: { option: unknown }) => <output data-testid="simulation">{JSON.stringify(option)}</output>,
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let params = new URLSearchParams('tab=dividend');
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => params,
}));
function Harness() {
  const { setValue, getValues, register } = useFormContext<FormValues>();
  const applied = useAppliedCalculation();
  return (
    <>
      <input aria-label="investment" type="number" {...register('totalInvestment', { valueAsNumber: true })} />
      <button
        type="button"
        onClick={() => {
          setValue('totalInvestment', 1000000);
          setValue('targetAnnualDividend', 100000);
          setValue('exchangeRates', { USD: 1400 });
          setValue('stocks', [
            {
              name: 'original',
              ticker: 'A',
              price: 100,
              currency: 'USD',
              dividendMonths: [1, 7],
              yield: 10,
              ratio: 100,
              enabled: true,
              purchaseDate: dayjs('2020-01-01'),
            },
          ]);
        }}
      >
        seed
      </button>
      <button
        type="button"
        onClick={() => {
          const stock = getValues('stocks')[0];
          setValue('stocks', [
            { ...stock, name: 'edited', ticker: 'B', yield: 20, price: 200, dividendMonths: [3], ratio: 50 },
            { ...stock, ticker: 'C', enabled: false },
          ]);
          setValue('exchangeRates', { USD: 1500 });
          setValue('compoundSettings.monthlyContribution', 1000000);
        }}
      >
        edit
      </button>
      <button type="button" onClick={() => setValue('stocks', [])}>
        delete
      </button>
      <button type="submit">calculate</button>
      <button type="reset">reset</button>
      {applied && (
        <>
          <CompoundDividendSimulator
            initialInvestment={applied.requiredInvestment}
            portfolioDividendYield={applied.weightedDividendYield * 100}
            stocks={applied.stocks}
          />
          <CountPerStock />
          <DividendCalendar />
        </>
      )}
      <ExportButton />
      <output data-testid="applied">{JSON.stringify(applied)}</output>
      <span data-testid="date">{applied?.stocks[0]?.purchaseDate?.format('YYYY-MM-DD')}</span>
    </>
  );
}
it.each(['dividend', 'investment'])(
  'keeps the successful %s snapshot until successful submit and clears on reset',
  async (mode) => {
    params = new URLSearchParams('tab=' + mode);
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ histories: [] }) });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(
      <CalculatorFormProvider>
        <Harness />
      </CalculatorFormProvider>,
      { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> },
    );
    const output = () => screen.getByTestId('applied').textContent;
    expect(output()).toBe('null');
    fireEvent.click(screen.getByText('seed'));
    expect(output()).toBe('null');
    fireEvent.click(screen.getByText('calculate'));
    await waitFor(() => expect(output()).toContain('original'));
    const first = output();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const simulation = screen.getByTestId('simulation').textContent;
    fireEvent.click(screen.getByRole('button', { name: '포트폴리오 분석 결과 엑셀(CSV) 다운로드' }));
    const exported = jest.mocked(exportPortfolioToCsv).mock.calls.at(-1)![0];
    expect(screen.getByTestId('date').textContent).toBe('2020-01-01');
    fireEvent.change(screen.getByLabelText('investment'), { target: { value: '2000000' } });
    fireEvent.click(screen.getByText('edit'));
    expect(output()).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('simulation').textContent).toBe(simulation);
    fireEvent.click(screen.getByRole('button', { name: '포트폴리오 분석 결과 엑셀(CSV) 다운로드' }));
    expect(jest.mocked(exportPortfolioToCsv).mock.calls.at(-1)![0]).toBe(exported);
    params = new URLSearchParams('tab=' + (mode === 'dividend' ? 'investment' : 'dividend'));
    rerender(
      <CalculatorFormProvider>
        <Harness />
      </CalculatorFormProvider>,
    );
    expect(output()).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('simulation').textContent).toBe(simulation);
    fireEvent.click(screen.getByRole('button', { name: '포트폴리오 분석 결과 엑셀(CSV) 다운로드' }));
    expect(jest.mocked(exportPortfolioToCsv).mock.calls.at(-1)![0]).toBe(exported);
    fireEvent.click(screen.getByText('calculate'));
    await waitFor(() => expect(output()).toContain('edited'));
    const second = output();
    expect(second).not.toBe(first);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(second!).compoundSettings.monthlyContribution).toBe(1000000);
    fireEvent.click(screen.getByText('delete'));
    fireEvent.click(screen.getByText('calculate'));
    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(output()).toBe(second);
    fireEvent.click(screen.getByText('reset'));
    expect(output()).toBe('null');
    jest.restoreAllMocks();
  },
);

it('restores URL draft without calculating automatically', () => {
  params = new URLSearchParams('tab=dividend&totalInvestment=123456');
  render(
    <CalculatorFormProvider>
      <Harness />
    </CalculatorFormProvider>,
  );
  expect((screen.getByLabelText('investment') as HTMLInputElement).value).toBe('123456');
  expect(screen.getByTestId('applied').textContent).toBe('null');
  expect(
    (screen.getByRole('button', { name: '포트폴리오 분석 결과 엑셀(CSV) 다운로드' }) as HTMLButtonElement).disabled,
  ).toBe(true);
});
