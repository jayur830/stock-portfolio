'use client';

import { Plus } from 'lucide-react';
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
    <section className="stock-list-surface">
      <div className="stock-list-heading">
        <div className="surface-leading">
          <span className="section-index">03</span>
          <div>
            <span className="surface-kicker">YOUR POSITIONS</span>
            <h3 className="surface-title">종목을 담아보세요</h3>
            <p className="surface-description">보유 종목의 배당률과 비중을 입력하면 예상 현금흐름이 완성됩니다.</p>
          </div>
        </div>
        <span className="stock-count">{fields.length} POSITIONS</span>
      </div>

      <div className="stock-list">
        {/** 종목 리스트 */}
        {fields.map((stock, index) => (
          <StockCard
            control={control}
            index={index}
            key={stock.id}
            onDelete={() => remove(index)}
          />
        ))}
      </div>

      {/** 종목 추가 버튼 */}
      <Button
        aria-label="종목 추가"
        className="add-stock-button"
        onClick={handleAddStock}
        type="button"
        variant="outline"
      >
        <Plus size={16} />
        종목 추가
      </Button>
    </section>
  );
}
