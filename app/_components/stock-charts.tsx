'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { memo, useMemo } from 'react';

import type { Stock } from '@/types';

interface StockChartsProps {
  stocks: Stock[];
  totalInvestment: number;
  exchangeRate: number;
}

interface HistoryData {
  symbol: string;
  data: {
    date: Date;
    close: number;
  }[];
}

const StockCharts = ({ stocks, totalInvestment, exchangeRate }: StockChartsProps) => {
  /** ticker만 추출하여 메모이제이션 (ratio, price 등 변경 시 재fetch 방지) */
  const tickers = useMemo(() => stocks.map((s) => s.ticker).filter(Boolean).join(','), [stocks]);

  /** 주식 히스토리 데이터 조회 */
  const { data: histories = [], isLoading } = useQuery({
    queryKey: ['stockHistories', tickers],
    async queryFn() {
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

  /** 전체 주가 데이터의 날짜를 정렬하여 메모이제이션 */
  const sortedDates = useMemo(() => [...new Set(histories.flatMap((h) => h.data.map((d) => dayjs(d.date).format('YYYY-MM-DD'))))].sort(), [histories]);

  /** 1. 통합 포트폴리오 차트 (모든 종목 합산) */
  const combinedChartOption = useMemo(() => {
    if (histories.length === 0) {
      return null;
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
        return stock?.currency === 'USD' ? price * exchangeRate : price;
      });

      return {
        name: `[${history.symbol}] ${stock?.name || history.symbol}`,
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
            if (param.value !== null) {
              // seriesName에서 [티커] 부분만 추출
              const ticker = param.seriesName.match(/\[(.*?)\]/)?.[1] || param.seriesName;
              result += `${param.marker}${ticker}: ${param.value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW<br/>`;
            }
          });
          return result;
        },
      },
      legend: {
        data: histories.map((h) => {
          const stock = stocks.find((s) => s.ticker === h.symbol);
          return `[${h.symbol}] ${stock?.name || h.symbol}`;
        }),
        top: '45px',
      },
      xAxis: {
        type: 'category',
        data: sortedDates.map((d) => dayjs(d).format('M/D')),
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
  }, [histories, sortedDates, stocks, exchangeRate]);

  /** 2. 수익금 차트 (매수일 기준) */
  const profitChartOption = useMemo(() => {
    if (histories.length === 0) {
      return null;
    }

    /** 매수일이 있는 종목만 필터링 */
    const stocksWithPurchaseDate = stocks.filter((s) => s.purchaseDate);

    /** 매수일이 없으면 차트를 표시하지 않음 */
    if (stocksWithPurchaseDate.length === 0) {
      return null;
    }

    /** 각 날짜의 총 포트폴리오 수익 계산 */
    const profits = sortedDates.map((date) => {
      let totalProfit = 0;
      const currentDate = dayjs(date);

      stocks.forEach((stock) => {
        /** 매수일이 없으면 해당 종목은 제외 */
        if (!stock.purchaseDate) {
          return;
        }

        const purchaseDate = dayjs(stock.purchaseDate);

        /** 현재 날짜가 매수일 이전이면 수익은 0 */
        if (currentDate.isBefore(purchaseDate, 'day')) {
          return;
        }

        const history = histories.find((h) => h.symbol === stock.ticker);
        if (!history) {
          return;
        }

        /** 매수일의 가격 찾기 */
        const purchaseDateStr = purchaseDate.format('YYYY-MM-DD');
        const purchaseDataPoint = history.data.find(
          (d) => dayjs(d.date).format('YYYY-MM-DD') >= purchaseDateStr,
        );
        if (!purchaseDataPoint) {
          return;
        }

        /** 현재 날짜의 가격 찾기 */
        const currentDataPoint = history.data.find(
          (d) => dayjs(d.date).format('YYYY-MM-DD') === date,
        );
        if (!currentDataPoint) {
          return;
        }

        /** 매수가 (KRW 기준) */
        const purchasePriceInKRW = stock.currency === 'USD' ? purchaseDataPoint.close * exchangeRate : purchaseDataPoint.close;

        /** 현재가 (KRW 기준) */
        const currentPriceInKRW = stock.currency === 'USD' ? currentDataPoint.close * exchangeRate : currentDataPoint.close;

        const investmentAmount = (totalInvestment * stock.ratio) / 100;
        const shares = investmentAmount / purchasePriceInKRW;

        /** 수익 = (현재가 - 매수가) × 보유 수량 */
        const profit = (currentPriceInKRW - purchasePriceInKRW) * shares;
        totalProfit += profit;
      });

      return totalProfit;
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
          const param = params[0];
          const value = param.value;
          const color = value >= 0 ? '#16a34a' : '#dc2626';
          return `${param.axisValue}<br/>${param.marker}<span style="color:${color}">수익: ${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: sortedDates.map((d) => dayjs(d).format('M/D')),
      },
      yAxis: {
        type: 'value',
        name: '수익금 (KRW)',
      },
      series: [
        {
          name: '수익금',
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
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '60px',
        containLabel: true,
      },
    };
  }, [
    histories, sortedDates, stocks, totalInvestment, exchangeRate,
  ]);

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
