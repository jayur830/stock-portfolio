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
  amount: number;
}

export default function Home() {
  const [list, setList] = useState<Stock[]>([]);

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
          <StockCard key={index} stock={stock} />
        ))}
        <Button
          className="border-dashed"
          onClick={() => {
            setList([
              ...list,
              {
                name: '',
                ticker: '',
                price: 0,
                dividend: 0,
                yield: 0,
                amount: 0,
              },
            ]);
          }}
          variant="outline"
        >
          +
        </Button>
        <div className="flex justify-center items-center gap-1 mt-2">
          <Button>계산</Button>
          <Button variant="outline">초기화</Button>
        </div>
      </div>
    </main>
  );
}
