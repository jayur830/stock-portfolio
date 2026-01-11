'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import StockCard from '@/app/(main)/_components/stock-card';
import { DarkModeSwitch } from '@/components/dark-mode-switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateComprehensiveTax, calculateStockAnnualDividend, calculateStockMonthlyDividends, decodeStocksFromBase64, DIVIDEND_TAX_RATE, encodeStocksToBase64, FOREIGN_TAX_RATES, mergeMonthlyDividends, setSearchParams } from '@/lib/utils';
import type { FormValues, Stock } from '@/types';

import CalculateButton from './_components/calculate-button';
import IncomeTaxInfo from './_components/income-tax-info';
import MonthlyDividends from './_components/monthly-dividends';
import QuantityPerStock from './_components/quantity-per-stock';

const StockCharts = dynamic(() => import('./_components/stock-charts'), {
  loading: () => <div className="flex justify-center items-center p-8 text-muted-foreground">차트 로딩 중...</div>,
  ssr: false,
});

function PageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsObject = Object.fromEntries(searchParams.entries());
  const activeTab = (searchParams.get('tab') || 'dividend') as 'dividend' | 'investment';

  const { control, getValues, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      totalInvestment: searchParams.has('totalInvestment') ? +searchParams.get('totalInvestment')! : undefined,
      targetAnnualDividend: searchParams.has('targetAnnualDividend') ? +searchParams.get('targetAnnualDividend')! : undefined,
      exchangeRates: {},
      stocks: searchParams.has('stocks') ? decodeStocksFromBase64(searchParams.get('stocks')!) : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stocks',
  });

  useLayoutEffect(() => {
    if (!searchParams.has('tab')) {
      setSearchParams(
        pathname,
        {
          ...searchParamsObject,
          tab: 'dividend',
        },
      );
    }
  }, [pathname, searchParams, searchParamsObject]);

  useEffect(() => {
    return watch((value, { name, type }) => {
      if (type === 'change') {
        switch (name) {
          case 'totalInvestment':
          case 'targetAnnualDividend':
            setSearchParams(
              pathname,
              {
                ...searchParamsObject,
                [name]: value[name] != null && !isNaN(+value[name]) ? value[name] : undefined,
              },
            );
            break;
          case 'stocks':
            // stocks 배열의 어떤 필드든 변경되면 전체 stocks를 URL에 저장
            const stocksData = value.stocks || [];
            const encodedStocks = stocksData.length > 0 ? encodeStocksToBase64((value.stocks || []) as Stock[]) : undefined;
            setSearchParams(
              pathname,
              {
                ...searchParamsObject,
                stocks: encodedStocks,
              },
            );
            break;
          default:
            break;
        }
      }
    }).unsubscribe;
  }, [watch, pathname, searchParamsObject]);
  /** 연 배당금 */
  const [annualDividend, setAnnualDividend] = useState<number | null>(null);
  /** 해외 연 배당금 */
  const [foreignAnnualDividend, setForeignAnnualDividend] = useState<number>(0);
  /** 평균 해외 배당소득세율 (가중평균) */
  const [averageForeignTaxRate, setAverageForeignTaxRate] = useState<number>(0.15);
  /** 필요한 투자금 */
  const [requiredInvestment, setRequiredInvestment] = useState<number | null>(null);
  /** 계산 시점의 목표 연 배당금 */
  const [calculatedTargetAnnualDividend, setCalculatedTargetAnnualDividend] = useState<number | null>(null);
  /** 월별 배당금 */
  const [monthlyDividends, setMonthlyDividends] = useState<number[]>(Array(12).fill(0));
  /** 차트에 전달할 계산 시점의 값들 */
  const [chartData, setChartData] = useState<{
    totalInvestment: number;
    exchangeRates: { [key: string]: number };
    stocks: any[];
  } | null>(null);

  /** 배당금 계산 모드: 종합소득세 추가 납부세액 */
  const annualDividendAdditionalTax = annualDividend != null ? calculateComprehensiveTax(annualDividend, foreignAnnualDividend, averageForeignTaxRate) : null;

  /** 환율 조회 */
  const { data: exchangeRateData, isLoading: loadingExchangeRate, refetch: refetchExchangeRate } = useQuery({
    queryKey: ['exchangeRates'],
    async queryFn() {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/KRW');
      if (!response.ok) {
        throw new Error('환율 조회에 실패했습니다.');
      }
      const data = await response.json();
      // KRW 기준으로 다른 통화의 환율을 계산 (1 외화 = X KRW)
      return {
        USD: +(1 / data.rates.USD).toFixed(2),
        EUR: +(1 / data.rates.EUR).toFixed(2),
        JPY: +(1 / data.rates.JPY).toFixed(2),
        GBP: +(1 / data.rates.GBP).toFixed(2),
        CNY: +(1 / data.rates.CNY).toFixed(2),
        AUD: +(1 / data.rates.AUD).toFixed(2),
        CAD: +(1 / data.rates.CAD).toFixed(2),
        CHF: +(1 / data.rates.CHF).toFixed(2),
        HKD: +(1 / data.rates.HKD).toFixed(2),
      } as { [key: string]: number };
    },
    staleTime: 1000 * 60 * 60, // 1시간
    refetchOnWindowFocus: true,
  });

  /** 환율 데이터가 변경되면 폼에 반영 */
  useEffect(() => {
    if (exchangeRateData) {
      setValue('exchangeRates', exchangeRateData);
    }
  }, [exchangeRateData, setValue]);

  /** 환율 조회 버튼 핸들러 */
  const handleFetchExchangeRate = useCallback(async () => {
    const result = await refetchExchangeRate();
    if (result.data) {
      setValue('exchangeRates', result.data);
    }
  }, [refetchExchangeRate, setValue]);

  /** 폼 데이터 검증 */
  const validateFormData = useCallback((data: FormValues): string | null => {
    const currentTotalRatio = data.stocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
    if (currentTotalRatio > 100) {
      return '총 비율이 100% 이하가 되어야 합니다.';
    }

    if (activeTab === 'dividend' && (data.totalInvestment == null || isNaN(data.totalInvestment) || data.totalInvestment <= 0)) {
      return '총 투자금을 입력해주세요.';
    }

    if (activeTab === 'investment' && (data.targetAnnualDividend == null || isNaN(data.targetAnnualDividend) || data.targetAnnualDividend <= 0)) {
      return '목표 연 배당금을 입력해주세요.';
    }

    /** 외화 종목이 있는지 확인 */
    const foreignCurrencies = data.stocks
      .map((stock) => stock.currency)
      .filter((currency) => currency !== 'KRW');
    const uniqueForeignCurrencies = Array.from(new Set(foreignCurrencies));

    /** 환율 조회 여부 */
    if (uniqueForeignCurrencies.length > 0) {
      const missingRates = uniqueForeignCurrencies.filter(
        (currency) => !data.exchangeRates || !data.exchangeRates[currency] || data.exchangeRates[currency] <= 0,
      );
      if (missingRates.length > 0) {
        return `${missingRates.join(', ')} 통화의 환율을 먼저 조회해주세요.`;
      }
    }

    return null;
  }, [activeTab]);

  /** 배당금 계산: 투자금 → 배당금 */
  const calculateDividendFromInvestment = useCallback((data: FormValues) => {
    const stockDividends = data.stocks.map((stock) => {
      /** 종목별 투자금 */
      const investmentAmount = (data.totalInvestment * stock.ratio) / 100;
      /** 종목별 연 배당금 */
      const annualDividend = calculateStockAnnualDividend(stock, investmentAmount, data.exchangeRates);
      /** 종목별 월별 배당금 */
      const monthlyDividends = calculateStockMonthlyDividends(stock, annualDividend);
      /** 종목별 세율 */
      const taxRate = stock.currency === 'KRW' ? 0 : (FOREIGN_TAX_RATES[stock.currency] ?? 0.15);
      return {
        annualDividend,
        monthlyDividends,
        isForeign: stock.currency !== 'KRW',
        taxRate,
      };
    });

    /** 종목별 연 배당금 합산 */
    const totalAnnualDividend = stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0);
    /** 해외 연 배당금 합산 */
    const totalForeignAnnualDividend = stockDividends
      .filter(({ isForeign }) => isForeign)
      .reduce((sum, { annualDividend }) => sum + annualDividend, 0);
    /** 평균 해외 배당소득세율 (가중평균) */
    const avgForeignTaxRate = totalForeignAnnualDividend > 0 ? stockDividends
      .filter(({ isForeign }) => isForeign)
      .reduce((sum, { annualDividend, taxRate }) => sum + annualDividend * taxRate, 0) / totalForeignAnnualDividend : 0.15;
    /** 종목별 월별 배당금 합산 */
    const monthlyDividendArray = mergeMonthlyDividends(stockDividends);

    setAnnualDividend(totalAnnualDividend);
    setForeignAnnualDividend(totalForeignAnnualDividend);
    setAverageForeignTaxRate(avgForeignTaxRate);
    setMonthlyDividends(monthlyDividendArray);
    setRequiredInvestment(null);
    setChartData({
      totalInvestment: data.totalInvestment,
      exchangeRates: data.exchangeRates,
      stocks: data.stocks,
    });
  }, []);

  /** 투자금 계산: 목표 배당금 → 필요한 투자금 */
  const calculateInvestmentFromDividend = useCallback((data: FormValues) => {
    /** 각 종목별 비율에 따른 배당 수익률의 합 */
    const weightedDividendYield = data.stocks.reduce((sum, stock) => {
      const dividendYield = stock.yield / 100;
      return sum + dividendYield * (stock.ratio / 100);
    }, 0);
    /** 필요한 투자금 */
    const requiredInvestmentAmount = data.targetAnnualDividend / weightedDividendYield;

    const stockDividends = data.stocks.map((stock) => {
      const investmentAmount = (requiredInvestmentAmount * stock.ratio) / 100;
      const annualDividend = calculateStockAnnualDividend(stock, investmentAmount, data.exchangeRates);
      const monthlyDividends = calculateStockMonthlyDividends(stock, annualDividend);
      /** 종목별 세율 */
      const taxRate = stock.currency === 'KRW' ? 0 : (FOREIGN_TAX_RATES[stock.currency] ?? 0.15);
      return {
        annualDividend,
        monthlyDividends,
        isForeign: stock.currency !== 'KRW',
        taxRate,
      };
    });

    const monthlyDividendArray = mergeMonthlyDividends(stockDividends);

    /** 해외 연 배당금 합산 */
    const totalForeignAnnualDividend = stockDividends
      .filter(({ isForeign }) => isForeign)
      .reduce((sum, { annualDividend }) => sum + annualDividend, 0);
    /** 평균 해외 배당소득세율 (가중평균) */
    const avgForeignTaxRate = totalForeignAnnualDividend > 0 ? stockDividends
      .filter(({ isForeign }) => isForeign)
      .reduce((sum, { annualDividend, taxRate }) => sum + annualDividend * taxRate, 0) / totalForeignAnnualDividend : 0.15;

    setRequiredInvestment(requiredInvestmentAmount);
    setCalculatedTargetAnnualDividend(data.targetAnnualDividend);
    setForeignAnnualDividend(totalForeignAnnualDividend);
    setAverageForeignTaxRate(avgForeignTaxRate);
    setMonthlyDividends(monthlyDividendArray);
    setAnnualDividend(null);
    setChartData({
      totalInvestment: requiredInvestmentAmount,
      exchangeRates: data.exchangeRates,
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
      ratio: 100,
      purchaseDate: undefined,
      dividendInputType: 'amount' as const,
    };

    append(newStock);
  }, [append]);

  const handleReset = useCallback(() => {
    const currentExchangeRates = getValues('exchangeRates');
    reset({
      totalInvestment: 0,
      targetAnnualDividend: 0,
      exchangeRates: currentExchangeRates,
      stocks: [],
    });
    setAnnualDividend(null);
    setForeignAnnualDividend(0);
    setRequiredInvestment(null);
    setCalculatedTargetAnnualDividend(null);
    setMonthlyDividends(Array(12).fill(0));
    setChartData(null);
  }, [reset, getValues]);

  const handleTabChange = useCallback((value: string) => {
    setSearchParams(pathname, { ...searchParamsObject, tab: value });
  }, [pathname, searchParamsObject]);

  const onSubmit = useCallback((data: FormValues) => {
    const error = validateFormData(data);
    if (error) {
      alert(error);
      return;
    }

    switch (activeTab) {
      case 'dividend':
        calculateDividendFromInvestment(data);
        break;
      case 'investment':
        calculateInvestmentFromDividend(data);
        break;
      default:
        break;
    }
  }, [activeTab, calculateDividendFromInvestment, calculateInvestmentFromDividend]);

  return (
    <main aria-label="배당주 포트폴리오 계산기" className="flex flex-col gap-3.5 p-4 overflow-x-hidden">
      {/** 배당금 계산/투자금 계산 탭 */}
      <div className="flex items-center gap-4">
        <Tabs className="flex-1 w-full" onValueChange={handleTabChange} value={activeTab}>
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="dividend">배당금 계산</TabsTrigger>
            <TabsTrigger value="investment">투자금 계산</TabsTrigger>
          </TabsList>
        </Tabs>
        <DarkModeSwitch />
      </div>

      {/** 환율 */}
      <Button
        className="w-full sm:w-fit"
        disabled={loadingExchangeRate}
        onClick={handleFetchExchangeRate}
        size="sm"
        type="button"
        variant="outline"
      >
        {loadingExchangeRate ? '조회 중...' : '환율 조회'}
      </Button>
      <Controller
        control={control}
        name="exchangeRates"
        render={({ field: { onChange, value: exchangeRates } }) => {
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                'USD', 'EUR', 'JPY', 'GBP', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD',
              ].map((currency) => (
                <div className="flex flex-col gap-1.5" key={currency}>
                  <label className="text-xs font-medium text-muted-foreground">{currency}/KRW</label>
                  <Input
                    min={0}
                    onChange={(e) => {
                      const newValue = e.target.valueAsNumber;
                      onChange({
                        ...exchangeRates,
                        [currency]: isNaN(newValue) ? 0 : newValue,
                      });
                    }}
                    placeholder="0"
                    step="any"
                    type="number"
                    value={exchangeRates?.[currency as keyof typeof exchangeRates] || ''}
                  />
                </div>
              ))}
            </div>
          );
        }}
      />

      <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg">
          {/** 총 투자금 입력 필드 */}
          {activeTab === 'dividend' && (
            <Controller
              control={control}
              name="totalInvestment"
              render={({ field: { onChange, value: current, ...field } }) => (
                <>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-xs md:text-sm font-medium whitespace-nowrap">총 투자금</label>
                    <div className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        maxLength={24}
                        min={0}
                        placeholder="총 투자금을 입력하세요"
                        step="any"
                        type="number"
                        {...field}
                        onChange={(e) => {
                          onChange(e.target.value === '' ? null : e.target.valueAsNumber);
                        }}
                        value={current || ''}
                      />
                      <span className="text-sm text-muted-foreground">원</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '+10만', value: 100000 },
                      { label: '+100만', value: 1000000 },
                      { label: '+1000만', value: 10000000 },
                      { label: '+1억', value: 100000000 },
                      { label: '+10억', value: 1000000000 },
                      { label: '+100억', value: 10000000000 },
                    ].map(({ label, value }) => (
                      <Button
                        className="h-7 text-xs"
                        key={label}
                        onClick={() => {
                          onChange(isNaN(current) ? value : current + value);
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
            />
          )}

          {/** 목표 연 배당금 입력 필드 */}
          {activeTab === 'investment' && (
            <Controller
              control={control}
              name="targetAnnualDividend"
              render={({ field: { onChange, value: current, ...field } }) => (
                <>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-xs md:text-sm font-medium whitespace-nowrap">목표 연 배당금 (세전)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        maxLength={24}
                        min={0}
                        placeholder="목표 연 배당금을 입력하세요"
                        step="any"
                        type="number"
                        {...field}
                        onChange={(e) => {
                          onChange(e.target.value === '' ? null : e.target.valueAsNumber);
                        }}
                        value={current || ''}
                      />
                      <span className="text-sm text-muted-foreground">원</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '+10만', value: 100000 },
                      { label: '+100만', value: 1000000 },
                      { label: '+1000만', value: 10000000 },
                      { label: '+1억', value: 100000000 },
                      { label: '+10억', value: 1000000000 },
                      { label: '+100억', value: 10000000000 },
                    ].map(({ label, value }) => (
                      <Button
                        className="h-7 text-xs"
                        key={label}
                        onClick={() => {
                          onChange(isNaN(current) ? value : current + value);
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
            />
          )}
        </div>

        {/** 종목 리스트 */}
        {fields.map((field, index) => (
          <StockCard
            control={control}
            index={index}
            key={field.id}
            onDelete={() => remove(index)}
          />
        ))}

        {/** 종목 추가 버튼 */}
        <Button
          aria-label="종목 추가"
          className="border-dashed"
          onClick={handleAddStock}
          type="button"
          variant="outline"
        >
          +
        </Button>

        {/** 결과 */}
        <div className="flex flex-col gap-2 mt-2">
          {/** 총 비율 */}
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="text-muted-foreground">총 비율:</span>
            <Controller
              control={control}
              name="stocks"
              render={({ field: { value: stocks } }) => {
                const totalRatio = stocks.reduce((acc, { ratio }) => acc + (ratio || 0), 0);
                return (
                  <span className={`font-semibold ${totalRatio === 100 ? 'text-green-600' : totalRatio > 100 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {totalRatio.toFixed(1)}%
                  </span>
                );
              }}
            />
          </div>

          {/** 버튼 */}
          <div className="flex justify-center items-center gap-1">
            <CalculateButton control={control} />
            <Button
              onClick={handleReset}
              type="button"
              variant="outline"
            >
              초기화
            </Button>
          </div>

          {/** 배당금 결과 */}
          {annualDividend != null && (
            <>
              <div aria-live="polite" className="flex md:flex-row flex-col justify-center items-center gap-4 p-2 md:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">세전 연 배당금:</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </span>
                </div>
                <div className="hidden md:block h-6 w-px bg-green-300 dark:bg-green-700" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">세후 연 배당금:</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {(annualDividend * (1 - DIVIDEND_TAX_RATE)).toLocaleString('ko-KR', {
                      maximumFractionDigits: 0,
                    })}원
                  </span>
                </div>
              </div>
              {chartData && chartData.stocks.length > 0 && (
                <div className="flex flex-col gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">종목별 보유 수량</h3>
                  <QuantityPerStock exchangeRates={chartData.exchangeRates} stocks={chartData.stocks} totalInvestment={chartData.totalInvestment} />
                </div>
              )}
              <div className="flex flex-col gap-2 p-4 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">예상 월별 배당금 (세후)</h3>
                <MonthlyDividends amounts={monthlyDividends} />
              </div>
              <div className="flex flex-col gap-2 p-4 bg-card border rounded-lg">
                <h3 className="text-sm font-semibold">배당소득세 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-muted-foreground">연간 배당소득 (세전)</span>
                    <span className="text-sm md:text-base font-medium">
                      {annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-muted-foreground">원천징수 세액 (15.4%)</span>
                    <span className="text-sm md:text-base font-medium text-muted-foreground">
                      {(annualDividend * DIVIDEND_TAX_RATE).toLocaleString('ko-KR', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      원
                    </span>
                  </div>
                  {annualDividendAdditionalTax != null ? (
                    <>
                      <div className="border-t pt-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold">종합과세 대상</div>
                              <IncomeTaxInfo />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              금융소득이 2,000만원을 초과하여 종합과세 대상입니다.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-2 rounded-md p-3 ${
                        annualDividendAdditionalTax > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : annualDividendAdditionalTax === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      }`}
                      >
                        <span className={`text-sm font-semibold ${
                          annualDividendAdditionalTax > 0 ? 'text-red-900 dark:text-red-100' : annualDividendAdditionalTax === 0 ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'
                        }`}
                        >
                          {annualDividendAdditionalTax > 0 ? '내년 추가 납부 예정' : annualDividendAdditionalTax === 0 ? '내년 납부 없음' : '내년 환급 예정'}
                        </span>
                        <span className={`text-base md:text-lg font-bold ${
                          annualDividendAdditionalTax > 0 ? 'text-red-600 dark:text-red-400' : annualDividendAdditionalTax === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                        }`}
                        >
                          {annualDividendAdditionalTax.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs md:text-sm font-medium">분리과세로 과세 종결 (추가 납부 없음)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/** 투자금 결과 */}
          {requiredInvestment != null && (
            <>
              <div aria-live="polite" className="flex justify-center items-center gap-4 p-2 md:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">필요한 투자금:</span>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {requiredInvestment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </span>
                </div>
              </div>
              {chartData && chartData.stocks.length > 0 && (
                <div className="flex flex-col gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">종목별 보유 수량</h3>
                  <QuantityPerStock exchangeRates={chartData.exchangeRates} stocks={chartData.stocks} totalInvestment={chartData.totalInvestment} />
                </div>
              )}
              <div className="flex flex-col gap-2 p-4 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">예상 월별 배당금 (세후)</h3>
                <MonthlyDividends amounts={monthlyDividends} />
              </div>
              <div className="flex flex-col gap-2 p-4 bg-card border rounded-lg">
                <h3 className="text-sm font-semibold">배당소득세 정보</h3>
                <div className="space-y-3">
                  {(() => {
                    const requiredInvestmentAdditionalTax = requiredInvestment != null && calculatedTargetAnnualDividend != null ? calculateComprehensiveTax(calculatedTargetAnnualDividend, foreignAnnualDividend) : null;

                    if (calculatedTargetAnnualDividend == null) {
                      return <></>;
                    }

                    const defaultElement = (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-muted-foreground">연간 배당소득 (세전)</span>
                          <span className="text-sm md:text-base font-medium">
                            {calculatedTargetAnnualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-muted-foreground">원천징수 세액 (15.4%)</span>
                          <span className="text-sm md:text-base font-medium text-muted-foreground">
                            {(calculatedTargetAnnualDividend * DIVIDEND_TAX_RATE).toLocaleString('ko-KR', {
                              maximumFractionDigits: 0,
                            })}{' '}
                            원
                          </span>
                        </div>
                      </>
                    );

                    if (requiredInvestmentAdditionalTax != null) {
                      return (
                        <>
                          {defaultElement}
                          <div className="border-t pt-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">종합과세 대상</div>
                                  <IncomeTaxInfo />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  금융소득이 2,000만원을 초과하여 종합과세 대상입니다.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-2 rounded-md p-3 ${
                            requiredInvestmentAdditionalTax > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : requiredInvestmentAdditionalTax === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          }`}
                          >
                            <span className={`text-sm font-semibold ${
                              requiredInvestmentAdditionalTax > 0 ? 'text-red-900 dark:text-red-100' : requiredInvestmentAdditionalTax === 0 ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'
                            }`}
                            >
                              {requiredInvestmentAdditionalTax > 0 ? '내년 추가 납부 예정' : requiredInvestmentAdditionalTax === 0 ? '내년 납부 없음' : '내년 환급 예정'}
                            </span>
                            <span className={`text-base md:text-lg font-bold ${
                              requiredInvestmentAdditionalTax > 0 ? 'text-red-600 dark:text-red-400' : requiredInvestmentAdditionalTax === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                            }`}
                            >
                              {requiredInvestmentAdditionalTax.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
                            </span>
                          </div>
                        </>
                      );
                    }

                    return (
                      <>
                        {defaultElement}
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <svg
                              className="w-4 h-4 md:w-5 md:h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-xs md:text-sm font-medium">분리과세로 과세 종결 (추가 납부 없음)</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {/** 차트 */}
          {(annualDividend != null || requiredInvestment != null) && chartData && chartData.stocks.length > 0 && (
            <StockCharts
              exchangeRates={chartData.exchangeRates}
              stocks={chartData.stocks}
              totalInvestment={chartData.totalInvestment}
            />
          )}
        </div>
      </form>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">로딩 중...</div>}>
      <PageContent />
    </Suspense>
  );
}
