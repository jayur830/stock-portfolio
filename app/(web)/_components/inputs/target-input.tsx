'use client';

import { useSearchParams } from 'next/navigation';
import { Controller, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Category, FormValues } from '@/types';

const keys: Record<Category, 'totalInvestment' | 'targetAnnualDividend'> = {
  dividend: 'totalInvestment',
  investment: 'targetAnnualDividend',
};

const labels: Record<Category, string> = {
  dividend: '총 투자금',
  investment: '목표 연 배당금',
};
const placeholders: Record<Category, string> = {
  dividend: '총 투자금을 입력하세요',
  investment: '목표 연 배당금을 입력하세요',
};

export default function TargetInput() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') || 'dividend') as Category;

  const { control } = useFormContext<FormValues>();

  return (
    <section className="target-surface">
      <div className="target-topline">
        <div className="target-leading">
          <span className="section-index">02</span>
          <div>
            <span className="surface-kicker">SET YOUR TARGET</span>
            <h3 className="surface-title">{labels[tab]}</h3>
            <p className="surface-description">{tab === 'dividend' ? '현재 투자금으로 기대하는 연간 배당을 계산합니다.' : '원하는 연간 배당을 만들기 위한 투자금을 계산합니다.'}</p>
          </div>
        </div>
        <span className="target-badge">{tab === 'dividend' ? 'INVESTMENT' : 'INCOME GOAL'}</span>
      </div>

      <div className="target-input-row">
        <div className="target-input-shell">
          <Controller
            control={control}
            name={keys[tab]}
            render={({ field: { onChange, value: current, ...field } }) => (
              <Input
                aria-label={labels[tab]}
                className="target-input"
                maxLength={24}
                min={0}
                placeholder={placeholders[tab]}
                step="any"
                type="number"
                {...field}
                onChange={(e) => {
                  onChange(e.target.value === '' ? null : e.target.valueAsNumber);
                }}
                value={current || ''}
              />
            )}
          />
          <span className="target-currency">원</span>
        </div>
      </div>
      <div className="quick-add-row">
        <Controller
          control={control}
          name={keys[tab]}
          render={({ field: { onChange, value: current } }) => (
            <>
              {[
                { label: '+10만', value: 100000 },
                { label: '+100만', value: 1000000 },
                { label: '+1000만', value: 10000000 },
                { label: '+1억', value: 100000000 },
                { label: '+10억', value: 1000000000 },
                { label: '+100억', value: 10000000000 },
                { label: '초기화', value: NaN },
              ].map(({ label, value }) => (
                <Button
                  className="quick-add-button"
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
            </>
          )}
        />
      </div>
    </section>
  );
}
