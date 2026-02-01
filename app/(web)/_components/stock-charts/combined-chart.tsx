import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { convertToKRW } from '@/lib/utils';

import { HistoryData, StockChartsProps } from '.';

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y';

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  months: number;
}

/** 기간 옵션 */
const periodOptions: TimePeriodOption[] = [
  { value: '1M', label: '1개월', months: 1 },
  { value: '3M', label: '3개월', months: 3 },
  { value: '6M', label: '6개월', months: 6 },
  { value: '1Y', label: '1년', months: 12 },
  { value: '3Y', label: '3년', months: 36 },
  { value: '5Y', label: '5년', months: 60 },
  { value: '10Y', label: '10년', months: 120 },
];

export interface CombinedChartProps extends Omit<StockChartsProps, 'totalInvestment'> {
  isDark: boolean;
  histories: HistoryData[];
}

/** 통합 포트폴리오 차트 (모든 종목 합산) */
export default function CombinedChart({ isDark, histories, stocks, exchangeRates }: CombinedChartProps) {
  /** 기간 필터 상태 */
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>('1Y');

  /** 오버랩 차트 표시 여부 */
  const [isOverlap, setOverlap] = useState<boolean>(true);

  const combinedChartOption = useMemo(() => {
    if (histories.length === 0) {
      return null;
    }

    let sortedDates = [...new Set(histories.flatMap((h) => h.data.map((d) => dayjs(d.date).format('YYYY-MM-DD'))))].sort();

    /** 기간 필터 적용 */
    if (selectedPeriod) {
      const periodOption = periodOptions.find((p) => p.value === selectedPeriod);
      if (periodOption) {
        const startDate = dayjs().subtract(periodOption.months, 'month');
        sortedDates = sortedDates.filter((date) => dayjs(date).isAfter(startDate) || dayjs(date).isSame(startDate, 'day'));
      }
    }

    let series;

    if (isOverlap) {
      series = histories.map((history) => {
        const stockData = history.data
          .map((d) => ({ date: dayjs(d.date).format('YYYY-MM-DD'), close: d.close }))
          .filter((d) => sortedDates.includes(d.date))
          .sort((a, b) => a.date.localeCompare(b.date));

        const percentageMap = new Map<string, number>();

        if (stockData.length > 0) {
          const basePrice = stockData[0].close; // Use the price of the first available date in the filtered period as the base
          if (basePrice === 0) {
            stockData.forEach((dataPoint) => percentageMap.set(dataPoint.date, 0));
          } else {
            stockData.forEach((dataPoint) => {
              const currentPrice = dataPoint.close;
              const cumulativeChange = ((currentPrice - basePrice) / basePrice) * 100;
              percentageMap.set(dataPoint.date, cumulativeChange);
            });
          }
        }

        const seriesData = sortedDates.map((date) => {
          const percentage = percentageMap.get(date);
          return percentage === undefined ? null : percentage;
        });

        return {
          name: history.symbol,
          type: 'line',
          data: seriesData,
          smooth: true,
        };
      });
    } else {
      series = histories.map((history) => {
        const stock = stocks.find((s) => s.ticker === history.symbol);
        const dataMap = new Map(
          history.data.map((d) => [dayjs(d.date).format('YYYY-MM-DD'), d.close]),
        );

        const seriesData = sortedDates.map((date) => {
          const price = dataMap.get(date);
          if (!price) {
            return null;
          }

          return stock ? convertToKRW(price, stock.currency, exchangeRates) : price;
        });

        return {
          name: history.symbol,
          type: 'line',
          data: seriesData,
          smooth: true,
        };
      });
    }

    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: isDark ? '#d1d5db' : '#374151',
      },
      title: {
        text: isOverlap ? '종목별 누적 등락률 비교' : '전체 포트폴리오 주가 추이',
        left: 'center',
        top: '10px',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#111827',
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#111827',
        },
        formatter(params: any) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            if (param.value != null) {
              const ticker = param.seriesName.match(/\[(.*?)\]/)?.[1] || param.seriesName;
              result += isOverlap ? `${param.marker}${ticker}: ${param.value.toFixed(2)}%<br/>` : `${param.marker}${ticker}: ${param.value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW<br/>`;
            }
          });
          return result;
        },
      },
      legend: {
        data: histories.map((h) => h.symbol),
        top: '45px',
        textStyle: {
          color: isDark ? '#d1d5db' : '#374151',
        },
      },
      dataZoom: [{ show: true }],
      xAxis: {
        type: 'category',
        data: sortedDates.map((d) => dayjs(d).format('YYYY.MM.DD')),
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#e5e7eb',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: isOverlap ? '누적 등락률 (%)' : '가격 (KRW)',
        scale: true,
        nameTextStyle: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          formatter: isOverlap ? '{value}%' : '{value}',
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#e5e7eb',
          },
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6',
          },
        },
      },
      series,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '100px',
        containLabel: true,
      },
    };
  }, [
    histories, stocks, exchangeRates, selectedPeriod, isDark, isOverlap,
  ]);

  return (
    <div className="bg-card border rounded-lg p-4">
      {/* 기간 선택 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          className={selectedPeriod == null ? 'bg-blue-600 hover:bg-blue-700' : ''}
          onClick={() => setSelectedPeriod(null)}
          size="sm"
          variant={selectedPeriod == null ? 'default' : 'outline'}
        >
          전체
        </Button>
        {periodOptions.map((option) => (
          <Button
            className={selectedPeriod === option.value ? 'bg-blue-600 hover:bg-blue-700' : ''}
            key={option.value}
            onClick={() => setSelectedPeriod(option.value)}
            size="sm"
            variant={selectedPeriod === option.value ? 'default' : 'outline'}
          >
            {option.label}
          </Button>
        ))}
        <Button
          onClick={() => {
            setOverlap((state) => !state);
          }}
          size="sm"
          variant={isOverlap ? 'default' : 'outline'}
        >
          %
        </Button>
      </div>
      <ReactECharts lazyUpdate notMerge={false} option={combinedChartOption} style={{ height: '400px' }} />
    </div>
  );
}
