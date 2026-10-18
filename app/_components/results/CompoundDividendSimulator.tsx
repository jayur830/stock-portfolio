'use client';

import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { ChevronDown, ChevronUp, Coins, RotateCcw, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { calculateCompoundDividend, CHART_FONT_FAMILY } from '@/lib/utils';
import type { Stock } from '@/types';

export interface CompoundDividendSimulatorProps {
  /** 현재 포트폴리오의 총 투자 원금 (원화) */
  initialInvestment: number;
  /** 현재 포트폴리오의 가중 평균 배당수익률 (%) */
  portfolioDividendYield: number;
  /** 포트폴리오 종목 리스트 (가중평균 배당성장률 계산용) */
  stocks: Stock[];
}

const YEAR_OPTIONS = [5, 10, 15, 20, 30];
const CONTRIBUTION_PRESETS = [0, 300_000, 500_000, 1_000_000, 2_000_000];

export default function CompoundDividendSimulator({
  initialInvestment,
  portfolioDividendYield,
  stocks,
}: CompoundDividendSimulatorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const sliderId = useId();

  // 포트폴리오의 5년 CAGR 가중평균 계산 (없으면 기본 5.0%)
  const defaultDividendGrowth = useMemo(() => {
    const enabledStocks = stocks.filter((s) => s.enabled && (s.ratio || 0) > 0);
    const totalRatio = enabledStocks.reduce((sum, s) => sum + (s.ratio || 0), 0);

    if (totalRatio === 0) return 5.0;

    let weightedCagrSum = 0;
    let ratioWithCagr = 0;

    enabledStocks.forEach((s) => {
      const cagr = s.dividendGrowth?.cagr5;
      if (typeof cagr === 'number' && !isNaN(cagr)) {
        weightedCagrSum += cagr * s.ratio;
        ratioWithCagr += s.ratio;
      }
    });

    if (ratioWithCagr > 0) {
      const avg = weightedCagrSum / ratioWithCagr;
      // 너무 극단적인 수치는 0%~15% 범위로 완화
      return Math.min(15, Math.max(0, +avg.toFixed(1)));
    }

    return 5.0;
  }, [stocks]);

  // 시뮬레이터 조절 상태
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500_000);
  const [years, setYears] = useState<number>(10);
  const [reinvestDividend, setReinvestDividend] = useState<boolean>(true);
  const [dividendGrowthRate, setDividendGrowthRate] = useState<number>(defaultDividendGrowth);
  const [priceGrowthRate, setPriceGrowthRate] = useState<number>(3.0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // 시뮬레이션 계산
  const simulation = useMemo(() => {
    return calculateCompoundDividend({
      initialInvestment: Math.max(0, initialInvestment),
      monthlyContribution,
      dividendYield: Math.max(0, portfolioDividendYield),
      dividendGrowthRate,
      priceGrowthRate,
      years,
      reinvestDividend,
    });
  }, [
    initialInvestment,
    monthlyContribution,
    portfolioDividendYield,
    dividendGrowthRate,
    priceGrowthRate,
    years,
    reinvestDividend,
  ]);

  // 복리 차트 옵션
  const chartOption = useMemo(() => {
    const xLabels = simulation.yearlyResults.map((r) => (r.year === 0 ? '현재' : `${r.year}년차`));
    const contributedData = simulation.yearlyResults.map((r) => r.totalContributed);
    const assetData = simulation.yearlyResults.map((r) => r.totalAsset);
    const monthlyDivData = simulation.yearlyResults.map((r) => r.monthlyDividend);

    return {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: CHART_FONT_FAMILY,
        color: isDark ? '#9ca3af' : '#6b7280',
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: {
          fontFamily: CHART_FONT_FAMILY,
          color: isDark ? '#e5e7eb' : '#111827',
          fontSize: 12,
        },
        formatter(params: any) {
          if (!Array.isArray(params) || params.length === 0) return '';
          const yearLabel = params[0].name;
          const idx = params[0].dataIndex;
          const res = simulation.yearlyResults[idx];
          if (!res) return '';

          return `
            <div style="font-weight: 700; margin-bottom: 6px; font-size: 13px; border-bottom: 1px solid ${
              isDark ? '#374151' : '#e5e7eb'
            }; padding-bottom: 4px;">
              ${yearLabel} 예측
            </div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 4px 14px; font-size: 11px;">
              <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">총 자산 평가액:</span>
              <span style="font-weight: 700; color: #7a5af8; text-align: right;">${Math.round(
                res.totalAsset,
              ).toLocaleString('ko-KR')}원</span>
              <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">예상 월 배당금:</span>
              <span style="font-weight: 700; color: #10b981; text-align: right;">월 ${Math.round(
                res.monthlyDividend,
              ).toLocaleString('ko-KR')}원</span>
              <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">누적 투자 원금:</span>
              <span style="font-weight: 600; text-align: right;">${Math.round(res.totalContributed).toLocaleString(
                'ko-KR',
              )}원</span>
              <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">누적 수령 배당금:</span>
              <span style="font-weight: 600; text-align: right;">${Math.round(res.cumulativeDividend).toLocaleString(
                'ko-KR',
              )}원</span>
            </div>
          `;
        },
      },
      legend: {
        data: ['예상 총 자산', '누적 투자 원금', '월 배당금 (보조축)'],
        top: 0,
        textStyle: {
          fontFamily: CHART_FONT_FAMILY,
          color: isDark ? '#d1d5db' : '#374151',
          fontSize: 11,
        },
      },
      grid: {
        left: '2%',
        right: '4%',
        bottom: 25,
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLabel: {
          fontFamily: CHART_FONT_FAMILY,
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 11,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '자산 (원)',
          nameTextStyle: {
            fontFamily: CHART_FONT_FAMILY,
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: 10,
          },
          axisLabel: {
            fontFamily: CHART_FONT_FAMILY,
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: 10,
            formatter: (v: number) => {
              if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
              if (v >= 10_000) return `${Math.round(v / 10_000)}만`;
              return v.toLocaleString('ko-KR');
            },
          },
          splitLine: {
            lineStyle: {
              color: isDark ? '#374151' : '#f3f4f6',
            },
          },
        },
        {
          type: 'value',
          name: '월 배당 (원)',
          nameTextStyle: {
            fontFamily: CHART_FONT_FAMILY,
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: 10,
          },
          axisLabel: {
            fontFamily: CHART_FONT_FAMILY,
            color: '#10b981',
            fontSize: 10,
            formatter: (v: number) => {
              if (v >= 10_000) return `${Math.round(v / 10_000)}만`;
              return v.toLocaleString('ko-KR');
            },
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '예상 총 자산',
          type: 'line',
          data: assetData,
          smooth: true,
          lineStyle: { width: 3, color: '#7a5af8' },
          itemStyle: { color: '#7a5af8' },
          areaStyle: {
            color: isDark ? 'rgba(122, 90, 248, 0.15)' : 'rgba(122, 90, 248, 0.08)',
          },
        },
        {
          name: '누적 투자 원금',
          type: 'line',
          data: contributedData,
          smooth: true,
          lineStyle: { width: 2, type: 'dashed', color: '#94a3b8' },
          itemStyle: { color: '#94a3b8' },
        },
        {
          name: '월 배당금 (보조축)',
          type: 'bar',
          yAxisIndex: 1,
          data: monthlyDivData,
          barMaxWidth: 16,
          itemStyle: {
            color: isDark ? '#059669' : '#10b981',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [simulation, isDark]);

  return (
    <Card className="compound-simulator-card p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              미래 복리 & 배당 성장 시뮬레이터
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                DRIP
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              배당 재투자(DRIP)와 매월 적립식 매수를 병행했을 때의 미래 현금흐름을 예측합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMonthlyContribution(500_000);
              setYears(10);
              setReinvestDividend(true);
              setDividendGrowthRate(defaultDividendGrowth);
              setPriceGrowthRate(3.0);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            초기화
          </Button>
        </div>
      </div>

      {/* 조절 컨트롤 패널 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-5">
        {/* 월 추가 적립금 */}
        <div className="space-y-2 p-3.5 rounded-xl bg-background/60 border border-border/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground" htmlFor={sliderId}>
              매월 추가 적립금
            </label>
            <span className="text-xs font-bold text-primary">{monthlyContribution.toLocaleString('ko-KR')}원</span>
          </div>
          <Slider
            className="py-1 cursor-pointer"
            id={sliderId}
            max={5_000_000}
            min={0}
            onValueChange={(val) => setMonthlyContribution(val[0])}
            step={100_000}
            value={[monthlyContribution]}
          />
          <div className="flex flex-wrap gap-1 pt-1">
            {CONTRIBUTION_PRESETS.map((p) => (
              <button
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  monthlyContribution === p
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                key={p}
                onClick={() => setMonthlyContribution(p)}
                type="button"
              >
                {p === 0 ? '없음' : `${p / 10_000}만`}
              </button>
            ))}
          </div>
        </div>

        {/* 투자 기간 */}
        <div className="space-y-2 p-3.5 rounded-xl bg-background/60 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">투자 기간</span>
            <span className="text-xs font-bold text-primary">{years}년</span>
          </div>
          <div className="grid grid-cols-5 gap-1 pt-1">
            {YEAR_OPTIONS.map((y) => (
              <button
                className={`py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  years === y
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                key={y}
                onClick={() => setYears(y)}
                type="button"
              >
                {y}년
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/80 pt-0.5">
            지금부터 {years}년 후 ({dayjs().add(years, 'year').format('YYYY년')}) 시점
          </p>
        </div>

        {/* 배당금 재투자 (DRIP) 스위치 */}
        <div className="p-3.5 rounded-xl bg-background/60 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">배당금 100% 재투자 (DRIP)</span>
            <Switch checked={reinvestDividend} onCheckedChange={setReinvestDividend} />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
            {reinvestDividend
              ? '✨ 세후 배당금을 원금에 전액 재투자하여 기하급수적 복리 효과를 창출합니다.'
              : '수령한 배당금을 인출하여 생활비로 사용하며, 원금만 적립식으로 운용합니다.'}
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border/40 mt-2">
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <span>상세 수익률 가정</span>
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <span className="text-[10px] text-muted-foreground/80">
              배당률 {portfolioDividendYield.toFixed(2)}% 기준
            </span>
          </div>
        </div>
      </div>

      {/* 상세 파라미터 (아코디언) */}
      {showAdvanced && (
        <div className="p-3.5 mb-5 rounded-xl bg-muted/30 border border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-foreground flex items-center justify-between mb-1">
              <span>연간 배당 성장률 (Dividend CAGR)</span>
              <span className="text-primary font-bold">{dividendGrowthRate.toFixed(1)}%</span>
            </label>
            <Input
              className="h-8 text-xs"
              max={25}
              min={0}
              onChange={(e) => setDividendGrowthRate(Math.max(0, Number(e.target.value) || 0))}
              step={0.5}
              type="number"
              value={dividendGrowthRate}
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              포트폴리오 종목들의 과거 5년 평균 배당성장률 추정치
            </span>
          </div>
          <div>
            <label className="font-semibold text-foreground flex items-center justify-between mb-1">
              <span>연간 주가 상승률 (주가 변동 가정)</span>
              <span className="text-primary font-bold">{priceGrowthRate.toFixed(1)}%</span>
            </label>
            <Input
              className="h-8 text-xs"
              max={25}
              min={-10}
              onChange={(e) => setPriceGrowthRate(Number(e.target.value) || 0)}
              step={0.5}
              type="number"
              value={priceGrowthRate}
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              연평균 주가 시세차익 성장률 (보수적 3% 권장)
            </span>
          </div>
        </div>
      )}

      {/* 핵심 결과 하이라이트 카드 4종 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">{years}년 후 예상 총 자산</span>
          <strong className="text-lg sm:text-xl font-extrabold text-primary tracking-tight mt-1">
            {Math.round(simulation.finalAsset).toLocaleString('ko-KR')}원
          </strong>
          <span className="text-[10px] text-muted-foreground mt-1">
            총 수익률{' '}
            <b className="text-primary">
              {simulation.totalReturnRate > 0 ? `+${simulation.totalReturnRate}%` : `${simulation.totalReturnRate}%`}
            </b>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">{years}년 후 월 배당금 (실수령)</span>
          <strong className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
            월 약 {Math.round(simulation.finalMonthlyDividend).toLocaleString('ko-KR')}원
          </strong>
          <span className="text-[10px] text-muted-foreground mt-1">
            연 {Math.round(simulation.finalAnnualDividend).toLocaleString('ko-KR')}원
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">누적 투자 원금</span>
          <strong className="text-base sm:text-lg font-bold text-foreground mt-1">
            {Math.round(simulation.totalContributed).toLocaleString('ko-KR')}원
          </strong>
          <span className="text-[10px] text-muted-foreground mt-1">
            초기 {Math.round(initialInvestment).toLocaleString('ko-KR')}원 + 적립
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">총 누적 수령 배당금</span>
          <strong className="text-base sm:text-lg font-bold text-foreground mt-1">
            {Math.round(simulation.totalCumulativeDividend).toLocaleString('ko-KR')}원
          </strong>
          <span className="text-[10px] text-muted-foreground mt-1">
            {reinvestDividend ? '전액 원금 재투자됨' : '전액 현금 인출 수령'}
          </span>
        </div>
      </div>

      {/* 인터랙티브 ECharts 복리 그래프 */}
      <div className="rounded-xl border border-border/60 bg-background/50 p-3 sm:p-4">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            연도별 자산 & 월 배당금 복리 성장 곡선
          </span>
          <span className="text-[10px] text-muted-foreground">마우스 오버 시 연도별 상세 금액 확인</span>
        </div>
        <div className="h-72 w-full">
          <ReactECharts notMerge option={chartOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </Card>
  );
}
