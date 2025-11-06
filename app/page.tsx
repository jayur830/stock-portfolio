'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import StockCard from '@/components/domain/stock-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Stock {
  name: string;
  ticker: string;
  price: number;
  dividend: number;
  dividendFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  yield: number;
  ratio: number;
}

interface FormValues {
  totalInvestment: number;
  stocks: Stock[];
}

export default function Home() {
  const { control, getValues, handleSubmit, register, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      totalInvestment: 0,
      stocks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stocks',
  });

  const totalInvestment = watch('totalInvestment');
  const watchedStocks = watch('stocks');
  const totalRatio = watchedStocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
  const [annualDividend, setAnnualDividend] = useState<number | null>(null);

  const onSubmit = (data: FormValues) => {
    // 조건 체크: 총 비율이 100%이고 투자금이 0보다 커야 함
    const currentTotalRatio = data.stocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
    if (Math.abs(currentTotalRatio - 100) > 0.1 || data.totalInvestment <= 0) {
      return; // 조건이 맞지 않으면 계산하지 않음
    }

    // 세전 연 배당금 계산
    let totalAnnualDividend = 0;

    data.stocks.forEach((stock) => {
      // 해당 종목에 투자된 금액
      const investmentAmount = (data.totalInvestment * stock.ratio) / 100;

      // 해당 종목의 연 배당금 = 투자금액 * 배당률 / 100
      const stockAnnualDividend = (investmentAmount * stock.yield) / 100;

      totalAnnualDividend += stockAnnualDividend;
    });

    setAnnualDividend(totalAnnualDividend);
  };

  return (
    <main className="flex flex-col gap-3.5 p-4">
      <Tabs className="w-full" defaultValue="dividend">
        <TabsList>
          <TabsTrigger value="dividend">배당금 계산</TabsTrigger>
          <TabsTrigger value="investment">투자금 계산</TabsTrigger>
        </TabsList>
      </Tabs>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <label className="text-sm font-medium whitespace-nowrap">총 투자금</label>
          <Input
            className="flex-1"
            placeholder="총 투자금을 입력하세요"
            type="number"
            {...register('totalInvestment', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">원</span>
        </div>
        {fields.map((field, index) => (
          <StockCard
            control={control}
            index={index}
            key={field.id}
            onDelete={() => remove(index)}
          />
        ))}
        <Button
          className="border-dashed"
          onClick={() => {
            const newStock = {
              name: '',
              ticker: '',
              price: 0,
              dividend: 0,
              dividendFrequency: 'quarterly' as const,
              yield: 0,
              ratio: 0,
            };

            const currentStocks = getValues('stocks');
            const newList = [...currentStocks, newStock];

            // 모든 종목을 균등하게 재분배
            const equalRatio = 100 / newList.length;
            const redistributedList = newList.map((stock) => ({
              ...stock,
              ratio: equalRatio,
            }));

            // 기존 stocks의 ratio만 업데이트하고 새 종목 추가
            currentStocks.forEach((_, idx) => {
              setValue(`stocks.${idx}.ratio`, redistributedList[idx].ratio);
            });
            append(redistributedList[redistributedList.length - 1]);
          }}
          type="button"
          variant="outline"
        >
          +
        </Button>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="text-muted-foreground">총 비율:</span>
            <span className={`font-semibold ${totalRatio === 100 ? 'text-green-600' : totalRatio > 100 ? 'text-red-600' : 'text-yellow-600'}`}>
              {totalRatio.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-center items-center gap-1">
            <Button disabled={Math.abs(totalRatio - 100) > 0.1 || totalInvestment <= 0} type="submit">
              계산
            </Button>
            <Button
              onClick={() => {
                reset();
                setAnnualDividend(null);
              }}
              type="button"
              variant="outline"
            >
              초기화
            </Button>
          </div>
          {annualDividend !== null && (
            <div className="flex justify-center items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-700">세전 연 배당금:</span>
                <span className="text-lg font-bold text-green-700">
                  {annualDividend.toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="h-6 w-px bg-green-300" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-700">세후 연 배당금:</span>
                <span className="text-lg font-bold text-green-700">
                  {(annualDividend * (1 - 0.154)).toLocaleString('ko-KR', {
                    maximumFractionDigits: 0,
                  })}원
                </span>
              </div>
            </div>
          )}
        </div>
      </form>
    </main>
  );
}
