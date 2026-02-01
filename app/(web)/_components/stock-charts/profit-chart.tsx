import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import { convertToKRW, DIVIDEND_TAX_RATE } from '@/lib/utils';

import type { HistoryData, StockChartsProps } from '.';

export interface ProfitChartProps extends StockChartsProps {
  isDark: boolean;
  histories: HistoryData[];
}

/** 수익금 차트 (매수일 기준) */
export default function ProfitChart({ isDark, histories, stocks, totalInvestment, exchangeRates }: ProfitChartProps) {
  const profitChartOption = useMemo(() => {
    const stockInfoList = stocks
      .filter((s) => {
        if (!s.purchaseDate) {
          return false;
        }

        const history = histories.find((h) => h.symbol === s.ticker);
        if (!history) {
          return false;
        }

        const purchaseDataPoint = history.data.find((d) => dayjs(d.date).isAfter(s.purchaseDate, 'day'));
        if (!purchaseDataPoint) {
          return false;
        }

        return true;
      })
      .map((stock) => {
        const history = histories.find((h) => h.symbol === stock.ticker)!;

        const purchaseDate = stock.purchaseDate!;

        // 날짜별 가격을 Map으로 변환 (O(1) 조회)
        const priceMap = new Map(
          history.data.map((d) => [dayjs(d.date).format('YYYY-MM-DD'), d.close]),
        );

        // 매수일 이후의 첫 가격 찾기
        const purchaseDataPoint = history.data.find((d) => dayjs(d.date).isAfter(purchaseDate, 'day'))!;

        const purchasePriceInKRW = convertToKRW(purchaseDataPoint.close, stock.currency, exchangeRates);
        const investmentAmount = (totalInvestment * stock.ratio) / 100;
        const shares = investmentAmount / purchasePriceInKRW;

        return {
          stock,
          purchaseDate,
          purchasePriceInKRW,
          shares,
          priceMap,
        };
      });
    if (stockInfoList.length === 0) {
      return null;
    }

    /** 매매차익 로직 */
    const profitMap = new Map<string, number>();
    stockInfoList
      .flatMap(({ stock: { currency }, shares, purchaseDate, purchasePriceInKRW, priceMap }) => {
        return priceMap
          .entries()
        /** 매수일 이후의 데이터만 필터링 */
          .filter(([date]) => dayjs(date).isSame(purchaseDate, 'day') || dayjs(date).isAfter(purchaseDate, 'day'))
          .map(([date, p]) => {
            const price = convertToKRW(p, currency, exchangeRates);
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
    stockInfoList.forEach((stockInfo) => {
      const { stock, purchaseDate, shares } = stockInfo;
      const history = histories.find((h) => h.symbol === stock.ticker);
      if (!history) {
        return;
      }

      const dividendMap = new Map<string, number>();

      if (history.dividends && history.dividends.length > 0) {
        history.dividends
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
            const dividendPerShare = convertToKRW(div.amount, stock.currency, exchangeRates);
            const afterTaxDividend = dividendPerShare * shares * (1 - DIVIDEND_TAX_RATE);

            dividendMap.set(dateStr, afterTaxDividend);
          });
      }

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
      backgroundColor: 'transparent',
      textStyle: {
        color: isDark ? '#d1d5db' : '#374151',
      },
      title: {
        text: '누적 수익금',
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
            const value = param.value;
            const color = value >= 0 ? '#16a34a' : '#dc2626';
            result += `${param.marker}<span style="color:${color}">${param.seriesName}: ${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW</span><br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['평가 수익', '월별 배당 수익', '누적 수익'],
        top: '45px',
        textStyle: {
          color: isDark ? '#d1d5db' : '#374151',
        },
      },
      dataZoom: [{ show: true }],
      xAxis: {
        type: 'category',
        data: dates,
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
        name: '수익금 (KRW)',
        nameTextStyle: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
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
      series: [
        {
          name: '평가 수익',
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
          name: '누적 수익',
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
        bottom: '15%',
        top: '100px',
        containLabel: true,
      },
    };
  }, [
    histories, stocks, totalInvestment, exchangeRates, isDark,
  ]);

  return (
    <div className="bg-card border rounded-lg p-4">
      <ReactECharts lazyUpdate notMerge={false} option={profitChartOption} style={{ height: '400px' }} />
    </div>
  );
}
