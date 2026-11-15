'use client';

import { Calculator, CircleDollarSign, Scale } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { mergeMonthlyDividends, normalizeStockRatios } from '@/lib/utils';
import type { FormValues } from '@/types';

import { useAppliedCalculation } from '../AppliedCalculationContext';
import CalculateButton from './CalculateButton';
import CompoundDividendSimulator from './CompoundDividendSimulator';
import CountPerStock from './CountPerStock';
import ExportButton from './ExportButton';
import HealthInsuranceInfo from './HealthInsuranceInfo';
import MonthlyDividends from './MonthlyDividends';
import SavePortfolio from './SavePortfolio';
import TaxInfo from './TaxInfo';

const StockCharts = dynamic(() => import('./stock-charts'), {
  loading: () => <div className="h-96 rounded-2xl bg-card/40 animate-pulse" />,
  ssr: false,
});

export default function Results({ view = 'summary' }: { view?: 'summary' | 'details' }) {
  const { control, setValue } = useFormContext<FormValues>();

  const {
    field: { value: stocks },
  } = useController({ control, name: 'stocks' });
  const applied = useAppliedCalculation();
  const {
    totalInvestment = 0,
    targetAnnualDividend = 0,
    calculatedCategory,
    stockDividends = [],
    weightedDividendYield = 0,
    requiredInvestment = 0,
  } = applied || {};

  /** 종목별 연 배당금 합산 (세전 총 연 배당금) */
  const annualDividend = stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0);

  /** 세후 연 배당금 */
  const afterTaxAnnualDividend = stockDividends.reduce(
    (sum, { annualDividend, taxRate }) => sum + Math.round(annualDividend * (1 - taxRate)),
    0,
  );

  /** 종목별 월별 배당금 합산 */
  const monthlyDividends = mergeMonthlyDividends(stockDividends);

  const totalRatio = stocks.filter(({ enabled }) => enabled).reduce((total, { ratio }) => total + (ratio || 0), 0);
  const ratioState = totalRatio === 100 ? 'is-complete' : totalRatio > 100 ? 'is-over' : '';
  const ratioMessage =
    totalRatio === 100
      ? '배분이 완성됐어요. 이제 결과를 계산해보세요.'
      : totalRatio > 100
        ? '비율 합계가 100%를 초과했어요. 비중을 조정해주세요.'
        : '종목 비중의 합계를 100%에 맞추면 가장 정확해요.';

  const handleNormalizeRatios = () => {
    const normalized = normalizeStockRatios(stocks);
    setValue('stocks', normalized, { shouldValidate: true, shouldDirty: true });
  };

  // #region 종합과세 계산은 복잡하여 추후 과제로 보류
  /** 배당금 계산 모드: 종합소득세 추가 납부세액 */
  // const annualDividendAdditionalTax = getComprehensiveTax(annualDividend, foreignDividends);

  // const requiredInvestmentAdditionalTax = calculatedCategory === 'investment' && targetAnnualDividend ? getComprehensiveTax(targetAnnualDividend, foreignDividends) : null;
  // #endregion

  if (view === 'summary')
    return (
      <div className="results-stack">
        <SavePortfolio />
        <div className="allocation-card">
          <div className="allocation-topline">
            <div className="flex items-center gap-2">
              <span className="allocation-label">현재 포트폴리오 배분</span>
              {totalRatio !== 100 && stocks.some((s) => s.enabled) && (
                <button
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/15 border border-primary/25 transition-all cursor-pointer shadow-xs active:scale-95"
                  onClick={handleNormalizeRatios}
                  title="각 종목의 상대적 비율을 유지한 채 합계가 정확히 100%가 되도록 비례 환산합니다"
                  type="button"
                >
                  <Scale size={12} />
                  <span>100% 자동 맞춤</span>
                </button>
              )}
            </div>
            <strong className={`allocation-value ${ratioState}`}>{totalRatio.toFixed(1)}%</strong>
          </div>
          <div
            aria-label={`포트폴리오 배분 ${totalRatio.toFixed(1)}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.min(totalRatio, 100)}
            className="allocation-track"
            role="progressbar"
          >
            <div
              className={`allocation-track-fill ${ratioState === 'is-over' ? 'is-over' : ''}`}
              style={{ width: `${Math.min(totalRatio, 100)}%` }}
            />
          </div>
          <p className={`allocation-help ${ratioState}`}>{ratioMessage}</p>
        </div>

        <div className="result-action-row">
          <CalculateButton className="calculate-action flex-1" control={control}>
            <Calculator size={17} />
            결과 계산하기
          </CalculateButton>
          <Button className="reset-action bg-card/45" type="reset" variant="outline">
            초기화
          </Button>
          {calculatedCategory && <ExportButton />}
        </div>

        {!calculatedCategory && (
          <div className="empty-result">
            <div className="empty-icon">
              <CircleDollarSign size={25} />
            </div>
            <h3 className="empty-title">나의 다음 현금흐름</h3>
            <div aria-hidden="true" className="empty-metrics">
              <div>
                <span>세후 연 배당금</span>
                <strong>—</strong>
              </div>
              <div>
                <span>월 평균 배당금</span>
                <strong>—</strong>
              </div>
            </div>
            <p className="empty-description">
              투자금과 종목을 입력하면 예상 배당금과 월별 현금흐름을 확인할 수 있어요.
            </p>
          </div>
        )}

        {calculatedCategory && (
          <div aria-live="polite" className="result-highlight">
            <span className="result-overline">
              {calculatedCategory === 'dividend' ? '예상 세후 연 배당금' : '필요한 투자금'}
            </span>
            <strong className="result-value">
              {Math.round(
                calculatedCategory === 'dividend' ? afterTaxAnnualDividend : requiredInvestment,
              ).toLocaleString('ko-KR')}
              원
            </strong>
            {calculatedCategory === 'dividend' && (
              <p className="surface-description">
                월 평균 {Math.round(afterTaxAnnualDividend / 12).toLocaleString('ko-KR')}원
              </p>
            )}
            <a className="result-detail-link" href="#portfolio-details">
              상세 결과 보기 ↓
            </a>
          </div>
        )}
      </div>
    );

  if (!calculatedCategory) return null;

  return (
    <section aria-label="포트폴리오 상세 결과" className="results-stack result-details" id="portfolio-details">
      <h2 className="section-title">포트폴리오 분석</h2>
      {/** 배당금 결과 */}
      {calculatedCategory === 'dividend' && (
        <div className="results-bento">
          <div className="bento-main">
            <div aria-live="polite" className="result-highlight is-dividend">
              <div className="result-highlight-head">
                <div>
                  <span className="result-overline">연간 현금흐름</span>
                  <h3 className="result-highlight-title">예상 배당금</h3>
                </div>
                <div className="result-highlight-icon">
                  <CircleDollarSign size={18} />
                </div>
              </div>
              <div className="result-highlight-values">
                <div className="result-value-card">
                  <span className="result-value-label">세전 연 배당금</span>
                  <strong className="result-value">
                    {annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </strong>
                  <span className="result-value-subtext">계산된 연간 배당</span>
                </div>
                <div className="result-value-card">
                  <span className="result-value-label">세후 연 배당금</span>
                  <strong className="result-value">
                    {afterTaxAnnualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </strong>
                  <span className="result-value-subtext">실수령 기준</span>
                </div>
              </div>
            </div>
            <MonthlyDividends
              amounts={monthlyDividends}
              annualDividend={annualDividend}
              stockDividends={stockDividends}
            />
          </div>
          <div className="bento-side">
            <CountPerStock />
            <div className="tax-surface">
              <h3 className="tax-surface-title">배당소득세 정보</h3>
              <TaxInfo stockDividends={stockDividends} />
            </div>
            <HealthInsuranceInfo annualDividend={annualDividend} />
          </div>
        </div>
      )}

      {/** 투자금 결과 */}
      {calculatedCategory === 'investment' && (
        <div className="results-bento">
          <div className="bento-main">
            <div aria-live="polite" className="result-highlight is-investment">
              <div className="result-highlight-head">
                <div>
                  <span className="result-overline">목표 달성을 위한 투자금</span>
                  <h3 className="result-highlight-title">필요한 투자금</h3>
                </div>
                <div className="result-highlight-icon">
                  <CircleDollarSign size={18} />
                </div>
              </div>
              <div className="result-highlight-values">
                <div className="result-value-card">
                  <span className="result-value-label">목표 연 배당금</span>
                  <strong className="result-value">
                    {targetAnnualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </strong>
                  <span className="result-value-subtext">목표 현금흐름을 만들기 위한 기준</span>
                </div>
                <div className="result-value-card">
                  <span className="result-value-label">필요한 투자금</span>
                  <strong className="result-value">
                    {requiredInvestment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </strong>
                  <span className="result-value-subtext">현재 입력한 배당률과 비중 기준</span>
                </div>
              </div>
            </div>
            <MonthlyDividends
              amounts={monthlyDividends}
              annualDividend={annualDividend}
              stockDividends={stockDividends}
            />
          </div>
          <div className="bento-side">
            <CountPerStock />
            <div className="tax-surface">
              <h3 className="tax-surface-title">배당소득세 정보</h3>
              {targetAnnualDividend > 0 && <TaxInfo stockDividends={stockDividends} />}
            </div>
            {targetAnnualDividend > 0 && <HealthInsuranceInfo annualDividend={targetAnnualDividend} />}
          </div>
        </div>
      )}

      {/** 미래 복리 & 배당 성장 시뮬레이터 */}
      {calculatedCategory && (calculatedCategory === 'investment' ? requiredInvestment : totalInvestment) > 0 && (
        <CompoundDividendSimulator
          initialInvestment={calculatedCategory === 'investment' ? requiredInvestment : totalInvestment}
          portfolioDividendYield={weightedDividendYield * 100}
          stocks={applied!.stocks}
        />
      )}

      {/** 차트 */}
      {applied?.chartData && <StockCharts {...applied.chartData} />}
    </section>
  );
}
