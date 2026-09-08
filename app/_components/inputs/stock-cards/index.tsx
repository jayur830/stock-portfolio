'use client';

import { Plus, Scale } from 'lucide-react';
import { useCallback } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { normalizeStockRatios } from '@/lib/utils';
import type { FormValues } from '@/types';

import StockCard from './stock-card';

export default function StockCards() {
  const { control, setValue } = useFormContext<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stocks',
  });

  const stocks = useWatch({ control, name: 'stocks' }) || [];
  const totalRatio = stocks
    .filter(({ enabled }) => enabled)
    .reduce((total, { ratio }) => total + (Number(ratio) || 0), 0);

  const handleNormalizeRatios = useCallback(() => {
    const normalized = normalizeStockRatios(stocks);
    setValue('stocks', normalized, { shouldValidate: true, shouldDirty: true });
  }, [setValue, stocks]);

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
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {totalRatio !== 100 && stocks.some((s) => s.enabled) && (
            <Button
              className="h-7 text-[11px] font-bold gap-1 px-2.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-xs"
              onClick={handleNormalizeRatios}
              size="sm"
              title="각 종목의 상대적 비율을 유지한 채 합계가 정확히 100%가 되도록 비례 환산합니다"
              type="button"
              variant="outline"
            >
              <Scale size={12} />
              100% 자동 맞춤
            </Button>
          )}
          <span className="stock-count">{fields.length} POSITIONS</span>
        </div>
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
