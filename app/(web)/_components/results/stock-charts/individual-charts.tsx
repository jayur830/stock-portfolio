'use client';

import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { convertCurrency, convertToKRW, DIVIDEND_TAX_RATE, FOREIGN_TAX_RATES } from '@/lib/utils';
import type { Stock } from '@/types';

import type { HistoryData } from '.';

interface IndividualChartsProps {
  stocks: Stock[];
  histories: HistoryData[];
  exchangeRates: { [key: string]: number };
  currency: string;
  isDark: boolean;
  totalInvestment: number;
}

export default function IndividualCharts({
  stocks,
  histories,
  exchangeRates,
  currency,
  isDark,
  totalInvestment,
}: IndividualChartsProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>(stocks[0]?.ticker || '');

  const chartOptions = useMemo(() => {
    const stock = stocks.find((s) => s.ticker === selectedTicker);
    const history = histories.find((h) => h.symbol === selectedTicker);

    if (!stock || !history || !stock.purchaseDate) return null;

    const purchaseDate = dayjs(stock.purchaseDate);
    const filteredData = history.data
      .filter((d) => dayjs(d.date).isAfter(purchaseDate, 'day') || dayjs(d.date).isSame(purchaseDate, 'day'))
      .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());

    if (filteredData.length === 0) return null;

    const dates = filteredData.map((d) => dayjs(d.date).format('YYYY.MM.DD'));

    // 기본 정보 계산 (매수일 기준 첫 거래일 데이터)
    const investmentAmount = (totalInvestment * stock.ratio) / 100;
    const purchaseDataPoint = filteredData[0];

    if (!purchaseDataPoint) return null;

    const purchasePriceInKRW = convertToKRW(purchaseDataPoint.close, stock.currency, exchangeRates);
    const initialShares = investmentAmount / purchasePriceInKRW;

    // 1. 주가 차트 (선택한 통화 기준)
    const priceData = filteredData.map((d) => convertCurrency(d.close, stock.currency, currency, exchangeRates));

    // 2. 월별 배당 및 배당 재투자 계산
    const taxRate = FOREIGN_TAX_RATES[stock.currency] ?? DIVIDEND_TAX_RATE;
    const sortedDividends = (history.dividends || [])
      .filter((d) => dayjs(d.date).isSame(purchaseDate, 'day') || dayjs(d.date).isAfter(purchaseDate, 'day'))
      .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());

    // 3. 누적 평가 수익(시세차익) 및 배당 재투자 평가 수익 계산
    let reinvestShares = initialShares;
    let divIndex = 0;

    const profitData: number[] = [];
    const reinvestData: number[] = [];
    const monthlyDivSumMap = new Map<string, number>();

    filteredData.forEach((d) => {
      const currentDate = dayjs(d.date);
      const currentPriceInKRW = convertToKRW(d.close, stock.currency, exchangeRates);

      // 현재 날짜(currentDate) 이전에 발생한 모든 미처리 배당금 처리
      while (divIndex < sortedDividends.length) {
        const div = sortedDividends[divIndex];
        const divDate = dayjs(div.date);

        // 배당일이 현재 주가 날짜보다 미래라면 중단 (아직 지급 안 됨)
        if (divDate.isAfter(currentDate, 'day')) {
          break;
        }

        // 배당금 계산 (세후)
        const divAmountInKRW = convertToKRW(div.amount, stock.currency, exchangeRates);

        // 월별 배당금 합계용 (초기 보유량 기준 세후 배당금)
        const divAmtNormal = divAmountInKRW * initialShares * (1 - taxRate);
        const monthStr = divDate.format('YYYY.MM');
        monthlyDivSumMap.set(monthStr, (monthlyDivSumMap.get(monthStr) || 0) + divAmtNormal);

        // 재투자 모드: 당시 보유량(reinvestShares) 기준으로 발생한 세후 배당금 -> 현재 주가로 주식 재매수
        const divAmtReinvest = divAmountInKRW * reinvestShares * (1 - taxRate);
        const additionalShares = currentPriceInKRW > 0 ? divAmtReinvest / currentPriceInKRW : 0;
        reinvestShares += additionalShares;

        divIndex++;
      }

      // 1) 일반 누적 평가수익 (현재 평가금액 - 투자원금) : 순수 주가 변동에 따른 평가수익
      const normalProfit = (currentPriceInKRW * initialShares) - investmentAmount;
      profitData.push(convertCurrency(normalProfit, 'KRW', currency, exchangeRates));

      // 2) 배당 재투자 수익 (재투자 후 평가금액 - 투자원금) : 늘어난 주식 수 기반 평가수익
      const reinvestProfit = (currentPriceInKRW * reinvestShares) - investmentAmount;
      reinvestData.push(convertCurrency(reinvestProfit, 'KRW', currency, exchangeRates));
    });

    // 배당 차트 전용 월별 데이터 구성
    const monthlyLabels = [...new Set(filteredData.map((d) => dayjs(d.date).format('YYYY.MM')))].sort();
    const monthlyDivChartData = monthlyLabels.map((m) => convertCurrency(monthlyDivSumMap.get(m) || 0, 'KRW', currency, exchangeRates));

    const commonOption = {
      backgroundColor: 'transparent',
      textStyle: { color: isDark ? '#d1d5db' : '#374151' },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: { color: isDark ? '#e5e7eb' : '#111827' },
        formatter(params: any) {
          const param = Array.isArray(params) ? params[0] : params;
          const value = param.value;
          const formattedValue = currency === 'KRW' ? Math.round(value).toLocaleString('ko-KR') : value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return `${param.name}<br />${param.marker}${param.seriesName}: ${formattedValue} ${currency}`;
        },
      },
      dataZoom: [{ show: true, height: 30, bottom: 0 }],
      grid: { left: '2%', right: '2%', bottom: 40, top: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { color: isDark ? '#9ca3af' : '#6b7280' },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: isDark ? '#9ca3af' : '#6b7280' },
        splitLine: { lineStyle: { color: isDark ? '#374151' : '#f3f4f6' } },
      },
    };

    return {
      price: {
        ...commonOption,
        title: { text: '주가 추이', left: 'center', textStyle: { fontSize: 18, color: isDark ? '#e5e7eb' : '#111827' } },
        series: [{ name: '주가', type: 'line', data: priceData, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#3b82f6' } }],
      },
      dividend: {
        ...commonOption,
        xAxis: {
          ...commonOption.xAxis,
          data: monthlyLabels,
        },
        title: { text: '월별 배당금', left: 'center', textStyle: { fontSize: 18, color: isDark ? '#e5e7eb' : '#111827' } },
        series: [{ name: '배당금', type: 'bar', data: monthlyDivChartData, itemStyle: { color: '#f59e0b' } }],
      },
      profit: {
        ...commonOption,
        tooltip: {
          ...commonOption.tooltip,
          formatter: (params: any) => {
            if (Array.isArray(params)) {
              const name = params[0].name;
              const content = params
                .map(({ value, marker, seriesName }) => {
                  const formattedValue = currency === 'KRW' ? Math.round(value).toLocaleString('ko-KR') : value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return `${marker}${seriesName}: ${formattedValue} ${currency}`;
                })
                .join('<br />');
              return `${name}<br />${content}`;
            }

            const param = Array.isArray(params) ? params[0] : params;
            const value = param.value;
            const formattedValue = currency === 'KRW' ? Math.round(value).toLocaleString('ko-KR') : value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `${param.name}<br />${param.marker}${param.seriesName}: ${formattedValue} ${currency}`;
          },
        },
        grid: {
          ...commonOption.grid,
          top: 100,
        },
        title: { text: '누적 수익 vs 재투자 수익', left: 'center', textStyle: { fontSize: 18, color: isDark ? '#e5e7eb' : '#111827' } },
        legend: { data: ['누적 수익', '배당 재투자 수익'], top: 50, textStyle: { color: isDark ? '#d1d5db' : '#374151' } },
        series: [
          { name: '누적 수익', type: 'line', data: profitData, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#16a34a' } },
          { name: '배당 재투자 수익', type: 'line', data: reinvestData, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#8b5cf6' } },
        ],
      },
    };
  }, [
    selectedTicker, stocks, histories, exchangeRates, currency, isDark, totalInvestment,
  ]);

  return (
    <div className="individual-chart-stack">
      <div className="individual-chart-selector">
        <Select onValueChange={setSelectedTicker} value={selectedTicker}>
          <SelectTrigger className="individual-chart-select">
            <SelectValue placeholder="종목 선택" />
          </SelectTrigger>
          <SelectContent>
            {stocks.filter((s) => s.ticker).map((s) => (
              <SelectItem key={s.ticker} value={s.ticker}>
                {s.ticker}: {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!chartOptions ? (
        <div className="chart-empty-state">
          매수일 정보가 없거나 데이터를 불러올 수 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="chart-card">
            <div className="chart-viewport">
              <ReactECharts option={chartOptions.price} style={{ height: '300px', width: '100%' }} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-viewport">
              <ReactECharts option={chartOptions.dividend} style={{ height: '300px', width: '100%' }} />
            </div>
          </div>
          <div className="chart-card md:col-span-2">
            <div className="chart-viewport">
              <ReactECharts option={chartOptions.profit} style={{ height: '400px', width: '100%' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
