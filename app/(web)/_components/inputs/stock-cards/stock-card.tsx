'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ko } from 'date-fns/locale';
import dayjs from 'dayjs';
import { CalendarIcon, Search, X } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, exchangeRateCodes } from '@/lib/utils';
import type { FormValues } from '@/types';

export interface StockCardProps {
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
  const isEnabled = stock.enabled;
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
        const error = await response.json();
        throw error;
      }
      const data = await response.json();
      return (data.quotes || []) as StockQuote[];
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 1,
    staleTime: 1000 * 60, // 1분
    retry: false,
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
    <Card className={cn('stock-card', !isEnabled && 'is-disabled')}>
      {isLoadingQuote && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.25rem] bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-gray-300 border-t-gray-600" />
            <span className="text-sm text-muted-foreground">종목 정보 불러오는 중...</span>
          </div>
        </div>
      )}

      <div className="stock-card-topbar">
        <div className="stock-card-ident">
          <div className="min-w-0">
            <span className="stock-card-label">POSITION</span>
            <strong className="stock-card-name">{stock.ticker || '새 종목 추가'}</strong>
          </div>
        </div>
        <div className="stock-card-actions">
          <span>사용</span>
          <Switch
            checked={isEnabled}
            className="stock-toggle"
            onCheckedChange={(checked) => {
              onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, enabled: checked } : s)));
            }}
          />
          {onDelete && (
            <Button
              aria-label={`${stock.ticker || '종목'} 삭제`}
              className="delete-stock-button"
              onClick={onDelete}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X size={15} />
            </Button>
          )}
        </div>
      </div>

      <CardHeader className="stock-card-header px-4! sm:px-[1.35rem]!">
        <div className="stock-search-block">
          <div className="field-label-row">
            <div>
              <span className="field-title">종목 검색</span>
              <span className="stock-search-hint">티커 또는 이름으로 검색해 시세를 불러오세요.</span>
            </div>
          </div>
          <div className="stock-search-wrap" ref={dropdownRef}>
            <div className="stock-search-input-shell">
              <Input
                aria-label="종목 검색"
                className="stock-search-input"
                disabled={!isEnabled}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="예: SCHD, 삼성전자"
                type="search"
                value={searchQuery}
              />
              {isSearching ? (
                <div className="stock-search-spinner">
                  <div className="animate-spin h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600" />
                </div>
              ) : (
                <Search aria-hidden="true" className="stock-search-icon" size={16} />
              )}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map((quote, idx) => (
                  <button
                    className={cn('search-result', idx === selectedIndex && 'is-selected')}
                    key={quote.symbol}
                    onClick={() => handleStockSelect(quote)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="search-result-symbol">{quote.symbol}</div>
                        <div className="search-result-name truncate">{quote.shortname}</div>
                      </div>
                      <div className="search-result-exchange">{quote.exchange}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stock-meta-grid">
          <div className="field-group">
            <span className="field-label">통화</span>
            <Controller
              control={control}
              name="exchangeRates"
              render={({ field: { value: exchangeRates } }) => (
                <Select
                  disabled={!isEnabled}
                  onValueChange={(newCurrency: any) => {
                    onChangeStocks(
                      stocks.map((s, i) => {
                        if (i !== index) {
                          return s;
                        }

                        const oldCurrency = s.currency;
                        const currentPrice = s.price;
                        let newPrice = currentPrice;

                        // 통화 변경 시 주가 환산
                        if (oldCurrency !== newCurrency && currentPrice > 0 && exchangeRates) {
                          const oldRate = exchangeRates[oldCurrency as keyof typeof exchangeRates];
                          const newRate = exchangeRates[newCurrency as keyof typeof exchangeRates];

                          if (oldCurrency === 'KRW' && newRate && newRate > 0) {
                            // KRW -> 외화
                            newPrice = currentPrice / newRate;
                          } else if (newCurrency === 'KRW' && oldRate && oldRate > 0) {
                            // 외화 -> KRW
                            newPrice = currentPrice * oldRate;
                          } else if (oldRate && oldRate > 0 && newRate && newRate > 0) {
                            // 외화 -> 외화 (KRW를 거쳐서 환산)
                            newPrice = (currentPrice * oldRate) / newRate;
                          }
                          newPrice = Math.round(newPrice * 100) / 100;
                        }

                        return {
                          ...s,
                          currency: newCurrency,
                          price: newPrice,
                        };
                      }),
                    );
                  }}
                  value={stock.currency}
                >
                  <SelectTrigger className="stock-select">
                    <SelectValue placeholder="통화" />
                  </SelectTrigger>
                  <SelectContent>
                    {exchangeRateCodes.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor={`stock-name-${index}`}>종목명</label>
            <Input
              className="stock-meta-input"
              disabled={!isEnabled}
              id={`stock-name-${index}`}
              onChange={(e) => {
                onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, name: e.target.value } : s)));
              }}
              placeholder="종목명"
              type="text"
              value={stock.name}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor={`stock-price-${index}`}>현재 가격 ({stock.currency})</label>
            <Input
              aria-label="현재 가격"
              className="stock-meta-input"
              disabled={!isEnabled}
              id={`stock-price-${index}`}
              min={0}
              onChange={(e) => {
                onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, price: parseFloat(e.target.value) || 0 } : s)));
              }}
              placeholder="가격"
              step="any"
              type="number"
              value={stock.price || ''}
            />
          </div>
        </div>

        <div className="stock-date-row">
          <div className="field-label-row">
            <span className="field-label">매수일</span>
            <span className="field-help">수익 차트의 기준일</span>
          </div>
          <div className="date-controls">
            <Popover>
              <PopoverTrigger asChild disabled={!isEnabled}>
                <Button
                  className={cn('date-picker-button', !stock.purchaseDate && 'is-empty')}
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {stock.purchaseDate ? stock.purchaseDate.format('YYYY년 M월 D일') : <span>날짜를 선택하세요</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <Calendar
                  autoFocus
                  captionLayout="dropdown"
                  defaultMonth={stock.purchaseDate ? stock.purchaseDate.toDate() : undefined}
                  locale={ko}
                  mode="single"
                  onSelect={(date) => {
                    onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, purchaseDate: date ? dayjs(date) : undefined } : s)));
                  }}
                  selected={stock.purchaseDate ? stock.purchaseDate.toDate() : undefined}
                />
              </PopoverContent>
            </Popover>
            <div className="date-presets">
              {[
                { label: '1년 전', months: 12 },
                { label: '6개월 전', months: 6 },
                { label: '3개월 전', months: 3 },
                { label: '1개월 전', months: 1 },
              ].map(({ label, months }) => (
                <Button
                  className="date-preset"
                  disabled={!isEnabled}
                  key={label}
                  onClick={() => {
                    onChangeStocks(stocks.map((s, i) => (i === index ? ({ ...s, purchaseDate: dayjs().subtract(months, 'month') }) : s)));
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {label}
                </Button>
              ))}
              <Button
                className="date-preset"
                disabled={!isEnabled || !stock.purchaseDate}
                onClick={() => {
                  onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, purchaseDate: undefined } : s)));
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                초기화
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="stock-card-content px-4! sm:px-[1.35rem]!">
        <div className="stock-control-block">
          <div className="stock-control-head">
            <div>
              <span className="field-title">배당 지급 월</span>
              <span className="field-caption">배당이 들어오는 달을 선택하세요.</span>
            </div>
            <div className="calendar-presets">
              <Button
                className="date-preset"
                disabled={!isEnabled}
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
                size="sm"
                type="button"
                variant="outline"
              >
                월별
              </Button>
              <Button
                className="date-preset"
                disabled={!isEnabled}
                onClick={() => {
                  // 분기별: 3, 6, 9, 12월 선택
                  onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, dividendMonths: [3, 6, 9, 12] } : s)));
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                분기별
              </Button>
            </div>
          </div>
          <div className="months-grid">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const isSelected = dividendMonths.includes(month);
              return (
                <Button
                  className={cn('month-button', isSelected && 'is-selected')}
                  disabled={!isEnabled}
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

        <div className="stock-metric-grid">
          <div className="metric-control">
            <label className="metric-label" htmlFor={`stock-yield-${index}`}>연 배당률</label>
            <div className="metric-input-wrap">
              <Input
                className="metric-input"
                disabled={!isEnabled}
                id={`stock-yield-${index}`}
                min={0}
                onChange={(e) => {
                  onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, yield: +e.target.value } : s)));
                }}
                placeholder="3.00"
                step="any"
                type="number"
                value={stock.yield || ''}
              />
              <span className="metric-unit">%</span>
            </div>
          </div>

          <div className="metric-control">
            <div className="field-label-row">
              <label className="metric-label" htmlFor={`stock-ratio-${index}`}>포트폴리오 비중</label>
              <span className="field-help">합계 100%</span>
            </div>
            <div className="ratio-layout">
              <div className="ratio-input-wrap">
                <Input
                  aria-label="포트폴리오 비중"
                  className="metric-input ratio-input"
                  disabled={!isEnabled}
                  id={`stock-ratio-${index}`}
                  max={100}
                  min={0}
                  onChange={(e) => {
                    onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, ratio: parseFloat(e.target.value) || 0 } : s)));
                  }}
                  placeholder="비율"
                  step={1}
                  type="number"
                  value={stock.ratio.toFixed(0) || 0}
                />
                <span className="metric-unit">%</span>
              </div>
              <Slider
                className="ratio-slider"
                disabled={!isEnabled}
                max={100}
                min={0}
                onValueChange={([value]) => {
                  onChangeStocks(stocks.map((s, i) => (i === index ? { ...s, ratio: value } : s)));
                }}
                step={1}
                value={[stock.ratio || 0]}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StockCard);
