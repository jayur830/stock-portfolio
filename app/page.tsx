'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import StockCard from '@/components/domain/stock-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Stock {
  /** 종목명 */
  name: string;
  /** 종목코드 */
  ticker: string;
  /** 주가 */
  price: number;
  /** 통화 */
  currency: string;
  /** 주당 배당금 */
  dividend: number;
  /** 배당통화 */
  dividendCurrency: string;
  /** 배당 지급 월 */
  dividendMonths: number[];
  /** 배당률 */
  yield: number;
  /** 비율 */
  ratio: number;
}

interface FormValues {
  /** 총 투자금 */
  totalInvestment: number;
  /** 목표 연 배당금 */
  targetAnnualDividend: number;
  /** 환율 */
  exchangeRate: number;
  /** 종목 */
  stocks: Stock[];
}

export default function Page() {
  const { control, getValues, handleSubmit, register, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      totalInvestment: 0,
      targetAnnualDividend: 0,
      exchangeRate: 0,
      stocks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stocks',
  });

  const watchedStocks = watch('stocks');
  const totalRatio = watchedStocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
  const [activeTab, setActiveTab] = useState<'dividend' | 'investment'>('dividend');
  const [annualDividend, setAnnualDividend] = useState<number | null>(null);
  const [requiredInvestment, setRequiredInvestment] = useState<number | null>(null);
  const [monthlyDividends, setMonthlyDividends] = useState<number[]>(Array(12).fill(0));
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);

  const fetchExchangeRate = async () => {
    setIsLoadingExchangeRate(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const krwRate = data.rates.KRW;
      setValue('exchangeRate', krwRate);
    } catch (error) {
      console.error('환율 조회 실패:', error);
      alert('환율 조회에 실패했습니다.');
    } finally {
      setIsLoadingExchangeRate(false);
    }
  };

  // 페이지 진입 시 환율 자동 조회
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  /** 금액을 KRW로 환산 */
  const convertToKRW = (amount: number, currency: string, exchangeRate: number): number => {
    return currency === 'USD' ? amount * exchangeRate : amount;
  };

  /** 단일 종목의 연 배당금 계산 */
  const calculateStockAnnualDividend = (
    stock: Stock,
    investmentAmount: number,
    exchangeRate: number,
  ): number => {
    const priceInKRW = convertToKRW(stock.price, stock.currency, exchangeRate);
    const dividendInKRW = convertToKRW(stock.dividend, stock.dividendCurrency, exchangeRate);
    const shares = investmentAmount / priceInKRW;
    return shares * dividendInKRW;
  };

  /** 단일 종목의 월별 배당금 계산 */
  const calculateStockMonthlyDividends = (
    stock: Stock,
    annualDividend: number,
  ): Record<number, number> => {
    if (!stock.dividendMonths || stock.dividendMonths.length === 0) {
      return {};
    }

    return stock.dividendMonths.reduce((acc, month) => {
      acc[month] = (annualDividend / stock.dividendMonths.length) * (1 - 0.154);
      return acc;
    }, {} as Record<number, number>);
  };

  // 배당률 계산
  const calculateDividendYield = (stock: Stock, exchangeRate: number): number => {
    const priceInKRW = convertToKRW(stock.price, stock.currency, exchangeRate);
    const dividendInKRW = convertToKRW(stock.dividend, stock.dividendCurrency, exchangeRate);
    return dividendInKRW / priceInKRW;
  };

  // 월별 배당금 배열 생성
  const mergeMonthlyDividends = (
    stockDividends: Array<{ monthlyDividends: Record<number, number> }>,
  ): number[] => {
    return stockDividends.reduce((acc, { monthlyDividends }) => {
      Object.entries(monthlyDividends).forEach(([month, amount]) => {
        acc[Number(month) - 1] += amount;
      });
      return acc;
    }, Array(12).fill(0) as number[]);
  };

  // 폼 데이터 검증
  const validateFormData = (data: FormValues): string | null => {
    const currentTotalRatio = data.stocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
    if (Math.abs(currentTotalRatio - 100) > 0.1) {
      return '총 비율이 100%가 되어야 합니다.';
    }

    if (activeTab === 'dividend' && data.totalInvestment <= 0) {
      return '총 투자금을 입력해주세요.';
    }

    if (activeTab === 'investment' && data.targetAnnualDividend <= 0) {
      return '목표 연 배당금을 입력해주세요.';
    }

    const hasUsdStock = data.stocks.some(
      (stock) => stock.currency === 'USD' || stock.dividendCurrency === 'USD',
    );
    if (hasUsdStock && (!data.exchangeRate || data.exchangeRate <= 0)) {
      return 'USD 항목이 있습니다. 환율을 먼저 조회해주세요.';
    }

    return null;
  };

  // 배당금 계산: 투자금 → 배당금
  const calculateDividendFromInvestment = (data: FormValues) => {
    const stockDividends = data.stocks.map((stock) => {
      const investmentAmount = (data.totalInvestment * stock.ratio) / 100;
      const annualDividend = calculateStockAnnualDividend(stock, investmentAmount, data.exchangeRate);
      const monthlyDividends = calculateStockMonthlyDividends(stock, annualDividend);
      return { annualDividend,
        monthlyDividends };
    });

    const totalAnnualDividend = stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0);
    const monthlyDividendArray = mergeMonthlyDividends(stockDividends);

    setAnnualDividend(totalAnnualDividend);
    setMonthlyDividends(monthlyDividendArray);
    setRequiredInvestment(null);
  };

  // 투자금 계산: 목표 배당금 → 필요한 투자금
  const calculateInvestmentFromDividend = (data: FormValues) => {
    const weightedDividendYield = data.stocks.reduce((sum, stock) => {
      const dividendYield = calculateDividendYield(stock, data.exchangeRate);
      return sum + dividendYield * (stock.ratio / 100);
    }, 0);

    const requiredInvestmentAmount = data.targetAnnualDividend / weightedDividendYield;

    const stockDividends = data.stocks.map((stock) => {
      const investmentAmount = (requiredInvestmentAmount * stock.ratio) / 100;
      const annualDividend = calculateStockAnnualDividend(stock, investmentAmount, data.exchangeRate);
      const monthlyDividends = calculateStockMonthlyDividends(stock, annualDividend);
      return { monthlyDividends };
    });

    const monthlyDividendArray = mergeMonthlyDividends(stockDividends);

    setRequiredInvestment(requiredInvestmentAmount);
    setMonthlyDividends(monthlyDividendArray);
    setAnnualDividend(null);
  };

  const onSubmit = (data: FormValues) => {
    const error = validateFormData(data);
    if (error) {
      alert(error);
      return;
    }

    if (activeTab === 'dividend') {
      calculateDividendFromInvestment(data);
    } else {
      calculateInvestmentFromDividend(data);
    }
  };

  return (
    <main className="flex flex-col gap-3.5 p-4">
      <div className="flex items-center gap-4">
        <Tabs className="flex-1" onValueChange={(value) => setActiveTab(value as 'dividend' | 'investment')} value={activeTab}>
          <TabsList>
            <TabsTrigger value="dividend">배당금 계산</TabsTrigger>
            <TabsTrigger value="investment">투자금 계산</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            disabled={isLoadingExchangeRate}
            onClick={fetchExchangeRate}
            size="sm"
            type="button"
            variant="outline"
          >
            {isLoadingExchangeRate ? '조회 중...' : '환율 조회'}
          </Button>
          <Input
            className="w-32"
            placeholder="환율"
            type="number"
            {...register('exchangeRate', { valueAsNumber: true })}
          />
        </div>
      </div>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
        {activeTab === 'dividend' ? (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <label className="text-sm font-medium whitespace-nowrap">총 투자금</label>
            <Input
              className="flex-1"
              maxLength={24}
              placeholder="총 투자금을 입력하세요"
              type="number"
              {...register('totalInvestment', { valueAsNumber: true })}
            />
            <span className="text-sm text-muted-foreground">원</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <label className="text-sm font-medium whitespace-nowrap">목표 연 배당금 (세전)</label>
            <Input
              className="flex-1"
              maxLength={24}
              placeholder="목표 연 배당금을 입력하세요"
              type="number"
              {...register('targetAnnualDividend', { valueAsNumber: true })}
            />
            <span className="text-sm text-muted-foreground">원</span>
          </div>
        )}
        {fields.map((field, index) => (
          <StockCard
            control={control}
            getValues={getValues}
            index={index}
            key={field.id}
            onDelete={() => remove(index)}
            setValue={setValue}
          />
        ))}
        <Button
          className="border-dashed"
          onClick={() => {
            const newStock = {
              name: '',
              ticker: '',
              price: 0,
              currency: 'KRW',
              dividend: 0,
              dividendCurrency: 'KRW',
              dividendMonths: [],
              yield: 0,
              ratio: 0,
            };

            const currentStocks = getValues('stocks');
            const newList = [...currentStocks, newStock];

            // 모든 종목을 균등하게 재분배
            const equalRatio = 100 / newList.length;
            const redistributedList = newList.map((stock) => ({
              ...stock,
              ratio: equalRatio,
            }));

            // 기존 stocks의 ratio만 업데이트하고 새 종목 추가
            currentStocks.forEach((_, idx) => {
              setValue(`stocks.${idx}.ratio`, redistributedList[idx].ratio);
            });
            append(redistributedList[redistributedList.length - 1]);
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
            <Button disabled={Math.abs(totalRatio - 100) > 0.1} type="submit">
              계산
            </Button>
            <Button
              onClick={() => {
                reset();
                setAnnualDividend(null);
                setRequiredInvestment(null);
                setMonthlyDividends(Array(12).fill(0));
              }}
              type="button"
              variant="outline"
            >
              초기화
            </Button>
          </div>
          {annualDividend !== null && (
            <>
              <div className="flex justify-center items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700">세전 연 배당금:</span>
                  <span className="text-lg font-bold text-green-700">
                    {annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </span>
                </div>
                <div className="h-6 w-px bg-green-300" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700">세후 연 배당금:</span>
                  <span className="text-lg font-bold text-green-700">
                    {(annualDividend * (1 - 0.154)).toLocaleString('ko-KR', {
                      maximumFractionDigits: 0,
                    })}원
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900">월별 배당금 (세후)</h3>
                <div className="grid grid-cols-6 gap-2">
                  {monthlyDividends.map((amount, index) => (
                    <div
                      className="flex flex-col items-center p-2 bg-white rounded border border-blue-100"
                      key={index}
                    >
                      <span className="text-xs text-blue-600 font-medium">{index + 1}월</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {amount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {requiredInvestment !== null && (
            <>
              <div className="flex justify-center items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-700">필요한 투자금:</span>
                  <span className="text-lg font-bold text-purple-700">
                    {requiredInvestment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900">월별 배당금 (세후)</h3>
                <div className="grid grid-cols-6 gap-2">
                  {monthlyDividends.map((amount, index) => (
                    <div
                      className="flex flex-col items-center p-2 bg-white rounded border border-blue-100"
                      key={index}
                    >
                      <span className="text-xs text-blue-600 font-medium">{index + 1}월</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {amount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
