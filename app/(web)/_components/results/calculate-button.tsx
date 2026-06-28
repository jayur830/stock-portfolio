'use client';

import { ComponentProps } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import type { FormValues } from '@/types';

export interface CalculateButtonProps extends Omit<ComponentProps<typeof Button>, 'disabled' | 'type'> {
  control: Control<FormValues>;
}

export default function CalculateButton({ control, className, ...props }: CalculateButtonProps) {
  const { field: { value: stocks } } = useController({
    control,
    name: 'stocks',
  });
  const isNoStocks = stocks.length === 0;
  const isNoInfoStocks = stocks.some((stock) => !stock.currency || !stock.dividendMonths || !stock.price || !stock.yield || !stock.ratio);
  const totalRatio = stocks.reduce((acc, { ratio }) => acc + (ratio || 0), 0);

  return (
    <Button
      className={className}
      disabled={isNoStocks || isNoInfoStocks || totalRatio > 100}
      type="submit"
      {...props}
    >
      계산
    </Button>
  );
}
