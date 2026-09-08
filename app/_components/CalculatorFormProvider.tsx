'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useLayoutEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { decodeStocksFromBase64, encodeStocksToBase64, getStockDividends, setSearchParams } from '@/lib/utils';
import type { Category, FormValues, Stock } from '@/types';

export default function CalculatorFormProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const activeTab = (searchParams.get('tab') || 'dividend') as Category;

  const methods = useForm<FormValues>({
    defaultValues: {
      totalInvestment: searchParams.has('totalInvestment') ? +searchParams.get('totalInvestment')! : undefined,
      targetAnnualDividend: searchParams.has('targetAnnualDividend') ? +searchParams.get('targetAnnualDividend')! : undefined,
      exchangeRates: {},
      stocks: searchParams.has('stocks') ? decodeStocksFromBase64(searchParams.get('stocks')!) : [],
      stockDividends: [],
    },
  });
  const { getValues, setValue, handleSubmit, reset, watch } = methods;

  useLayoutEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    if (!params.has('tab')) {
      const searchParamsObject = Object.fromEntries(params.entries());
      setSearchParams(
        pathname,
        {
          ...searchParamsObject,
          tab: 'dividend',
        },
      );
    }
  }, [pathname, searchParamsString]);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change') {
        const searchParamsObject = Object.fromEntries(new URLSearchParams(searchParamsString).entries());
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
          case 'stocks': {
            /** stocks 배열의 어떤 필드든 변경되면 전체 stocks를 URL에 저장 */
            const stocksData = value.stocks || [];
            const encodedStocks = stocksData.length > 0 ? encodeStocksToBase64(stocksData as Stock[]) : undefined;
            setSearchParams(
              pathname,
              {
                ...searchParamsObject,
                stocks: encodedStocks,
              },
            );
            break;
          }
          default:
            break;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, pathname, searchParamsString]);

  /** 폼 데이터 검증 */
  const validateFormData = useCallback(({ stocks, totalInvestment, targetAnnualDividend, exchangeRates }: FormValues): string | null => {
    const enabledStocks = stocks.filter(({ enabled }) => enabled);
    const currentTotalRatio = enabledStocks.reduce((sum, { ratio }) => sum + ratio, 0);
    if (currentTotalRatio > 100) {
      return '총 비율이 100% 이하가 되어야 합니다.';
    }

    if (enabledStocks.length === 0) {
      return '최소 하나 이상의 종목을 활성화해주세요.';
    }

    if (activeTab === 'dividend' && (totalInvestment == null || isNaN(totalInvestment) || totalInvestment <= 0)) {
      return '총 투자금을 입력해주세요.';
    }

    if (activeTab === 'investment') {
      if (targetAnnualDividend == null || isNaN(targetAnnualDividend) || targetAnnualDividend <= 0) {
        return '목표 연 배당금을 입력해주세요.';
      }

      const weightedDividendYield = enabledStocks.reduce((sum, stock) => sum + (stock.yield / 100) * (stock.ratio / 100), 0);
      if (weightedDividendYield <= 0) {
        return '활성화된 종목들의 배당 수익률과 비율의 합이 0보다 커야 투자금을 계산할 수 있습니다.';
      }
    }

    /** 외화 종목이 있는지 확인 */
    const foreignCurrencies = enabledStocks
      .filter(({ currency }) => currency !== 'KRW')
      .map(({ currency }) => currency);
    const uniqueForeignCurrencies = Array.from(new Set(foreignCurrencies));

    /** 환율 조회 여부 */
    if (uniqueForeignCurrencies.length > 0) {
      const missingRates = uniqueForeignCurrencies.filter(
        (currency) => !exchangeRates || !exchangeRates[currency] || exchangeRates[currency] <= 0,
      );
      if (missingRates.length > 0) {
        return `${missingRates.join(', ')} 통화의 환율을 먼저 조회해주세요.`;
      }
    }

    return null;
  }, [activeTab]);

  /** 배당금 계산: 투자금 → 배당금 */
  const calculateDividendFromInvestment = useCallback(({ stocks, totalInvestment, exchangeRates }: FormValues) => {
    const enabledStocks = stocks.filter(({ enabled }) => enabled);
    /** 필요한 투자금 */
    const investment = totalInvestment;

    const stockDividends = getStockDividends(enabledStocks, investment);

    setValue('stockDividends', stockDividends);
    setValue('chartData', {
      totalInvestment: investment,
      exchangeRates,
      stocks: enabledStocks,
    });
    setValue('calculatedCategory', 'dividend');
  }, []);

  /** 투자금 계산: 목표 배당금 → 필요한 투자금 */
  const calculateInvestmentFromDividend = useCallback(({ stocks, targetAnnualDividend, exchangeRates }: FormValues) => {
    const enabledStocks = stocks.filter(({ enabled }) => enabled);
    /** 각 종목별 비율에 따른 배당 수익률의 합 */
    const weightedDividendYield = enabledStocks.reduce((sum, stock) => sum + (stock.yield / 100) * (stock.ratio / 100), 0);
    if (weightedDividendYield <= 0) {
      return;
    }
    /** 필요한 투자금 */
    const investment = targetAnnualDividend / weightedDividendYield;

    const stockDividends = getStockDividends(enabledStocks, investment);

    setValue('stockDividends', stockDividends);
    setValue('chartData', {
      totalInvestment: investment,
      exchangeRates,
      stocks: enabledStocks,
    });
    setValue('calculatedCategory', 'investment');
  }, []);

  const handleReset = useCallback(() => {
    const currentExchangeRates = getValues('exchangeRates');
    reset({
      totalInvestment: 0,
      targetAnnualDividend: 0,
      exchangeRates: currentExchangeRates,
      stocks: [],
      calculatedCategory: undefined,
      chartData: undefined,
    });
  }, [reset, getValues]);

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
    <FormProvider {...methods}>
      <form className="flex flex-col gap-2" onReset={handleReset} onSubmit={handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
