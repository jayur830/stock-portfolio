'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

export const currencySymbols: Record<string, { symbol: string; name: string; unit: string }> = {
  USD: { symbol: 'USDKRW=X', name: '미국 달러', unit: '1 USD' },
  JPY: { symbol: 'JPYKRW=X', name: '일본 엔', unit: '1 JPY' },
  EUR: { symbol: 'EURKRW=X', name: '유럽 유로', unit: '1 EUR' },
  CNY: { symbol: 'CNYKRW=X', name: '중국 위안', unit: '1 CNY' },
  GBP: { symbol: 'GBPKRW=X', name: '영국 파운드', unit: '1 GBP' },
  HKD: { symbol: 'HKDKRW=X', name: '홍콩 달러', unit: '1 HKD' },
  VND: { symbol: 'VNDKRW=X', name: '베트남 동', unit: '1 VND' },
};

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  months: number;
}

const periodOptions: TimePeriodOption[] = [
  { value: '1M', label: '1개월', months: 1 },
  { value: '3M', label: '3개월', months: 3 },
  { value: '6M', label: '6개월', months: 6 },
  { value: '1Y', label: '1년', months: 12 },
  { value: '3Y', label: '3년', months: 36 },
  { value: '5Y', label: '5년', months: 60 },
];

interface ExchangeRateChartProps {
  currency: string;
  height?: number | string;
}

export default function ExchangeRateChart({ currency, height = 300 }: ExchangeRateChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1Y');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const currencyInfo = currencySymbols[currency] || { symbol: `${currency}KRW=X`, name: currency, unit: `1 ${currency}` };

  const { data: historyData, isLoading, isError } = useQuery({
    queryKey: ['exchangeRateHistory', currencyInfo.symbol],
    queryFn: async () => {
      const res = await fetch('/api/stock/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [currencyInfo.symbol] }),
      });
      if (!res.ok) {
        throw new Error('환율 데이터를 불러오지 못했습니다.');
      }
      const json = await res.json();
      return (json.histories?.[0]?.data || []) as { date: string; close: number }[];
    },
    staleTime: 1000 * 60 * 30, // 30분
  });

  /** 기간 필터링된 데이터 */
  const filteredData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    const validData = historyData.filter((d) => d.close != null && !isNaN(d.close) && d.close > 0);

    const periodOption = periodOptions.find((p) => p.value === selectedPeriod);
    if (!periodOption) return validData;

    const startDate = dayjs().subtract(periodOption.months, 'month');
    const sliced = validData.filter((d) => dayjs(d.date).isAfter(startDate) || dayjs(d.date).isSame(startDate, 'day'));
    return sliced.length > 0 ? sliced : validData;
  }, [historyData, selectedPeriod]);

  /** 통계 데이터 (최고, 최저, 시작가, 현재가, 변동률) */
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const closes = filteredData.map((d) => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const first = closes[0];
    const latest = closes[closes.length - 1];
    const change = latest - first;
    const changeRate = first > 0 ? (change / first) * 100 : 0;

    return { min, max, first, latest, change, changeRate };
  }, [filteredData]);

  /** ECharts 옵션 */
  const chartOption = useMemo(() => {
    if (filteredData.length === 0) return null;

    const xData = filteredData.map((d) => dayjs(d.date).format('YYYY-MM-DD'));
    const yData = filteredData.map((d) => +d.close.toFixed(2));

    const isPositive = (stats?.changeRate ?? 0) >= 0;
    const lineColor = isPositive ? '#f43f5e' : '#3b82f6'; // 상승 빨강/로즈, 하락 파랑
    const areaColorStart = isPositive ? 'rgba(244, 63, 94, 0.25)' : 'rgba(59, 130, 246, 0.25)';
    const areaColorEnd = isPositive ? 'rgba(244, 63, 94, 0.0)' : 'rgba(59, 130, 246, 0.0)';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 12,
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          const item = params[0];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${item.axisValue}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <span style="color: ${item.color}; font-size: 11px;">${currencyInfo.unit}</span>
              <span style="font-weight: 700;">${item.data.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원</span>
            </div>
          `;
        },
      },
      grid: {
        top: 20,
        left: 10,
        right: 15,
        bottom: 25,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
          formatter: (value: string) => dayjs(value).format('YY.MM'),
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: {
          lineStyle: {
            color: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
          formatter: (val: number) => val.toLocaleString('ko-KR'),
        },
      },
      series: [
        {
          name: `${currency}/KRW`,
          type: 'line',
          data: yData,
          showSymbol: false,
          smooth: true,
          lineStyle: {
            width: 2.2,
            color: lineColor,
          },
          itemStyle: {
            color: lineColor,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: areaColorStart },
                { offset: 1, color: areaColorEnd },
              ],
            },
          },
        },
      ],
    };
  }, [
    currency,
    currencyInfo,
    filteredData,
    isDark,
    stats,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-[250px] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-xs">환율 추이 데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (isError || !historyData || historyData.length === 0) {
    return (
      <div className="flex h-[200px] w-full flex-col items-center justify-center gap-1 text-muted-foreground">
        <p className="text-xs">환율 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 통계 요약 헤더 */}
      {stats && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-muted/40 p-3">
          <div>
            <div className="text-xs text-muted-foreground">{currencyInfo.unit} 기준</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                {stats.latest.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원
              </span>
              <span className={`text-xs font-semibold ${stats.changeRate >= 0 ? 'text-rose-500' : 'text-blue-500'}`}>
                {stats.changeRate >= 0 ? '+' : ''}
                {stats.changeRate.toFixed(2)}% ({stats.change >= 0 ? '+' : ''}
                {stats.change.toFixed(2)}원)
              </span>
            </div>
          </div>
          <div className="flex gap-3 text-right text-xs text-muted-foreground">
            <div>
              <span>최저 </span>
              <strong className="text-foreground">{stats.min.toFixed(1)}</strong>
            </div>
            <div>
              <span>최고 </span>
              <strong className="text-foreground">{stats.max.toFixed(1)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 기간 필터 버튼 */}
      <div className="flex items-center justify-end gap-1">
        {periodOptions.map((option) => (
          <Button
            className="h-7 px-2.5 text-xs font-medium"
            key={option.value}
            onClick={() => setSelectedPeriod(option.value)}
            size="sm"
            type="button"
            variant={selectedPeriod === option.value ? 'default' : 'ghost'}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* ECharts 렌더링 */}
      {chartOption && (
        <div className="w-full">
          <ReactECharts notMerge option={chartOption} style={{ height, width: '100%' }} />
        </div>
      )}
    </div>
  );
}
