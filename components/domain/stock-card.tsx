import { X } from 'lucide-react';
import { memo } from 'react';
import { Control, Controller } from 'react-hook-form';

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

interface FormValues {
  totalInvestment: number;
  stocks: Array<{
    name: string;
    ticker: string;
    price: number;
    dividend: number;
    dividendFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
    yield: number;
    ratio: number;
  }>;
}

interface StockCardProps {
  control: Control<FormValues>;
  index: number;
  onDelete?: () => void;
}

const StockCard = ({ control, index, onDelete }: StockCardProps) => {
  return (
    <Card className="p-4 relative">
      {onDelete && (
        <Button
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDelete}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <CardHeader>
        <Controller
          control={control}
          name={`stocks.${index}.ticker`}
          render={({ field }) => (
            <Input
              {...field}
              className="flex-1"
              placeholder="종목검색"
              type="search"
            />
          )}
        />
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name={`stocks.${index}.name`}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="종목명"
                type="text"
              />
            )}
          />
          <Controller
            control={control}
            name={`stocks.${index}.price`}
            render={({ field }) => (
              <Input
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                placeholder="가격"
                type="number"
                value={field.value}
              />
            )}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Controller
            control={control}
            name={`stocks.${index}.dividendFrequency`}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
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
            )}
          />
          <div className="flex items-center gap-2 pl-6">
            <span className="text-sm text-muted-foreground">연</span>
            <Controller
              control={control}
              name={`stocks.${index}.yield`}
              render={({ field }) => (
                <Input
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  placeholder="배당률"
                  type="number"
                  value={field.value}
                />
              )}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">비율</label>
          <Controller
            control={control}
            name={`stocks.${index}.ratio`}
            render={({ field }) => (
              <Input
                {...field}
                className="w-[100px]"
                max={100}
                min={0}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                placeholder="비율"
                step={1}
                type="number"
                value={field.value?.toFixed(0) || 0}
              />
            )}
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Controller
            control={control}
            name={`stocks.${index}.ratio`}
            render={({ field }) => (
              <Slider
                className="flex-1"
                max={100}
                min={0}
                onValueChange={(values) => field.onChange(values[0])}
                step={1}
                value={[field.value || 0]}
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StockCard);
