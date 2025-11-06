import { memo } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Stock } from '@/types';

const StockCard = ({ stock }: { stock: Stock }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <Input className="flex-1" placeholder="종목검색" type="search" value={stock.ticker} />
        <Input placeholder="종목명" type="text" value={stock.name} />
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input placeholder="가격" type="number" value={stock.price} />
        <Input placeholder="배당" type="number" value={stock.dividend} />
        <Input placeholder="배당률" type="number" value={stock.yield} />
        <Input placeholder="수량" type="number" value={stock.amount} />
      </CardContent>
    </Card>
  );
};

export default memo(StockCard);
