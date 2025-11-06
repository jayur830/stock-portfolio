'use client';

import { useState } from 'react';

import StockCard from '@/components/domain/stock-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Stock {
  name: string;
  ticker: string;
  price: number;
  dividend: number;
  yield: number;
  ratio: number;
}

export default function Home() {
  const [list, setList] = useState<Stock[]>([]);

  const totalRatio = list.reduce((sum, stock) => sum + stock.ratio, 0);

  const handleStockChange = (index: number, updatedStock: Stock) => {
    const newList = [...list];

    // 최대 100%로 제한
    if (updatedStock.ratio > 100) {
      updatedStock.ratio = 100;
    } else if (updatedStock.ratio < 0) {
      updatedStock.ratio = 0;
    }

    newList[index] = updatedStock;
    setList(newList);
  };

  return (
    <main className="flex flex-col gap-3.5 p-4">
      <Tabs className="w-full" defaultValue="dividend">
        <TabsList>
          <TabsTrigger value="dividend">배당금 계산</TabsTrigger>
          <TabsTrigger value="investment">투자금 계산</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-col gap-2">
        {list.map((stock, index) => (
          <StockCard
            key={index}
            onChange={(updatedStock) => handleStockChange(index, updatedStock)}
            stock={stock}
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
              yield: 0,
              ratio: 0,
            };

            const newList = [...list, newStock];

            // 모든 종목을 균등하게 재분배
            const equalRatio = 100 / newList.length;
            const redistributedList = newList.map((stock) => ({
              ...stock,
              ratio: equalRatio,
            }));

            setList(redistributedList);
          }}
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
            <Button disabled={totalRatio !== 100}>계산</Button>
            <Button variant="outline">초기화</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
