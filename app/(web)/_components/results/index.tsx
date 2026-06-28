'use client';

import { useMemo } from 'react';
import { Controller, useController, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { mergeMonthlyDividends } from '@/lib/utils';
import type { FormValues } from '@/types';

import CalculateButton from './calculate-button';
import CountPerStock from './count-per-stock';
import MonthlyDividends from './monthly-dividends';
import StockCharts from './stock-charts';
import TaxInfo from './tax-info';

export default function Results() {
  const { control } = useFormContext<FormValues>();

  const { field: { value: stocks } } = useController({ control, name: 'stocks' });
  const { field: { value: targetAnnualDividend } } = useController({ control, name: 'targetAnnualDividend' });
  // const { field: { value: calculatedCategory } } = useController({ control, name: 'calculatedCategory' });
  const { field: { value: stockDividends } } = useController({ control, name: 'stockDividends' });

  /** 종목별 연 배당금 합산 (세전 총 연 배당금) */
  const annualDividend = useMemo(() => stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0), [stockDividends]);

  /** 필요한 투자금 */
  const requiredInvestment = useMemo(() => {
    /** 각 종목별 비율에 따른 배당 수익률의 합 */
    const weightedDividendYield = stocks
      .filter(({ enabled }) => enabled)
      .reduce((sum, stock) => sum + (stock.yield / 100) * (stock.ratio / 100), 0);
    return targetAnnualDividend / weightedDividendYield;
  }, [stocks, targetAnnualDividend]);

  // #region 종합과세 계산은 복잡하여 추후 과제로 보류
  /** 국가별 해외 배당소득 */
  // const foreignDividends = useMemo(() => {
  //   return stockDividends
  //     .filter(({ isForeign }) => isForeign)
  //     .map(({ annualDividend, taxRate }) => ({ income: annualDividend, taxRate }));
  // }, [stockDividends]);
  // #endregion

  /** 종목별 월별 배당금 합산 */
  const monthlyDividends = useMemo(() => mergeMonthlyDividends(stockDividends), [stockDividends]);

  // #region 종합과세 계산은 복잡하여 추후 과제로 보류
  /** 배당금 계산 모드: 종합소득세 추가 납부세액 */
  // const annualDividendAdditionalTax = getComprehensiveTax(annualDividend, foreignDividends);

  // const requiredInvestmentAdditionalTax = calculatedCategory === 'investment' && targetAnnualDividend ? getComprehensiveTax(targetAnnualDividend, foreignDividends) : null;
  // #endregion

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/** 총 비율 */}
      <div className="flex justify-center items-center gap-2 text-sm">
        <span className="text-muted-foreground">총 비율:</span>
        <Controller
          control={control}
          name="stocks"
          render={({ field: { value: stocks } }) => {
            const totalRatio = stocks.reduce((acc, { ratio }) => acc + (ratio || 0), 0);
            return (
              <span className={`font-semibold ${totalRatio === 100 ? 'text-green-600' : totalRatio > 100 ? 'text-red-600' : 'text-yellow-600'}`}>
                {totalRatio.toFixed(1)}%
              </span>
            );
          }}
        />
      </div>

      {/** 버튼 */}
      <div className="flex justify-center items-center gap-1">
        <CalculateButton control={control} />
        <Button
          // onClick={handleReset}
          type="reset"
          variant="outline"
        >
          초기화
        </Button>
      </div>

      <Controller
        control={control}
        name="calculatedCategory"
        render={({ field: { value: calculatedCategory } }) => (
          <>
            {/** 배당금 결과 */}
            {calculatedCategory === 'dividend' && (
              <>
                <div aria-live="polite" className="flex md:flex-row flex-col justify-center items-center gap-4 p-2 md:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">세전 연 배당금:</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      {annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                    </span>
                  </div>
                  <div className="hidden md:block h-6 w-px bg-green-300 dark:bg-green-700" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">세후 연 배당금:</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      {stockDividends.reduce((sum, { annualDividend, taxRate }) => sum + annualDividend * (1 - taxRate), 0).toLocaleString('ko-KR', {
                        maximumFractionDigits: 0,
                      })}원
                    </span>
                  </div>
                </div>
                <CountPerStock tab="dividend" />
                <MonthlyDividends amounts={monthlyDividends} />
                <div className="flex flex-col gap-2 p-4 bg-card border rounded-lg">
                  <h3 className="text-sm font-semibold">배당소득세 정보</h3>
                  <div className="space-y-3">
                    <TaxInfo stockDividends={stockDividends} />
                    {/** 종합과세 계산은 복잡하여 추후 과제로 보류 */}
                    {/* {annualDividendAdditionalTax != null ? (
                      <IncomeTaxInfo additionalTax={annualDividendAdditionalTax} />
                    ) : (
                      <NoAddedTax />
                    )} */}
                  </div>
                </div>
              </>
            )}

            {/** 투자금 결과 */}
            {calculatedCategory === 'investment' && (
              <>
                <div aria-live="polite" className="flex justify-center items-center gap-4 p-2 md:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">필요한 투자금:</span>
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {requiredInvestment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                    </span>
                  </div>
                </div>
                <CountPerStock tab="investment" />
                <MonthlyDividends amounts={monthlyDividends} />
                <div className="flex flex-col gap-2 p-4 bg-card border rounded-lg">
                  <h3 className="text-sm font-semibold">배당소득세 정보</h3>
                  <div className="space-y-3">
                    {targetAnnualDividend && (
                      <>
                        <TaxInfo stockDividends={stockDividends} />
                        {/** 종합과세 계산은 복잡하여 추후 과제로 보류 */}
                        {/* {requiredInvestmentAdditionalTax != null ? (
                          <IncomeTaxInfo additionalTax={requiredInvestmentAdditionalTax} />
                        ) : (
                          <NoAddedTax />
                        )} */}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/** 차트 */}
            <Controller
              control={control}
              name="chartData"
              render={({ field: { value: chartData } }) => (
                <>
                  {calculatedCategory && chartData && chartData.stocks.length > 0 && (
                    <StockCharts
                      exchangeRates={chartData.exchangeRates}
                      stocks={chartData.stocks}
                      totalInvestment={chartData.totalInvestment}
                    />
                  )}
                </>
              )}
            />
          </>
        )}
      />
    </div>
  );
}
