'use client';

import { Calculator, ChevronRight, CircleDollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { Controller, useController, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { mergeMonthlyDividends } from '@/lib/utils';
import type { FormValues } from '@/types';

import CalculateButton from './calculate-button';
import CountPerStock from './count-per-stock';
import ExportButton from './export-button';
import MonthlyDividends from './monthly-dividends';
import StockCharts from './stock-charts';
import TaxInfo from './tax-info';

export default function Results() {
  const { control } = useFormContext<FormValues>();

  const { field: { value: stocks } } = useController({ control, name: 'stocks' });
  const { field: { value: targetAnnualDividend } } = useController({ control, name: 'targetAnnualDividend' });
  const { field: { value: calculatedCategory } } = useController({ control, name: 'calculatedCategory' });
  const { field: { value: stockDividends } } = useController({ control, name: 'stockDividends' });

  /** 종목별 연 배당금 합산 (세전 총 연 배당금) */
  const annualDividend = useMemo(() => stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0), [stockDividends]);

  /** 세후 연 배당금 */
  const afterTaxAnnualDividend = useMemo(
    () => stockDividends.reduce((sum, { annualDividend, taxRate }) => sum + annualDividend * (1 - taxRate), 0),
    [stockDividends],
  );

  /** 필요한 투자금 */
  const requiredInvestment = useMemo(() => {
    /** 각 종목별 비율에 따른 배당 수익률의 합 */
    const weightedDividendYield = stocks
      .filter(({ enabled }) => enabled)
      .reduce((sum, stock) => sum + (stock.yield / 100) * (stock.ratio / 100), 0);
    return weightedDividendYield > 0 ? targetAnnualDividend / weightedDividendYield : 0;
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

  const totalRatio = stocks
    .filter(({ enabled }) => enabled)
    .reduce((total, { ratio }) => total + (ratio || 0), 0);
  const ratioState = totalRatio === 100 ? 'is-complete' : totalRatio > 100 ? 'is-over' : '';
  const ratioMessage = totalRatio === 100 ? '배분이 완성됐어요. 이제 결과를 계산해보세요.' : totalRatio > 100 ? '비율 합계가 100%를 초과했어요. 비중을 조정해주세요.' : '종목 비중의 합계를 100%에 맞추면 가장 정확해요.';

  // #region 종합과세 계산은 복잡하여 추후 과제로 보류
  /** 배당금 계산 모드: 종합소득세 추가 납부세액 */
  // const annualDividendAdditionalTax = getComprehensiveTax(annualDividend, foreignDividends);

  // const requiredInvestmentAdditionalTax = calculatedCategory === 'investment' && targetAnnualDividend ? getComprehensiveTax(targetAnnualDividend, foreignDividends) : null;
  // #endregion

  return (
    <div className="results-stack">
      <div className="allocation-card">
        <div className="allocation-topline">
          <span className="allocation-label">현재 포트폴리오 배분</span>
          <strong className={`allocation-value ${ratioState}`}>{totalRatio.toFixed(1)}%</strong>
        </div>
        <div aria-label={`포트폴리오 배분 ${totalRatio.toFixed(1)}%`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={Math.min(totalRatio, 100)} className="allocation-track" role="progressbar">
          <div className={`allocation-track-fill ${ratioState === 'is-over' ? 'is-over' : ''}`} style={{ width: `${Math.min(totalRatio, 100)}%` }} />
        </div>
        <p className={`allocation-help ${ratioState}`}>{ratioMessage}</p>
      </div>

      <div className="result-action-row">
        <CalculateButton className="calculate-action" control={control}>
          <Calculator size={17} />
          결과 계산하기
        </CalculateButton>
        <Button className="reset-action" type="reset" variant="outline">초기화</Button>
        {calculatedCategory && <ExportButton />}
      </div>

      {!calculatedCategory && (
        <div className="empty-result">
          <div className="empty-icon"><CircleDollarSign size={25} /></div>
          <h3 className="empty-title">계산 결과가 이곳에 표시됩니다</h3>
          <p className="empty-description">투자금 또는 목표 배당금을 입력하고, 종목별 비중을 정한 뒤 결과를 확인하세요.</p>
          <div className="empty-steps">
            <span className="empty-step-number">1</span>
            <span>입력</span>
            <ChevronRight size={12} />
            <span className="empty-step-number">2</span>
            <span>계산</span>
            <ChevronRight size={12} />
            <span className="empty-step-number">3</span>
            <span>확인</span>
          </div>
        </div>
      )}

      {/** 배당금 결과 */}
      {calculatedCategory === 'dividend' && (
        <>
          <div aria-live="polite" className="result-highlight is-dividend">
            <div className="result-highlight-head">
              <div>
                <span className="result-overline">CALCULATED INCOME</span>
                <h3 className="result-highlight-title">예상 배당금</h3>
              </div>
              <div className="result-highlight-icon"><CircleDollarSign size={18} /></div>
            </div>
            <div className="result-highlight-values">
              <div className="result-value-card">
                <span className="result-value-label">세전 연 배당금</span>
                <strong className="result-value">{annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</strong>
                <span className="result-value-subtext">계산된 연간 배당</span>
              </div>
              <div className="result-value-card">
                <span className="result-value-label">세후 연 배당금</span>
                <strong className="result-value">{afterTaxAnnualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</strong>
                <span className="result-value-subtext">실수령 기준</span>
              </div>
            </div>
          </div>
          <CountPerStock />
          <MonthlyDividends amounts={monthlyDividends} />
          <div className="tax-surface">
            <h3 className="tax-surface-title">배당소득세 정보</h3>
            <TaxInfo stockDividends={stockDividends} />
          </div>
        </>
      )}

      {/** 투자금 결과 */}
      {calculatedCategory === 'investment' && (
        <>
          <div aria-live="polite" className="result-highlight is-investment">
            <div className="result-highlight-head">
              <div>
                <span className="result-overline">YOUR REQUIRED CAPITAL</span>
                <h3 className="result-highlight-title">필요한 투자금</h3>
              </div>
              <div className="result-highlight-icon"><CircleDollarSign size={18} /></div>
            </div>
            <div className="result-highlight-values">
              <div className="result-value-card">
                <span className="result-value-label">목표 연 배당금</span>
                <strong className="result-value">{targetAnnualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</strong>
                <span className="result-value-subtext">목표 현금흐름을 만들기 위한 기준</span>
              </div>
              <div className="result-value-card">
                <span className="result-value-label">필요한 투자금</span>
                <strong className="result-value">{requiredInvestment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</strong>
                <span className="result-value-subtext">현재 입력한 배당률과 비중 기준</span>
              </div>
            </div>
          </div>
          <CountPerStock />
          <MonthlyDividends amounts={monthlyDividends} />
          <div className="tax-surface">
            <h3 className="tax-surface-title">배당소득세 정보</h3>
            {targetAnnualDividend > 0 && <TaxInfo stockDividends={stockDividends} />}
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
    </div>
  );
}
