'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ko } from 'date-fns/locale';
import dayjs from 'dayjs';
import { CalendarIcon, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useController } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import type { FormValues } from '@/types';

interface StockCardProps {
  control: Control<FormValues>;
  index: number;
  onDelete?(): void;
}

interface StockQuote {
  symbol: string;
  shortname: string;
  exchange: string;
}

const StockCard = ({ control, index, onDelete }: StockCardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { field: { value: stocks, onChange: onChangeStocks } } = useController({
    control,
    name: 'stocks',
  });
  const stock = stocks[index];
  const dividendMonths = stock.dividendMonths || [];

  // 검색어 debouncing
  const debouncedQuery = useDebounce(searchQuery, 300);

  // debounced query 변경 시 dropdown 상태 업데이트
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else {
      setShowDropdown(true);
      setSelectedIndex(-1);
    }
  }, [debouncedQuery]);

  /** 종목 검색 */
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['stockSearch', debouncedQuery] as const,
    async queryFn({ queryKey: [, query] }) {
      const response = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search stocks');
      }
      const data = await response.json();
      return (data.quotes || []) as StockQuote[];
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 1,
    staleTime: 1000 * 60, // 1분
  });

  /** 종목 상세 정보 조회 */
  const { mutate: fetchStockQuote, isPending: isLoadingQuote } = useMutation({
    async mutationFn(quote: StockQuote) {
      const response = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(quote.symbol)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock quote');
      }
      return response.json();
    },
    onSuccess(data, quote) {
      if (data && !data.error) {
        onChangeStocks(
          stocks.map((s, i) => {
            if (i !== index) {
              return s;
            }

            const defaultStock = {
              ...s,
              ticker: quote.symbol,
              name: quote.shortname,
              price: data.price,
              currency: data.currency,
              yield: data.yield,
            };

            if (data.dividendMonths && data.dividendMonths.length > 0) {
              return {
                ...defaultStock,
                dividendMonths: data.dividendMonths,
              };
            }

            return defaultStock;
          }),
        );
      } else {
        onChangeStocks(
          stocks.map((s, i) => {
            if (i === index) {
              return {
                ...s,
                ticker: quote.symbol,
                name: quote.shortname,
              };
            }

            return s;
          }),
        );
      }
    },
    onError(error, quote) {
      console.error('Failed to fetch stock quote:', error);
      onChangeStocks(
        stocks.map((s, i) => {
          if (i === index) {
            return {
              ...s,
              ticker: quote.symbol,
              name: quote.shortname,
            };
          }

          return s;
        }),
      );
    },
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

  const handleStockSelect = (quote: StockQuote) => {
    setSearchQuery(''); // 검색 재실행 방지
    setShowDropdown(false);
    setSelectedIndex(-1);

    // 종목 상세 정보 가져오기
    fetchStockQuote(quote);
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
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <span className="text-xs md:text-sm font-medium whitespace-nowrap">통화</span>
          <Controller
            control={control}
            name="exchangeRate"
            render={({ field: { value: exchangeRate } }) => (
              <Select
                onValueChange={(newCurrency) => {
                  const oldCurrency = stock.currency;
                  const currentPrice = stock.price;

                  if (oldCurrency !== newCurrency && exchangeRate > 0) {
                    // 주가 환산
                    if (currentPrice > 0) {
                      let newPrice = currentPrice;
                      if (oldCurrency === 'KRW' && newCurrency === 'USD') {
                        newPrice = currentPrice / exchangeRate;
                      } else if (oldCurrency === 'USD' && newCurrency === 'KRW') {
                        newPrice = currentPrice * exchangeRate;
                      }
                      onChangeStocks(
                        stocks.map((s, i) => (i === index ? {
                          ...s,
                          price: Math.round(newPrice * 100) / 100,
                        } : s)),
                      );
                    }
                  }

                  onChangeStocks(
                    stocks.map((s, i) => (i === index ? {
                      ...s,
                      currency: newCurrency,
                    } : s)),
                  );
                }}
                value={stock.currency}
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
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <span className="text-xs md:text-sm font-medium whitespace-nowrap">종목명</span>
          <Input
            className="flex-1"
            onChange={(e) => {
              onChangeStocks(
                stocks.map((s, i) => (i === index ? {
                  ...s,
                  name: e.target.value,
                } : s)),
              );
            }}
            placeholder="종목명"
            type="text"
            value={stock.name}
          />
          <span className="text-xs md:text-sm font-medium whitespace-nowrap">가격</span>
          <Input
            className="flex-1"
            onChange={(e) => {
              onChangeStocks(
                stocks.map((s, i) => (i === index ? {
                  ...s,
                  price: parseFloat(e.target.value) || 0,
                } : s)),
              );
            }}
            placeholder="가격"
            step="any"
            type="number"
            value={stock.price || ''}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-xs md:text-sm font-medium whitespace-nowrap">매수일</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    'flex-1 justify-start text-left font-normal',
                    !stock.purchaseDate && 'text-muted-foreground',
                  )}
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {stock.purchaseDate ? stock.purchaseDate.format('YYYY년 M월 D일') : <span>날짜를 선택하세요</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  autoFocus
                  locale={ko}
                  mode="single"
                  onSelect={(date) => {
                    onChangeStocks(
                      stocks.map((s, i) => (i === index ? {
                        ...s,
                        purchaseDate: date ? dayjs(date) : undefined,
                      } : s)),
                    );
                  }}
                  selected={stock.purchaseDate ? stock.purchaseDate.toDate() : undefined}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-1 md:ml-[100px]">
            {[
              { label: '1년 전', months: 12 },
              { label: '6개월 전', months: 6 },
              { label: '3개월 전', months: 3 },
              { label: '1개월 전', months: 1 },
            ].map(({ label, months }) => (
              <Button
                className="h-7 text-xs"
                key={label}
                onClick={() => {
                  onChangeStocks(
                    stocks.map((s, i) => (i === index ? ({
                      ...s,
                      purchaseDate: dayjs().subtract(months, 'month'),
                    }) : s)),
                  );
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-2 md:p-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-xs md:text-sm font-medium whitespace-nowrap">배당 지급 월</span>
            <div className="flex gap-2">
              <Button
                className="h-7 text-xs"
                onClick={() => {
                  // 월별: 모든 월 선택 (1~12)
                  onChangeStocks(
                    stocks.map((s, i) => (i === index ? {
                      ...s,
                      dividendMonths: [
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                      ],
                    } : s)),
                  );
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
                  onChangeStocks(
                    stocks.map((s, i) => (i === index ? {
                      ...s,
                      dividendMonths: [3, 6, 9, 12],
                    } : s)),
                  );
                }}
                type="button"
                variant="outline"
              >
                분기별
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const isSelected = dividendMonths.includes(month);
              return (
                <Button
                  className={`h-8 text-xs ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  key={month}
                  onClick={() => {
                    onChangeStocks(
                      stocks.map((s, i) => {
                        if (index !== i) {
                          return s;
                        }

                        if (isSelected) {
                          return {
                            ...s,
                            dividendMonths: s.dividendMonths.filter((m) => m !== month),
                          };
                        }

                        return {
                          ...s,
                          dividendMonths: [...s.dividendMonths, month].sort((a, b) => a - b),
                        };
                      }),
                    );
                  }}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                >
                  {month}월
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <label className="text-xs md:text-sm font-medium whitespace-nowrap">연 배당률</label>
          <div className="flex items-center gap-2 flex-1 md:max-w-[180px]">
            <Input
              className="flex-1"
              onChange={(e) => {
                onChangeStocks(
                  stocks.map((s, i) => (i === index ? {
                    ...s,
                    yield: +e.target.value,
                  } : s)),
                );
              }}
              placeholder="3.00"
              step="any"
              type="number"
              value={stock.yield || ''}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div className="flex md:flex-row flex-col md:items-center items-start gap-2">
          <label className="text-xs md:text-sm font-medium whitespace-nowrap">비율</label>
          <div className="flex items-center gap-2 w-full md:w-[100px] mb-3 md:mb-0">
            <Input
              className="w-full md:w-[100px]"
              max={100}
              min={0}
              onChange={(e) => {
                onChangeStocks(stocks.map((s, i) => (i === index ? {
                  ...s,
                  ratio: parseFloat(e.target.value) || 0,
                } : s)));
              }}
              placeholder="비율"
              step={1}
              type="number"
              value={stock.ratio.toFixed(0) || 0}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Slider
            className="flex-1 md:max-w-[500px]"
            max={100}
            min={0}
            onValueChange={([value]) => {
              const newStocks = stocks.map((s, i) => (i === index ? {
                ...s,
                ratio: value,
              } : s));
              onChangeStocks(newStocks);
            }}
            step={1}
            value={[stock.ratio || 0]}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StockCard);
