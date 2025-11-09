import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import type { Control, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { FormValues } from '@/types';

interface StockCardProps {
  control: Control<FormValues>;
  index: number;
  getValues: UseFormGetValues<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  register: UseFormRegister<FormValues>;
  onDelete?(): void;
}

interface StockQuote {
  symbol: string;
  shortname: string;
  exchange: string;
}

const StockCard = ({ control, index, getValues, setValue, register, onDelete }: StockCardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 검색어 debouncing
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) {
      setDebouncedQuery('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else {
      const delayTimer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        setShowDropdown(true);
        setSelectedIndex(-1);
      }, 300);

      return () => {
        clearTimeout(delayTimer);
      };
    }
  }, [searchQuery]);

  /** 종목 검색 */
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['stockSearch', debouncedQuery],
    async queryFn() {
      const response = await fetch(`/api/stock/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search stocks');
      }
      const data = await response.json();
      return (data.quotes || []) as StockQuote[];
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 1,
    staleTime: 1000 * 60, // 1분
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStockSelect = async (quote: StockQuote) => {
    setValue(`stocks.${index}.ticker`, quote.symbol);
    setValue(`stocks.${index}.name`, quote.shortname);
    setDebouncedQuery(''); // 검색 재실행 방지
    setShowDropdown(false);
    setSelectedIndex(-1);

    // 종목 상세 정보 가져오기
    setIsLoadingQuote(true);
    try {
      const response = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(quote.symbol)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock quote');
      }
      const data = await response.json();

      if (data && !data.error) {
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
    <Card className="gap-0 p-2 md:p-4 relative">
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
      <CardHeader className="mt-4 p-2 md:p-4">
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
          <label className="text-sm font-medium whitespace-nowrap">통화</label>
          <Controller
            control={control}
            name={`stocks.${index}.currency`}
            render={({ field }) => (
              <Select
                onValueChange={(newCurrency) => {
                  const oldCurrency = field.value;
                  const currentPrice = getValues(`stocks.${index}.price`);
                  const currentDividend = getValues(`stocks.${index}.dividend`);
                  const exchangeRate = getValues('exchangeRate');

                  if (oldCurrency !== newCurrency && exchangeRate > 0) {
                    // 주가 환산
                    if (currentPrice > 0) {
                      let newPrice = currentPrice;
                      if (oldCurrency === 'KRW' && newCurrency === 'USD') {
                        newPrice = currentPrice / exchangeRate;
                      } else if (oldCurrency === 'USD' && newCurrency === 'KRW') {
                        newPrice = currentPrice * exchangeRate;
                      }
                      setValue(`stocks.${index}.price`, Math.round(newPrice * 100) / 100);
                    }

                    // 배당금 환산
                    if (currentDividend > 0) {
                      let newDividend = currentDividend;
                      if (oldCurrency === 'KRW' && newCurrency === 'USD') {
                        newDividend = currentDividend / exchangeRate;
                      } else if (oldCurrency === 'USD' && newCurrency === 'KRW') {
                        newDividend = currentDividend * exchangeRate;
                      }
                      setValue(`stocks.${index}.dividend`, Math.round(newDividend * 100) / 100);
                    }
                  }

                  // currency와 dividendCurrency를 동시에 변경
                  field.onChange(newCurrency);
                  setValue(`stocks.${index}.dividendCurrency`, newCurrency);
                }}
                value={field.value}
              >
                <SelectTrigger className="md:w-24 w-full">
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
        <div className="flex flex-col md:flex-row items-center gap-2">
          <Input
            className="flex-1"
            placeholder="종목명"
            type="text"
            {...register(`stocks.${index}.name`)}
          />
          <Controller
            control={control}
            name={`stocks.${index}.price`}
            render={({ field }) => (
              <Input
                {...field}
                className="flex-1"
                onChange={(e) => {
                  const priceValue = parseFloat(e.target.value) || 0;
                  field.onChange(priceValue);

                  // 배당률 모드일 때 주당 배당금 자동 업데이트
                  const dividendInputType = getValues(`stocks.${index}.dividendInputType`);
                  if (dividendInputType === 'yield') {
                    const yieldValue = getValues(`stocks.${index}.yield`);
                    if (yieldValue > 0 && priceValue > 0) {
                      const dividendValue = (priceValue * yieldValue) / 100;
                      setValue(`stocks.${index}.dividend`, Math.round(dividendValue * 100) / 100);
                    }
                  }
                }}
                placeholder="가격"
                step="any"
                type="number"
                value={field.value || ''}
              />
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">매수일</label>
          <Controller
            control={control}
            name={`stocks.${index}.purchaseDate`}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(new Date(field.value), 'PPP', { locale: ko })
                    ) : (
                      <span>날짜를 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    initialFocus
                    locale={ko}
                    mode="single"
                    onSelect={field.onChange}
                    selected={field.value ? new Date(field.value) : undefined}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-2 md:p-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
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
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name={`stocks.${index}.dividendInputType`}
            render={({ field }) => (
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // 입력 방식 변경 시 기존 값 초기화
                  if (value === 'yield') {
                    // 배당률로 변경 시, 주당 배당금이 있으면 배당률 계산
                    const currentDividend = getValues(`stocks.${index}.dividend`);
                    const currentPrice = getValues(`stocks.${index}.price`);
                    if (currentDividend > 0 && currentPrice > 0) {
                      const yieldValue = (currentDividend / currentPrice) * 100;
                      setValue(`stocks.${index}.yield`, Math.round(yieldValue * 100) / 100);
                    }
                  } else {
                    // 주당 배당금으로 변경 시, 배당률이 있으면 주당 배당금 계산
                    const currentYield = getValues(`stocks.${index}.yield`);
                    const currentPrice = getValues(`stocks.${index}.price`);
                    if (currentYield > 0 && currentPrice > 0) {
                      const dividendValue = (currentPrice * currentYield) / 100;
                      setValue(`stocks.${index}.dividend`, Math.round(dividendValue * 100) / 100);
                    }
                  }
                }}
                value={field.value || 'amount'}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="입력 방식" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">주당 배당금</SelectItem>
                  <SelectItem value="yield">배당률</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <Controller
            control={control}
            name={`stocks.${index}.dividendInputType`}
            render={({ field: typeField }) => {
              const inputType = typeField.value || 'amount';

              if (inputType === 'yield') {
                return (
                  <div className="flex items-center gap-2 flex-1 md:max-w-[180px]">
                    <Input
                      className="flex-1"
                      onChange={(e) => {
                        const yieldValue = parseFloat(e.target.value) || 0;
                        setValue(`stocks.${index}.yield`, yieldValue);

                        // 배당률 입력 시 주당 배당금 자동 계산
                        const currentPrice = getValues(`stocks.${index}.price`);
                        if (currentPrice > 0) {
                          const dividendValue = (currentPrice * yieldValue) / 100;
                          setValue(`stocks.${index}.dividend`, Math.round(dividendValue * 100) / 100);
                        }
                      }}
                      placeholder="배당률"
                      step="any"
                      type="number"
                      value={getValues(`stocks.${index}.yield`) || ''}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                );
              }

              return (
                <Input
                  className="flex-1 md:max-w-[180px]"
                  placeholder="주당 배당금"
                  step="any"
                  type="number"
                  {...register(`stocks.${index}.dividend`, { valueAsNumber: true })}
                />
              );
            }}
          />
        </div>
        <div className="flex md:flex-row flex-col md:items-center items-start gap-2">
          <label className="text-xs md:text-sm font-medium whitespace-nowrap">비율</label>
          <div className="flex items-center gap-2 w-full md:w-[100px] mb-3 md:mb-0">
            <Controller
              control={control}
              name={`stocks.${index}.ratio`}
              render={({ field }) => (
                <Input
                  {...field}
                  className="w-full md:w-[100px]"
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
          </div>
          <Controller
            control={control}
            name={`stocks.${index}.ratio`}
            render={({ field }) => (
              <Slider
                className="flex-1 md:max-w-[500px]"
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
