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
import { convertCurrency, convertToKRW, DIVIDEND_TAX_RATE } from '@/lib/utils';
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

    const dates = filteredData.map((d) => dayjs(d.date).format('YYYY.MM.DD'));

    // 기본 정보 계산
    const investmentAmount = (totalInvestment * stock.ratio) / 100;
    const purchaseDataPoint = history.data.find((d) => dayjs(d.date).isAfter(purchaseDate, 'day')) || filteredData[0];
    const purchasePriceInKRW = convertToKRW(purchaseDataPoint.close, stock.currency, exchangeRates);
    const initialShares = investmentAmount / purchasePriceInKRW;

    // 1. 주가 차트 (선택한 통화 기준)
    const priceData = filteredData.map((d) => convertCurrency(d.close, stock.currency, currency, exchangeRates));

    // 2. 월별 배당 및 누적 배당 계산
    const dividendMap = new Map<string, number>();
    history.dividends?.forEach((div) => {
      const divDate = dayjs(div.date);
      if (divDate.isBefore(purchaseDate, 'day')) return;

      const dateStr = divDate.format('YYYY-MM-DD');
      const divAmountInKRW = convertToKRW(div.amount, stock.currency, exchangeRates);
      const afterTaxDiv = divAmountInKRW * initialShares * (1 - DIVIDEND_TAX_RATE);
      dividendMap.set(dateStr, afterTaxDiv);
    });

    // 3. 누적 수익 및 배당 재투자 계산
    let cumulativeDiv = 0;
    let reinvestShares = initialShares;

    const profitData: number[] = [];
    const reinvestData: number[] = [];
    const monthlyDivSumMap = new Map<string, number>();

    filteredData.forEach((d) => {
      const dateStr = dayjs(d.date).format('YYYY-MM-DD');
      const monthStr = dayjs(d.date).format('YYYY.MM');
      const currentPriceInKRW = convertToKRW(d.close, stock.currency, exchangeRates);

      // 배당 발생 시 처리
      if (dividendMap.has(dateStr)) {
        const divAmt = dividendMap.get(dateStr)!;
        cumulativeDiv += divAmt;

        // 월별 합계 저장
        monthlyDivSumMap.set(monthStr, (monthlyDivSumMap.get(monthStr) || 0) + divAmt);

        // 재투자: 세후 배당금으로 주식 추가 매수
        const additionalShares = divAmt / currentPriceInKRW;
        reinvestShares += additionalShares;
      }

      // 일반 누적 수익 (평가금액 + 누적배당)
      const normalValue = (currentPriceInKRW * initialShares) + cumulativeDiv;
      profitData.push(convertCurrency(normalValue - investmentAmount, 'KRW', currency, exchangeRates));

      // 재투자 수익
      const currentReinvestValue = currentPriceInKRW * reinvestShares;
      reinvestData.push(convertCurrency(currentReinvestValue - investmentAmount, 'KRW', currency, exchangeRates));
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
      },
      dataZoom: [{ show: true, height: 20, bottom: 0 }],
      grid: { left: '3%', right: '4%', bottom: '60px', top: '40px', containLabel: true },
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
        tooltip: {
          ...commonOption.tooltip,
          formatter: (params: any) => {
            const param = Array.isArray(params) ? params[0] : params;
            const value = param.value;
            const formattedValue = currency === 'KRW' ? Math.round(value).toLocaleString('ko-KR') : value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `${param.name}<br/>${param.marker}${param.seriesName}: ${formattedValue} ${currency}`;
          },
        },
        title: { text: '주가 추이', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#e5e7eb' : '#111827' } },
        series: [{ name: '주가', type: 'line', data: priceData, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#3b82f6' } }],
      },
      dividend: {
        ...commonOption,
        tooltip: {
          ...commonOption.tooltip,
          formatter: (params: any) => {
            const param = Array.isArray(params) ? params[0] : params;
            const value = param.value;
            const formattedValue = currency === 'KRW' ? Math.round(value).toLocaleString('ko-KR') : value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `${param.name}<br/>${param.marker}${param.seriesName}: ${formattedValue} ${currency}`;
          },
        },
        xAxis: {
          ...commonOption.xAxis,
          data: monthlyLabels,
        },
        title: { text: '월별 배당금', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#e5e7eb' : '#111827' } },
        series: [{ name: '배당금', type: 'bar', data: monthlyDivChartData, itemStyle: { color: '#f59e0b' } }],
      },
      profit: {
        ...commonOption,
        title: { text: '누적 수익 vs 재투자 수익', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#e5e7eb' : '#111827' } },
        legend: { data: ['일반 누적 수익', '배당 재투자 수익'], top: '25px', textStyle: { color: isDark ? '#d1d5db' : '#374151' } },
        series: [
          { name: '일반 누적 수익', type: 'line', data: profitData, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#16a34a' } },
          { name: '배당 재투자 수익', type: 'line', data: reinvestData, smooth: true, showSymbol: false, lineStyle: { width: 2, color: '#8b5cf6' } },
        ],
      },
    };
  }, [
    selectedTicker, stocks, histories, exchangeRates, currency, isDark, totalInvestment,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-start">
        <Select onValueChange={setSelectedTicker} value={selectedTicker}>
          <SelectTrigger className="w-[200px]">
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
        <div className="flex items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
          매수일 정보가 없거나 데이터를 불러올 수 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-lg p-4">
            <ReactECharts option={chartOptions.price} style={{ height: '300px' }} />
          </div>
          <div className="bg-card border rounded-lg p-4">
            <ReactECharts option={chartOptions.dividend} style={{ height: '300px' }} />
          </div>
          <div className="bg-card border rounded-lg p-4 md:col-span-2">
            <ReactECharts option={chartOptions.profit} style={{ height: '400px' }} />
          </div>
        </div>
      )}
    </div>
  );
}
