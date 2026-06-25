'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FOREIGN_TAX_RATES } from '@/lib/utils';
import type { FormValues } from '@/types';

const exchangeRateCodes = Object.keys(FOREIGN_TAX_RATES).filter((key) => key !== 'KRW');

/** 환율 */
export default function ExchangeRates() {
  const { control } = useFormContext<FormValues>();
  const { field: { onChange, value: exchangeRates } } = useController({
    control,
    name: 'exchangeRates',
  });

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
      return exchangeRateCodes.reduce((result, key) => ({ ...result, [key]: +(1 / data.rates[key]).toFixed(2) }), {});
    },
    staleTime: 1000 * 60 * 60, // 1시간
    refetchOnWindowFocus: true,
  });

  /** 환율 데이터가 변경되면 폼에 반영 */
  useEffect(() => {
    if (exchangeRateData) {
      onChange(exchangeRateData);
    }
  }, [exchangeRateData]);

  /** 환율 조회 버튼 핸들러 */
  const handleFetchExchangeRate = useCallback(async () => {
    const result = await refetchExchangeRate();
    if (result.data) {
      onChange(result.data);
    }
  }, [refetchExchangeRate]);

  return (
    <>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {exchangeRateCodes.map((currency) => (
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
    </>
  );
}
