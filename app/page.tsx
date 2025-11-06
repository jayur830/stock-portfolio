'use client';

import { useFieldArray, useForm } from 'react-hook-form';

import StockCard from '@/components/domain/stock-card';
import { Button } from '@/components/ui/button';
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
  stocks: Stock[];
}

export default function Home() {
  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      stocks: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'stocks',
  });

  const stocks = watch('stocks');
  const totalRatio = stocks.reduce((sum, stock) => sum + stock.ratio, 0);

  const handleStockChange = (index: number, updatedStock: Stock) => {
    // 최대 100%로 제한
    if (updatedStock.ratio > 100) {
      updatedStock.ratio = 100;
    } else if (updatedStock.ratio < 0) {
      updatedStock.ratio = 0;
    }

    update(index, updatedStock);
  };

  const onSubmit = (data: FormValues) => {
    console.log('계산 데이터:', data);
    // TODO: 실제 계산 로직 구현
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
        {fields.map((field, index) => (
          <StockCard
            key={field.id}
            onChange={(updatedStock) => handleStockChange(index, updatedStock)}
            onDelete={() => remove(index)}
            stock={stocks[index]}
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

            const currentStocks = stocks;
            const newList = [...currentStocks, newStock];

            // 모든 종목을 균등하게 재분배
            const equalRatio = 100 / newList.length;
            const redistributedList = newList.map((stock) => ({
              ...stock,
              ratio: equalRatio,
            }));

            // 기존 stocks를 모두 제거하고 새로운 리스트로 교체
            redistributedList.forEach((stock, idx) => {
              if (idx < currentStocks.length) {
                update(idx, stock);
              } else {
                append(stock);
              }
            });
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
            <Button disabled={totalRatio !== 100} type="submit">
              계산
            </Button>
            <Button
              onClick={() => reset()}
              type="button"
              variant="outline"
            >
              초기화
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
