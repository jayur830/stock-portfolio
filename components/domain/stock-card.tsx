import { X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import type { Control, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { FormValues } from '@/types';

interface StockCardProps {
  control: Control<FormValues>;
  index: number;
  getValues: UseFormGetValues<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  onDelete?: () => void;
}

interface StockQuote {
  symbol: string;
  shortname: string;
  exchange: string;
}

const StockCard = ({ control, index, getValues, setValue, onDelete }: StockCardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    const delayTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/stock-search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.quotes || []);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Failed to search stocks:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [searchQuery]);

  const handleStockSelect = async (quote: StockQuote) => {
    setValue(`stocks.${index}.ticker`, quote.symbol);
    setValue(`stocks.${index}.name`, quote.shortname);
    setSearchQuery(quote.symbol);
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);

    // 종목 상세 정보 가져오기
    setIsLoadingQuote(true);
    try {
      const response = await fetch(`/api/stock-quote?symbol=${encodeURIComponent(quote.symbol)}`);
      const data = await response.json();

      if (response.ok && !data.error) {
        setValue(`stocks.${index}.price`, data.price);
        setValue(`stocks.${index}.currency`, data.currency);
        setValue(`stocks.${index}.dividend`, data.dividend);
        setValue(`stocks.${index}.dividendCurrency`, data.currency);
        if (data.dividendMonths && data.dividendMonths.length > 0) {
          setValue(`stocks.${index}.dividendMonths`, data.dividendMonths);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stock quote:', error);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleStockSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <Card className="p-4 relative">
      {isLoadingQuote && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full" />
            <span className="text-sm text-gray-600">종목 정보 불러오는 중...</span>
          </div>
        </div>
      )}
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
        <div className="relative" ref={dropdownRef}>
          <Input
            className="flex-1"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="종목검색"
            type="search"
            value={searchQuery}
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((quote, idx) => (
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    idx === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  key={quote.symbol}
                  onClick={() => handleStockSelect(quote)}
                  type="button"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{quote.symbol}</div>
                      <div className="text-xs text-gray-600">{quote.shortname}</div>
                    </div>
                    <div className="text-xs text-gray-500">{quote.exchange}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            </div>
          )}
        </div>
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
          <Controller
            control={control}
            name={`stocks.${index}.currency`}
            render={({ field }) => (
              <Select
                onValueChange={(newCurrency) => {
                  const oldCurrency = field.value;
                  const currentPrice = getValues(`stocks.${index}.price`);
                  const exchangeRate = getValues('exchangeRate');

                  if (oldCurrency !== newCurrency && currentPrice > 0 && exchangeRate > 0) {
                    let newPrice = currentPrice;

                    if (oldCurrency === 'KRW' && newCurrency === 'USD') {
                      // KRW → USD
                      newPrice = currentPrice / exchangeRate;
                    } else if (oldCurrency === 'USD' && newCurrency === 'KRW') {
                      // USD → KRW
                      newPrice = currentPrice * exchangeRate;
                    }

                    setValue(`stocks.${index}.price`, Math.round(newPrice * 100) / 100);
                  }

                  field.onChange(newCurrency);
                }}
                value={field.value}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="통화" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW">KRW</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">배당 지급 월</label>
            <Controller
              control={control}
              name={`stocks.${index}.dividendMonths`}
              render={({ field }) => (
                <>
                  <Button
                    className="h-7 text-xs"
                    onClick={() => {
                      // 월별: 모든 월 선택 (1~12)
                      field.onChange([
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                      ]);
                    }}
                    type="button"
                    variant="outline"
                  >
                    월별
                  </Button>
                  <Button
                    className="h-7 text-xs"
                    onClick={() => {
                      // 분기별: 3, 6, 9, 12월 선택
                      field.onChange([3, 6, 9, 12]);
                    }}
                    type="button"
                    variant="outline"
                  >
                    분기별
                  </Button>
                </>
              )}
            />
          </div>
          <Controller
            control={control}
            name={`stocks.${index}.dividendMonths`}
            render={({ field }) => (
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const isSelected = field.value?.includes(month);
                  return (
                    <Button
                      className={`h-8 text-xs ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                      key={month}
                      onClick={() => {
                        const currentMonths = field.value || [];
                        if (isSelected) {
                          field.onChange(currentMonths.filter((m) => m !== month));
                        } else {
                          field.onChange([...currentMonths, month].sort((a, b) => a - b));
                        }
                      }}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                    >
                      {month}월
                    </Button>
                  );
                })}
              </div>
            )}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm w-[120px]">주당 배당금: </span>
            <Controller
              control={control}
              name={`stocks.${index}.dividend`}
              render={({ field }) => (
                <Input
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  placeholder="주당 배당금"
                  type="number"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name={`stocks.${index}.dividendCurrency`}
              render={({ field }) => (
                <Select
                  onValueChange={(newCurrency) => {
                    const oldCurrency = field.value;
                    const currentDividend = getValues(`stocks.${index}.dividend`);
                    const exchangeRate = getValues('exchangeRate');

                    if (oldCurrency !== newCurrency && currentDividend > 0 && exchangeRate > 0) {
                      let newDividend = currentDividend;

                      if (oldCurrency === 'KRW' && newCurrency === 'USD') {
                        // KRW → USD
                        newDividend = currentDividend / exchangeRate;
                      } else if (oldCurrency === 'USD' && newCurrency === 'KRW') {
                        // USD → KRW
                        newDividend = currentDividend * exchangeRate;
                      }

                      setValue(`stocks.${index}.dividend`, Math.round(newDividend * 100) / 100);
                    }

                    field.onChange(newCurrency);
                  }}
                  value={field.value}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="통화" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KRW">KRW</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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

export default memo(StockCard, (prevProps, nextProps) => {
  // index와 onDelete가 같으면 리렌더링 방지 (form 값은 Controller가 관리)
  return prevProps.index === nextProps.index && prevProps.onDelete === nextProps.onDelete;
});
