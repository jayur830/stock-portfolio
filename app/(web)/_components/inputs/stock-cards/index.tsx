'use client';

import { useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import type { FormValues } from '@/types';

import StockCard from './stock-card';

export default function StockCards() {
  const { control } = useFormContext<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stocks',
  });

  const handleAddStock = useCallback(() => {
    append({
      name: '',
      ticker: '',
      price: 0,
      currency: 'KRW' as const,
      dividendMonths: [],
      yield: 0,
      ratio: 100,
      purchaseDate: undefined,
      enabled: true,
    });
  }, [append]);

  return (
    <>
      {/** 종목 리스트 */}
      {fields.map((stock, index) => (
        <StockCard
          control={control}
          index={index}
          key={stock.id}
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
    </>
  );
}
