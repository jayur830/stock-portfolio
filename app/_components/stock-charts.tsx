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

/** 종목별 매수 정보 */
interface StockPurchaseInfo {
  stock: Stock; // 원본 종목 정보
  purchaseDate: dayjs.Dayjs;
  purchasePriceInKRW: number;
  shares: number;
  priceMap: Map<string, number>;
  dividendPerShare: number; // 주당 배당금 (KRW)
  dividendMonths: number[]; // 배당 지급 월
}

/** 헬퍼 함수: 종목별 매수 정보 및 가격 맵 생성 */
const buildStockPurchaseInfo = (
  stocks: Stock[],
  histories: HistoryData[],
  exchangeRate: number,
  totalInvestment: number,
): StockPurchaseInfo[] => {
  return stocks
    .filter((s) => s.purchaseDate)
    .map((stock) => {
      const history = histories.find((h) => h.symbol === stock.ticker);
      if (!history) return null;

      const purchaseDate = dayjs(stock.purchaseDate);
      const purchaseDateStr = purchaseDate.format('YYYY-MM-DD');

      // 날짜별 가격을 Map으로 변환 (O(1) 조회)
      const priceMap = new Map(
        history.data.map((d) => [dayjs(d.date).format('YYYY-MM-DD'), d.close]),
      );

      // 매수일 이후의 첫 가격 찾기
      const purchaseDataPoint = history.data.find((d) => dayjs(d.date).format('YYYY-MM-DD') >= purchaseDateStr);
      if (!purchaseDataPoint) {
        return null;
      }

      const purchasePriceInKRW = stock.currency === 'USD' ? purchaseDataPoint.close * exchangeRate : purchaseDataPoint.close;
      const investmentAmount = (totalInvestment * stock.ratio) / 100;
      const shares = investmentAmount / purchasePriceInKRW;

      // 배당금을 KRW로 환산
      const dividendPerShare = stock.dividendCurrency === 'USD' ? stock.dividend * exchangeRate : stock.dividend;

      return {
        stock,
        purchaseDate,
        purchasePriceInKRW,
        shares,
        priceMap,
        dividendPerShare,
        dividendMonths: stock.dividendMonths || [],
      };
    })
    .filter((info): info is StockPurchaseInfo => info !== null);
};

const StockCharts = ({ stocks, totalInvestment, exchangeRate }: StockChartsProps) => {
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

    const sortedDates = [...new Set(histories.flatMap((h) => h.data.map((d) => dayjs(d.date).format('YYYY-MM-DD'))))].sort();

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
  }, [histories, stocks, exchangeRate]);

  /** 2. 수익금 차트 (매수일 기준) */
  const profitChartOption = useMemo(() => {
    if (histories.length === 0) {
      return null;
    }

    const stockInfos = buildStockPurchaseInfo(stocks, histories, exchangeRate, totalInvestment);
    if (stockInfos.length === 0) {
      return null;
    }

    // 첫 매수일 찾기
    const firstPurchaseDate = stockInfos.reduce(
      (min, info) => (info.purchaseDate.isBefore(min) ? info.purchaseDate : min),
      dayjs('9999-12-31'),
    );

    // 모든 날짜 추출 및 정렬
    const allDates = histories.flatMap((h) => h.data.map((d) => dayjs(d.date).format('YYYY-MM-DD')));
    const dates = [...new Set(allDates)]
      .sort()
      .filter((dateStr) => dateStr >= firstPurchaseDate.format('YYYY-MM-DD'))
      .map((dateStr) => dayjs(dateStr));

    const filteredStockInfoList = stockInfos.filter(({ purchaseDate }) => purchaseDate);

    /** 매매차익 로직 */
    const profitMap = new Map<string, number>();
    filteredStockInfoList
      .flatMap(({ stock: { currency }, shares, purchaseDate, priceMap }) => {
        let purchasePrice = priceMap.get(purchaseDate.format('YYYY-MM-DD'))!;
        purchasePrice = currency === 'USD' ? purchasePrice * exchangeRate : purchasePrice;
        return priceMap
          .entries()
          /** 매수일 이후의 데이터만 필터링 */
          .filter(([date]) => dayjs(date).isSame(purchaseDate) || dayjs(date).isAfter(purchaseDate))
          .map(([date, p]) => {
            const price = currency === 'USD' ? p * exchangeRate : p;
            return {
              date,
              /** (가격 - 매수일 가격) * 보유수량 */
              price: (price - purchasePrice) * shares,
            };
          })
          .toArray();
      })
      .forEach(({ date, price }) => {
        if (profitMap.has(date)) {
          profitMap.set(date, profitMap.get(date)! + price);
        } else {
          profitMap.set(date, price);
        }
      });
    const profits = profitMap.entries().map(([, price]) => price).toArray();

    return {
      title: {
        text: '누적 수익금',
        left: 'center',
        top: '10px',
      },
      tooltip: {
        trigger: 'axis',
        formatter(params: any) {
          let str = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            str += `${param.marker}<span>${param.seriesName}: ${param.value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW</span><br/>`;
          });
          return str;
        },
      },
      xAxis: {
        type: 'category',
        data: dates.map((d) => d.format('YYYY.MM.DD')),
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
        // {
        //   name: '매매차익 + 배당',
        //   type: 'line',
        //   data: profitsWithDividends,
        //   smooth: true,
        //   areaStyle: {
        //     color: {
        //       type: 'linear',
        //       x: 0,
        //       y: 0,
        //       x2: 0,
        //       y2: 1,
        //       colorStops: [
        //         {
        //           offset: 0,
        //           color: 'rgba(255, 165, 0, 0.3)',
        //         },
        //         {
        //           offset: 1,
        //           color: 'rgba(255, 165, 0, 0.05)',
        //         },
        //       ],
        //     },
        //   },
        //   lineStyle: {
        //     width: 2,
        //     color: '#ff6b6b',
        //   },
        //   itemStyle: {
        //     color: '#ff6b6b',
        //   },
        // },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '60px',
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
