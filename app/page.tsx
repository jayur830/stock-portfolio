'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import StockCard from '@/app/_components/stock-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateDividendYield, calculateStockAnnualDividend, calculateStockMonthlyDividends, mergeMonthlyDividends } from '@/lib/utils';
import type { FormValues } from '@/types';

import MonthlyDividends from './_components/monthly-dividends';
import QuantityPerStock from './_components/quantity-per-stock';

const StockCharts = dynamic(() => import('@/app/_components/stock-charts'), {
  loading: () => <div className="flex justify-center items-center p-8 text-muted-foreground">차트 로딩 중...</div>,
  ssr: false,
});

export default function Page() {
  const { control, getValues, handleSubmit, register, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      totalInvestment: 0,
      targetAnnualDividend: 0,
      exchangeRate: 0,
      stocks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stocks',
  });

  /** 탭 상태 */
  const [activeTab, setActiveTab] = useState<'dividend' | 'investment'>('dividend');
  /** 비율 합 */
  const [totalRatio, setTotalRatio] = useState(0);

  // ratio 변경 시에만 totalRatio 업데이트
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.includes('ratio') || name === 'stocks') {
        const stocks = value.stocks || [];
        const sum = stocks.reduce((acc: number, stock: any) => acc + (stock?.ratio || 0), 0);
        setTotalRatio(sum);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);
  /** 연 배당금 */
  const [annualDividend, setAnnualDividend] = useState<number | null>(null);
  /** 필요한 투자금 */
  const [requiredInvestment, setRequiredInvestment] = useState<number | null>(null);
  /** 월별 배당금 */
  const [monthlyDividends, setMonthlyDividends] = useState<number[]>(Array(12).fill(0));
  /** 차트에 전달할 계산 시점의 값들 */
  const [chartData, setChartData] = useState<{
    totalInvestment: number;
    exchangeRate: number;
    stocks: any[];
  } | null>(null);

  /** 환율 조회 */
  const { data: exchangeRateData, isLoading: loadingExchangeRate, refetch: refetchExchangeRate } = useQuery({
    queryKey: ['exchangeRate'],
    async queryFn() {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) {
        throw new Error('환율 조회에 실패했습니다.');
      }
      const data = await response.json();
      return data.rates.KRW as number;
    },
    staleTime: 1000 * 60 * 60, // 1시간
  });

  /** 환율 데이터가 변경되면 폼에 반영 */
  useEffect(() => {
    if (exchangeRateData) {
      setValue('exchangeRate', exchangeRateData);
    }
  }, [exchangeRateData, setValue]);

  /** 환율 조회 버튼 핸들러 */
  const handleFetchExchangeRate = useCallback(async () => {
    const result = await refetchExchangeRate();
    if (result.data) {
      setValue('exchangeRate', result.data);
    }
  }, [refetchExchangeRate, setValue]);

  /** 폼 데이터 검증 */
  const validateFormData = (data: FormValues): string | null => {
    const currentTotalRatio = data.stocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
    if (Math.abs(currentTotalRatio - 100) > 0.1) {
      return '총 비율이 100%가 되어야 합니다.';
    }

    if (activeTab === 'dividend' && data.totalInvestment <= 0) {
      return '총 투자금을 입력해주세요.';
    }

    if (activeTab === 'investment' && data.targetAnnualDividend <= 0) {
      return '목표 연 배당금을 입력해주세요.';
    }

    /** 해외주식 여부 */
    const hasUsdStock = data.stocks.some((stock) => stock.currency === 'USD');
    /** 환율 조회 여부 */
    if (hasUsdStock && (!data.exchangeRate || data.exchangeRate <= 0)) {
      return 'USD 항목이 있습니다. 환율을 먼저 조회해주세요.';
    }

    return null;
  };

  /** 배당금 계산: 투자금 → 배당금 */
  const calculateDividendFromInvestment = useCallback((data: FormValues) => {
    const stockDividends = data.stocks.map((stock) => {
      /** 종목별 투자금 */
      const investmentAmount = (data.totalInvestment * stock.ratio) / 100;
      /** 종목별 연 배당금 */
      const annualDividend = calculateStockAnnualDividend(stock, investmentAmount, data.exchangeRate);
      /** 종목별 월별 배당금 */
      const monthlyDividends = calculateStockMonthlyDividends(stock, annualDividend);
      return {
        annualDividend,
        monthlyDividends,
      };
    });

    /** 종목별 연 배당금 합산 */
    const totalAnnualDividend = stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0);
    /** 종목별 월별 배당금 합산 */
    const monthlyDividendArray = mergeMonthlyDividends(stockDividends);

    setAnnualDividend(totalAnnualDividend);
    setMonthlyDividends(monthlyDividendArray);
    setRequiredInvestment(null);
    setChartData({
      totalInvestment: data.totalInvestment,
      exchangeRate: data.exchangeRate,
      stocks: data.stocks,
    });
  }, []);

  /** 투자금 계산: 목표 배당금 → 필요한 투자금 */
  const calculateInvestmentFromDividend = useCallback((data: FormValues) => {
    /** 각 종목별 비율에 따른 배당 수익률의 합 */
    const weightedDividendYield = data.stocks.reduce((sum, stock) => {
      const dividendYield = calculateDividendYield(stock, data.exchangeRate);
      return sum + dividendYield * (stock.ratio / 100);
    }, 0);
    /** 필요한 투자금 */
    const requiredInvestmentAmount = data.targetAnnualDividend / weightedDividendYield;

    const stockDividends = data.stocks.map((stock) => {
      const investmentAmount = (requiredInvestmentAmount * stock.ratio) / 100;
      const annualDividend = calculateStockAnnualDividend(stock, investmentAmount, data.exchangeRate);
      const monthlyDividends = calculateStockMonthlyDividends(stock, annualDividend);
      return { monthlyDividends };
    });

    const monthlyDividendArray = mergeMonthlyDividends(stockDividends);

    setRequiredInvestment(requiredInvestmentAmount);
    setMonthlyDividends(monthlyDividendArray);
    setAnnualDividend(null);
    setChartData({
      totalInvestment: requiredInvestmentAmount,
      exchangeRate: data.exchangeRate,
      stocks: data.stocks,
    });
  }, []);

  const handleAddStock = useCallback(() => {
    const newStock = {
      name: '',
      ticker: '',
      price: 0,
      currency: 'KRW' as const,
      dividend: 0,
      dividendCurrency: 'KRW' as const,
      dividendMonths: [],
      yield: 0,
      ratio: 0,
      purchaseDate: undefined,
      dividendInputType: 'amount' as const,
    };

    const currentStocks = getValues('stocks');
    const newList = [...currentStocks, newStock];

    // 모든 종목을 균등하게 재분배
    const equalRatio = 100 / newList.length;
    const redistributedList = newList.map((stock) => ({
      ...stock,
      ratio: equalRatio,
    }));

    // 기존 stocks의 ratio만 업데이트하고 새 종목 추가
    currentStocks.forEach((_, idx) => {
      setValue(`stocks.${idx}.ratio`, redistributedList[idx].ratio);
    });
    append(redistributedList[redistributedList.length - 1]);
  }, [getValues, setValue, append]);

  const handleReset = useCallback(() => {
    reset();
    setAnnualDividend(null);
    setRequiredInvestment(null);
    setMonthlyDividends(Array(12).fill(0));
    setChartData(null);
  }, [reset]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'dividend' | 'investment');
  }, []);

  const onSubmit = useCallback((data: FormValues) => {
    const error = validateFormData(data);
    if (error) {
      alert(error);
      return;
    }

    if (activeTab === 'dividend') {
      calculateDividendFromInvestment(data);
    } else {
      calculateInvestmentFromDividend(data);
    }
  }, [activeTab, calculateDividendFromInvestment, calculateInvestmentFromDividend]);

  return (
    <main aria-label="배당주 포트폴리오 계산기" className="flex flex-col gap-3.5 p-4 overflow-x-hidden">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Tabs className="flex-1 w-full" onValueChange={handleTabChange} value={activeTab}>
          <TabsList className="w-full">
            <TabsTrigger value="dividend">배당금 계산</TabsTrigger>
            <TabsTrigger value="investment">투자금 계산</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex w-full md:w-[200px] items-center gap-2">
          <Button
            disabled={loadingExchangeRate}
            onClick={handleFetchExchangeRate}
            size="sm"
            type="button"
            variant="outline"
          >
            {loadingExchangeRate ? '조회 중...' : '환율 조회'}
          </Button>
          <Input
            aria-label="환율"
            placeholder="환율"
            step="any"
            type="number"
            {...register('exchangeRate', { valueAsNumber: true })}
          />
        </div>
      </div>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg">
          {activeTab === 'dividend' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs md:text-sm font-medium whitespace-nowrap">총 투자금</label>
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    maxLength={24}
                    placeholder="총 투자금을 입력하세요"
                    step="any"
                    type="number"
                    {...register('totalInvestment', { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">원</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: '+10만',
                    value: 100000 },
                  { label: '+100만',
                    value: 1000000 },
                  { label: '+1000만',
                    value: 10000000 },
                  { label: '+1억',
                    value: 100000000 },
                  { label: '+10억',
                    value: 1000000000 },
                  { label: '+100억',
                    value: 10000000000 },
                ].map(({ label, value }) => (
                  <Button
                    className="h-7 text-xs"
                    key={label}
                    onClick={() => {
                      const current = getValues('totalInvestment') || 0;
                      setValue('totalInvestment', current + value);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </>
          )}
          {activeTab === 'investment' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs md:text-sm font-medium whitespace-nowrap">목표 연 배당금 (세전)</label>
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    maxLength={24}
                    placeholder="목표 연 배당금을 입력하세요"
                    step="any"
                    type="number"
                    {...register('targetAnnualDividend', { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">원</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: '+10만',
                    value: 100000 },
                  { label: '+100만',
                    value: 1000000 },
                  { label: '+1000만',
                    value: 10000000 },
                  { label: '+1억',
                    value: 100000000 },
                  { label: '+10억',
                    value: 1000000000 },
                  { label: '+100억',
                    value: 10000000000 },
                ].map(({ label, value }) => (
                  <Button
                    className="h-7 text-xs"
                    key={label}
                    onClick={() => {
                      const current = getValues('targetAnnualDividend') || 0;
                      setValue('targetAnnualDividend', current + value);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
        {fields.map((field, index) => (
          <StockCard
            control={control}
            getValues={getValues}
            index={index}
            key={field.id}
            onDelete={() => remove(index)}
            register={register}
            setValue={setValue}
          />
        ))}
        <Button
          aria-label="종목 추가"
          className="border-dashed"
          onClick={handleAddStock}
          type="button"
          variant="outline"
        >
          +
        </Button>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="text-muted-foreground">총 비율:</span>
            <span className={`font-semibold ${totalRatio === 100 ? 'text-green-600' : totalRatio > 100 ? 'text-red-600' : 'text-yellow-600'}`}>
              {totalRatio.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-center items-center gap-1">
            <Button disabled={Math.abs(totalRatio - 100) > 0.1} type="submit">
              계산
            </Button>
            <Button
              onClick={handleReset}
              type="button"
              variant="outline"
            >
              초기화
            </Button>
          </div>
          {annualDividend !== null && (
            <>
              <div aria-live="polite" className="flex md:flex-row flex-col justify-center items-center gap-4 p-2 md:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700">세전 연 배당금:</span>
                  <span className="text-lg font-bold text-green-700">
                    {annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </span>
                </div>
                <div className="hidden md:block h-6 w-px bg-green-300" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700">세후 연 배당금:</span>
                  <span className="text-lg font-bold text-green-700">
                    {(annualDividend * (1 - 0.154)).toLocaleString('ko-KR', {
                      maximumFractionDigits: 0,
                    })}원
                  </span>
                </div>
              </div>
              {chartData && chartData.stocks.length > 0 && (
                <div className="flex flex-col gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-900">종목별 보유 수량</h3>
                  <QuantityPerStock exchangeRate={chartData.exchangeRate} stocks={chartData.stocks} totalInvestment={chartData.totalInvestment} />
                </div>
              )}
              <div className="flex flex-col gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900">월별 배당금 (세후)</h3>
                <MonthlyDividends amounts={monthlyDividends} />
              </div>
            </>
          )}
          {requiredInvestment !== null && (
            <>
              <div aria-live="polite" className="flex justify-center items-center gap-4 p-2 md:p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-700">필요한 투자금:</span>
                  <span className="text-lg font-bold text-purple-700">
                    {requiredInvestment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </span>
                </div>
              </div>
              {chartData && chartData.stocks.length > 0 && (
                <div className="flex flex-col gap-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-900">종목별 보유 수량</h3>
                  <QuantityPerStock exchangeRate={chartData.exchangeRate} stocks={chartData.stocks} totalInvestment={chartData.totalInvestment} />
                </div>
              )}
              <div className="flex flex-col gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900">월별 배당금 (세후)</h3>
                <MonthlyDividends amounts={monthlyDividends} />
              </div>
            </>
          )}
          {(annualDividend !== null || requiredInvestment !== null) && chartData && chartData.stocks.length > 0 && (
            <StockCharts
              exchangeRate={chartData.exchangeRate}
              key={chartData.stocks.map((s) => s.ticker).filter(Boolean).join(',')}
              stocks={chartData.stocks}
              totalInvestment={chartData.totalInvestment}
            />
          )}
        </div>
      </form>
    </main>
  );
}
