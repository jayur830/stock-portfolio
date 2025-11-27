'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { memo, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { convertToKRW, DIVIDEND_TAX_RATE } from '@/lib/utils';
import type { Stock } from '@/types';

interface StockChartsProps {
  stocks: Stock[];
  totalInvestment: number;
  exchangeRate: number;
}

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y';

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  months: number;
}

interface HistoryData {
  symbol: string;
  data: {
    date: Date;
    close: number;
  }[];
  dividends: {
    date: Date;
    amount: number;
  }[];
}

/** 종목별 매수 정보 */
interface StockPurchaseInfo {
  stock: Stock;
  purchaseDate: dayjs.Dayjs;
  purchasePriceInKRW: number;
  shares: number;
  priceMap: Map<string, number>;
}

/** 배당금 계산 (실제 배당 히스토리 기반, 세후, 매수월 제외) */
const calculateDividendPayments = (
  stockInfo: StockPurchaseInfo,
  dividendHistory: {
    date: Date;
    amount: number;
  }[],
  exchangeRate: number,
): Map<string, number> => {
  const { stock, purchaseDate, shares } = stockInfo;
  const dividendMap = new Map<string, number>();

  if (!dividendHistory || dividendHistory.length === 0) {
    return dividendMap;
  }

  dividendHistory
    .filter(({ date }) => dayjs(date).isAfter(purchaseDate, 'day') || dayjs(date).isSame(purchaseDate, 'day'))
    .forEach((div) => {
      const divDate = dayjs(div.date);
      const dateStr = divDate.format('YYYY-MM-DD');

      // 매수월에는 배당을 받지 못하여 0원 처리
      if (divDate.format('YYYY-MM') === purchaseDate.format('YYYY-MM')) {
        dividendMap.set(dateStr, 0);
        return;
      }

      // 실제 배당금 계산: (주당 배당금 * 보유 수량) * (1 - 세율)
      // USD 종목이면 KRW로 환산
      const dividendPerShare = convertToKRW(div.amount, stock.currency, exchangeRate);
      const afterTaxDividend = dividendPerShare * shares * (1 - DIVIDEND_TAX_RATE);

      dividendMap.set(dateStr, afterTaxDividend);
    });

  return dividendMap;
};

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

const StockCharts = ({ stocks, totalInvestment, exchangeRate }: StockChartsProps) => {
  /** 기간 필터 상태 */
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>('1Y');

  /** ticker만 추출하여 메모이제이션 (ratio, price 등 변경 시 재fetch 방지) */
  const tickers = useMemo(() => stocks.map((s) => s.ticker).filter(Boolean).join(','), [stocks]);

  /** 주식 히스토리 데이터 조회 */
  const { data: histories = [], isLoading } = useQuery({
    queryKey: ['stockHistories', tickers] as const,
    async queryFn({ queryKey: [, tickers] }) {
      const symbols = tickers.split(',');
      const response = await fetch('/api/stock/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stock histories');
      }

      const data = await response.json();
      return (data.histories || []) as HistoryData[];
    },
    enabled: !!tickers, // tickers가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분
  });

  /** 1. 통합 포트폴리오 차트 (모든 종목 합산) */
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

    /** 각 종목의 series 생성 */
    const series = histories.map((history) => {
      const stock = stocks.find((s) => s.ticker === history.symbol);
      const dataMap = new Map(
        history.data.map((d) => [dayjs(d.date).format('YYYY-MM-DD'), d.close]),
      );

      const seriesData = sortedDates.map((date) => {
        const price = dataMap.get(date);
        if (!price) {
          return null;
        }

        /** USD 종목이면 KRW로 환산 */
        return stock ? convertToKRW(price, stock.currency, exchangeRate) : price;
      });

      return {
        name: history.symbol,
        type: 'line',
        data: seriesData,
        smooth: true,
      };
    });

    return {
      title: {
        text: '전체 포트폴리오 주가 추이',
        left: 'center',
        top: '10px',
      },
      tooltip: {
        trigger: 'axis',
        formatter(params: any) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            if (param.value != null) {
              // seriesName에서 [티커] 부분만 추출
              const ticker = param.seriesName.match(/\[(.*?)\]/)?.[1] || param.seriesName;
              result += `${param.marker}${ticker}: ${param.value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW<br/>`;
            }
          });
          return result;
        },
      },
      legend: {
        data: histories.map((h) => h.symbol),
        top: '45px',
      },
      xAxis: {
        type: 'category',
        data: sortedDates.map((d) => dayjs(d).format('YYYY.MM.DD')),
      },
      yAxis: {
        type: 'value',
        name: '가격 (KRW)',
        scale: true,
      },
      series,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '100px',
        containLabel: true,
      },
    };
  }, [histories, stocks, exchangeRate, selectedPeriod]);

  /** 2. 수익금 차트 (매수일 기준) */
  const profitChartOption = useMemo(() => {
    if (histories.length === 0) {
      return null;
    }

    const stockInfos = stocks
      .filter((s) => s.purchaseDate)
      .map((stock) => {
        const history = histories.find((h) => h.symbol === stock.ticker);
        if (!history) {
          return null;
        }

        const purchaseDate = stock.purchaseDate!;

        // 날짜별 가격을 Map으로 변환 (O(1) 조회)
        const priceMap = new Map(
          history.data.map((d) => [dayjs(d.date).format('YYYY-MM-DD'), d.close]),
        );

        // 매수일 이후의 첫 가격 찾기
        const purchaseDataPoint = history.data.find((d) => dayjs(d.date).isAfter(purchaseDate, 'day'));
        if (!purchaseDataPoint) {
          return null;
        }

        const purchasePriceInKRW = convertToKRW(purchaseDataPoint.close, stock.currency, exchangeRate);
        const investmentAmount = (totalInvestment * stock.ratio) / 100;
        const shares = investmentAmount / purchasePriceInKRW;

        return {
          stock,
          purchaseDate,
          purchasePriceInKRW,
          shares,
          priceMap,
        };
      })
      .filter((info): info is StockPurchaseInfo => info != null);
    if (stockInfos.length === 0) {
      return null;
    }

    /** 매매차익 로직 */
    const profitMap = new Map<string, number>();
    stockInfos
      .flatMap(({ stock: { currency }, shares, purchaseDate, purchasePriceInKRW, priceMap }) => {
        return priceMap
          .entries()
          /** 매수일 이후의 데이터만 필터링 */
          .filter(([date]) => dayjs(date).isSame(purchaseDate, 'day') || dayjs(date).isAfter(purchaseDate, 'day'))
          .map(([date, p]) => {
            const price = convertToKRW(p, currency, exchangeRate);
            return {
              date,
              /** (가격 - 매수일 가격) * 보유수량 */
              price: (price - purchasePriceInKRW) * shares,
            };
          })
          .toArray();
      })
      .forEach(({ date, price }) => {
        profitMap.set(date, (profitMap.get(date) || 0) + price);
      });
    const profitList = profitMap.entries().toArray().sort((a, b) => (dayjs(a[0]).isBefore(b[0]) ? -1 : 1));
    /** 매매차익 차트 데이터 */
    const profits = profitList.map(([, price]) => price);
    /** xAxis 데이터 */
    const dates = profitList.map(([date]) => dayjs(date).format('YYYY.MM.DD'));

    // 배당금 누적 계산
    const totalDividendMap = new Map<string, number>();
    stockInfos.forEach((stockInfo) => {
      const history = histories.find((h) => h.symbol === stockInfo.stock.ticker);
      if (!history) {
        return;
      }

      const dividendMap = calculateDividendPayments(stockInfo, history.dividends, exchangeRate);

      // 날짜별로 배당금 누적
      dividendMap.forEach((amount, date) => {
        totalDividendMap.set(date, (totalDividendMap.get(date) || 0) + amount);
      });
    });

    // 누적 배당금 계산 (각 날짜까지의 배당금 합계)
    let cumulativeDividend = 0;
    const cumulativeDividendMap = new Map(
      totalDividendMap
        .entries()
        .toArray()
        .sort((a, b) => (dayjs(a[0]).isBefore(b[0]) ? -1 : 1))
        .map(([date, amount]) => {
          return [date, cumulativeDividend += amount];
        }),
    );

    let prevDate = cumulativeDividendMap.keys().toArray().sort()[0];
    /** 매매차익 + 배당 차트 데이터 */
    const profitsWithDividends = profitMap
      .entries()
      .toArray()
      .sort((a, b) => (dayjs(a[0]).isBefore(b[0]) ? -1 : 1))
      .map(([date, amount]) => {
        if (cumulativeDividendMap.has(date)) {
          prevDate = date;
          return amount + cumulativeDividendMap.get(date)!;
        }
        if (dayjs(date).isAfter(prevDate, 'day')) {
          return amount + cumulativeDividendMap.get(prevDate)!;
        }
        return amount;
      });

    prevDate = cumulativeDividendMap.keys().toArray().sort()[0];
    /** 월별 배당금 차트 데이터 */
    const dividends = profitMap
      .entries()
      .toArray()
      .sort((a, b) => (dayjs(a[0]).isBefore(b[0]) ? -1 : 1))
      .map(([date]) => {
        if (totalDividendMap.has(date)) {
          prevDate = date;
          return totalDividendMap.get(date)!;
        }
        if (dayjs(date).isAfter(prevDate, 'day')) {
          return totalDividendMap.get(prevDate)!;
        }
        return 0;
      });

    return {
      title: {
        text: '누적 수익금',
        left: 'center',
        top: '10px',
      },
      tooltip: {
        trigger: 'axis',
        formatter(params: any) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            const value = param.value;
            const color = value >= 0 ? '#16a34a' : '#dc2626';
            result += `${param.marker}<span style="color:${color}">${param.seriesName}: ${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW</span><br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['매매차익', '월별 배당 수익', '매매차익 + 배당 수익 누적'],
        top: '45px',
      },
      xAxis: {
        type: 'category',
        // data: dates.map((d) => d.format('YYYY.MM.DD')),
        data: dates,
      },
      yAxis: {
        type: 'value',
        name: '수익금 (KRW)',
      },
      series: [
        {
          name: '매매차익',
          type: 'line',
          data: profits,
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(34, 197, 94, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(34, 197, 94, 0.05)',
                },
              ],
            },
          },
          lineStyle: {
            width: 2,
            color: '#16a34a',
          },
          itemStyle: {
            color: '#16a34a',
          },
        },
        {
          name: '월별 배당 수익',
          type: 'line',
          data: dividends,
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(245, 158, 11, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(245, 158, 11, 0.05)',
                },
              ],
            },
          },
          lineStyle: {
            width: 2,
            color: '#f59e0b',
          },
          itemStyle: {
            color: '#f59e0b',
          },
        },
        {
          name: '매매차익 + 배당 수익 누적',
          type: 'line',
          data: profitsWithDividends,
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(59, 130, 246, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(59, 130, 246, 0.05)',
                },
              ],
            },
          },
          lineStyle: {
            width: 2,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '100px',
        containLabel: true,
      },
    };
  }, [histories, stocks, totalInvestment, exchangeRate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full" />
          <span className="text-sm text-gray-600">차트 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (histories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* 통합 포트폴리오 차트 */}
      {combinedChartOption && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
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
          </div>
          <ReactECharts lazyUpdate notMerge={false} option={combinedChartOption} style={{ height: '400px' }} />
        </div>
      )}

      {/* 누적 수익금 차트 */}
      {profitChartOption && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ReactECharts lazyUpdate notMerge={false} option={profitChartOption} style={{ height: '350px' }} />
        </div>
      )}
    </div>
  );
};

export default memo(StockCharts);
