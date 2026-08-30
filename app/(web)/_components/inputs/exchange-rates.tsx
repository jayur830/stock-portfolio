'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exchangeRateCodes } from '@/lib/utils';
import type { FormValues } from '@/types';

const _exchangeRateCodes = exchangeRateCodes.filter((key) => key !== 'KRW');

/** 환율 */
export default function ExchangeRates() {
  const [selectedCurrency, setSelectedCurrency] = useState<typeof _exchangeRateCodes[number]>('USD');

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
      return _exchangeRateCodes.reduce((result, key) => ({ ...result, [key]: +(1 / data.rates[key]).toFixed(2) }), {});
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
    <section className="input-surface exchange-rates-surface">
      <div className="surface-heading">
        <div className="surface-heading-copy">
          <span className="surface-kicker">MARKET DATA</span>
          <h3 className="surface-title">환율 기준</h3>
          <p className="surface-description">외화 종목을 담았다면 원화 환산 기준을 먼저 맞춰주세요.</p>
          <span className="surface-status"><span className="status-dot" /> KRW 기준 환율</span>
        </div>
        <Button
          className="surface-action hidden sm:inline-flex"
          disabled={loadingExchangeRate}
          onClick={handleFetchExchangeRate}
          size="sm"
          type="button"
          variant="outline"
        >
          <RefreshCw className={loadingExchangeRate ? 'animate-spin' : ''} size={14} />
          {loadingExchangeRate ? '조회 중...' : '환율 새로고침'}
        </Button>
      </div>

      <div className="rate-grid hidden sm:grid">
        {_exchangeRateCodes.map((currency) => (
          <div className="rate-item" key={currency}>
            <label className="text-xs font-medium text-muted-foreground">{currency}/KRW</label>
            <Input
              className="rate-input"
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
      <div className="rate-mobile flex sm:hidden">
        <div className="rate-mobile-actions">
          <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
            <SelectTrigger className="select-trigger">
              <SelectValue placeholder="통화" />
            </SelectTrigger>
            <SelectContent>
              {_exchangeRateCodes.map((currency) => <SelectItem key={currency} value={currency}>{currency}/KRW</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            className="surface-action"
            disabled={loadingExchangeRate}
            onClick={handleFetchExchangeRate}
            type="button"
            variant="outline"
          >
            <span>{loadingExchangeRate ? '조회 중...' : '환율 조회'}</span>
            <RefreshCw className={loadingExchangeRate ? 'animate-spin' : ''} size={14} />
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{selectedCurrency}/KRW</label>
          <Input
            className="rate-input"
            min={0}
            onChange={(e) => {
              const newValue = e.target.valueAsNumber;
              onChange({
                ...exchangeRates,
                [selectedCurrency]: isNaN(newValue) ? 0 : newValue,
              });
            }}
            placeholder="0"
            step="any"
            type="number"
            value={exchangeRates?.[selectedCurrency as keyof typeof exchangeRates] || ''}
          />
        </div>
      </div>
    </section>
  );
}
