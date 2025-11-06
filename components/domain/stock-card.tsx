import { X } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { DividendFrequency, Stock } from '@/types';

interface StockCardProps {
  stock: Stock;
  onChange?: (stock: Stock) => void;
  onDelete?: () => void;
}

const StockCard = ({ stock, onChange, onDelete }: StockCardProps) => {
  const handleRatioChange = (value: number) => {
    if (onChange) {
      onChange({
        ...stock,
        ratio: value,
      });
    }
  };

  return (
    <Card className="p-4 relative">
      {onDelete && (
        <Button
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDelete}
          size="icon"
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <CardHeader>
        <Input
          className="flex-1"
          onChange={(e) => onChange?.({
            ...stock,
            ticker: e.target.value,
          })}
          placeholder="종목검색"
          type="search"
          value={stock.ticker}
        />
        <div className="flex items-center gap-2">
          <Input
            onChange={(e) => onChange?.({
              ...stock,
              name: e.target.value,
            })}
            placeholder="종목명"
            type="text"
            value={stock.name}
          />
          <Input
            onChange={(e) => onChange?.({
              ...stock,
              price: parseFloat(e.target.value) || 0,
            })}
            placeholder="가격"
            type="number"
            value={stock.price}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Select
            onValueChange={(value) => onChange?.({
              ...stock,
              dividendFrequency: value as DividendFrequency,
            })}
            value={stock.dividendFrequency}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="주기" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">월배당</SelectItem>
              <SelectItem value="quarterly">분기배당</SelectItem>
              <SelectItem value="semi-annual">반기배당</SelectItem>
              <SelectItem value="annual">연배당</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 pl-6">
            <span className="text-sm text-muted-foreground">연</span>
            <Input
              onChange={(e) => onChange?.({
                ...stock,
                yield: parseFloat(e.target.value) || 0,
              })}
              placeholder="배당률"
              type="number"
              value={stock.yield}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">비율</label>
          <Input
            className="w-[100px]"
            max={100}
            min={0}
            onChange={(e) => handleRatioChange(parseFloat(e.target.value) || 0)}
            placeholder="비율"
            step={10}
            type="number"
            value={stock.ratio.toFixed(0)}
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Slider
            className="flex-1"
            max={100}
            min={0}
            onValueChange={(values) => handleRatioChange(values[0])}
            step={10}
            value={[stock.ratio]}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StockCard);
