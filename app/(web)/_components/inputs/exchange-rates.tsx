'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, LineChart, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exchangeRateCodes } from '@/lib/utils';
import type { FormValues } from '@/types';

import ExchangeRateChart, { currencySymbols } from './exchange-rate-chart';

const _exchangeRateCodes = exchangeRateCodes.filter((key) => key !== 'KRW');

/** 환율 */
export default function ExchangeRates() {
  const [selectedCurrency, setSelectedCurrency] = useState<typeof _exchangeRateCodes[number]>('USD');
  const [modalCurrency, setModalCurrency] = useState<string | null>(null);
  const [isMobileChartOpen, setIsMobileChartOpen] = useState(false);

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
        <div className="surface-leading">
          <span className="section-index">01</span>
          <div>
            <span className="surface-kicker">MARKET DATA</span>
            <h3 className="surface-title">환율 기준</h3>
            <p className="surface-description">외화 종목을 담았다면 원화 환산 기준을 먼저 맞춰주세요.</p>
            <span className="surface-status"><span className="status-dot" /> KRW 기준 환율</span>
          </div>
        </div>
        <Button
          className="surface-action inline-flex shrink-0"
          disabled={loadingExchangeRate}
          onClick={handleFetchExchangeRate}
          size="sm"
          type="button"
          variant="outline"
        >
          <RefreshCw className={loadingExchangeRate ? 'animate-spin' : ''} size={14} />
          <span className="hidden sm:inline">{loadingExchangeRate ? '조회 중...' : '환율 새로고침'}</span>
          <span className="sm:hidden">{loadingExchangeRate ? '조회...' : '새로고침'}</span>
        </Button>
      </div>

      {/* 데스크탑 그리드 뷰 */}
      <div className="rate-grid hidden sm:grid">
        {_exchangeRateCodes.map((currency) => (
          <div className="rate-item" key={currency}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">{currency}/KRW</label>
              <Button
                aria-label={`${currency} 환율 차트 보기`}
                className="h-5 w-5 p-0 text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setModalCurrency(currency)}
                size="sm"
                title={`${currency} 환율 차트`}
                type="button"
                variant="ghost"
              >
                <LineChart className="size-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                className="rate-input flex-1"
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
          </div>
        ))}
      </div>

      {/* 모바일 뷰 */}
      <div className="rate-mobile flex flex-col gap-2.5 sm:hidden">
        <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
          <SelectTrigger className="h-11 w-full border-border/80 bg-card font-bold">
            <SelectValue placeholder="통화 선택" />
          </SelectTrigger>
          <SelectContent>
            {_exchangeRateCodes.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency} / KRW ({currencySymbols[currency]?.name || currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="target-input-shell w-full">
          <Input
            aria-label={`${selectedCurrency}/KRW 환율`}
            className="target-input"
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
          <span className="target-currency">원</span>
        </div>

        {/* 모바일 Accordion 차트 토글 */}
        <div className="mt-1 flex flex-col rounded-lg border border-border/60 bg-muted/20">
          <button
            aria-expanded={isMobileChartOpen}
            className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setIsMobileChartOpen((prev) => !prev)}
            type="button"
          >
            <span className="flex items-center gap-1.5">
              <LineChart className="size-3.5 text-primary" />
              {selectedCurrency}/KRW 환율 추이 차트 {isMobileChartOpen ? '접기' : '보기'}
            </span>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform duration-200 ${isMobileChartOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isMobileChartOpen && (
            <div className="border-t border-border/50 p-3 pt-2">
              <ExchangeRateChart currency={selectedCurrency} height={220} />
            </div>
          )}
        </div>
      </div>

      {/* 데스크탑 환율 차트 모달 팝업 */}
      <Dialog onOpenChange={(open) => !open && setModalCurrency(null)} open={!!modalCurrency}>
        <DialogContent className="max-w-2xl">
          {modalCurrency && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <LineChart className="size-4.5 text-primary" />
                  {currencySymbols[modalCurrency]?.name || modalCurrency} ({modalCurrency}/KRW) 환율 추이
                </DialogTitle>
                <DialogDescription className="text-xs">
                  최근 기간별 원화(KRW) 환율 변동 추이 및 최고/최저 통계 데이터입니다.
                </DialogDescription>
              </DialogHeader>
              <div className="pt-2">
                <ExchangeRateChart currency={modalCurrency} height={320} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
