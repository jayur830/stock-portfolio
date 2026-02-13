'use client';

import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormValues } from '@/types';

const keys: Record<TargetInputProps['tab'], 'totalInvestment' | 'targetAnnualDividend'> = {
  dividend: 'totalInvestment',
  investment: 'targetAnnualDividend',
};

const labels: Record<TargetInputProps['tab'], string> = {
  dividend: '총 투자금',
  investment: '목표 연 배당금',
};
const placeholders: Record<TargetInputProps['tab'], string> = {
  dividend: '총 투자금을 입력하세요',
  investment: '목표 연 배당금을 입력하세요',
};

export interface TargetInputProps {
  control: Control<FormValues>;
  tab: 'dividend' | 'investment';
}

export default function TargetInput({ control, tab }: TargetInputProps) {
  const { field: { onChange, value: current, ...field } } = useController({
    control,
    name: keys[tab],
  });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <label className="text-xs md:text-sm font-medium whitespace-nowrap">{labels[tab]}</label>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
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
  );
}
