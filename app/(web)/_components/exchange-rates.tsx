'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormValues } from '@/types';

export interface ExchangeRatesProps {
  control: Control<FormValues>;
  onResetExchangeRates(data: { [key: string]: number }): void;
}

/** 환율 */
export default function ExchangeRates({ control, onResetExchangeRates }: ExchangeRatesProps) {
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

  const { field: { onChange, value: exchangeRates } } = useController({
    control,
    name: 'exchangeRates',
  });

  /** 환율 데이터가 변경되면 폼에 반영 */
  useEffect(() => {
    if (exchangeRateData) {
      onResetExchangeRates(exchangeRateData);
    }
  }, [onResetExchangeRates, exchangeRateData]);

  /** 환율 조회 버튼 핸들러 */
  const handleFetchExchangeRate = useCallback(async () => {
    const result = await refetchExchangeRate();
    if (result.data) {
      onResetExchangeRates(result.data);
    }
  }, [refetchExchangeRate, onResetExchangeRates]);

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
    </>
  );
}
