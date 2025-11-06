'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import StockCard from '@/components/domain/stock-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Stock {
  name: string;
  ticker: string;
  price: number;
  currency: string;
  dividend: number;
  dividendCurrency: string;
  dividendMonths: number[];
  yield: number;
  ratio: number;
}

interface FormValues {
  totalInvestment: number;
  exchangeRate: number;
  stocks: Stock[];
}

export default function Page() {
  const { control, getValues, handleSubmit, register, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      totalInvestment: 0,
      exchangeRate: 0,
      stocks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stocks',
  });

  const totalInvestment = watch('totalInvestment');
  const watchedStocks = watch('stocks');
  const totalRatio = watchedStocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
  const [annualDividend, setAnnualDividend] = useState<number | null>(null);
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

  const onSubmit = (data: FormValues) => {
    // 조건 체크: 총 비율이 100%이고 투자금이 0보다 커야 함
    const currentTotalRatio = data.stocks.reduce((sum, stock) => sum + (stock?.ratio || 0), 0);
    if (Math.abs(currentTotalRatio - 100) > 0.1 || data.totalInvestment <= 0) {
      return; // 조건이 맞지 않으면 계산하지 않음
    }

    // USD 종목이 있는 경우 환율 체크
    const hasUsdStock = data.stocks.some((stock) => stock.currency === 'USD' || stock.dividendCurrency === 'USD');
    if (hasUsdStock && (!data.exchangeRate || data.exchangeRate <= 0)) {
      alert('USD 항목이 있습니다. 환율을 먼저 조회해주세요.');
      return;
    }

    // 세전 연 배당금 계산
    let totalAnnualDividend = 0;
    const monthlyDividendArray = Array(12).fill(0);

    data.stocks.forEach((stock) => {
      // 해당 종목에 투자된 금액 (KRW)
      const investmentAmount = (data.totalInvestment * stock.ratio) / 100;

      // 주가를 KRW로 환산
      let priceInKRW = stock.price;
      if (stock.currency === 'USD') {
        priceInKRW = stock.price * data.exchangeRate;
      }

      // 주당 배당금을 KRW로 환산
      let dividendInKRW = stock.dividend;
      if (stock.dividendCurrency === 'USD') {
        dividendInKRW = stock.dividend * data.exchangeRate;
      }

      // 보유 주식 수 계산
      const shares = investmentAmount / priceInKRW;

      // 연 배당금 = 보유 주식 수 × 연간 주당 배당금
      const stockAnnualDividend = shares * dividendInKRW;

      totalAnnualDividend += stockAnnualDividend;

      // 월별 배당금 계산
      if (stock.dividendMonths && stock.dividendMonths.length > 0) {
        // 1회당 배당금 = 연 배당금 / 배당 지급 횟수
        const perPaymentDividend = stockAnnualDividend / stock.dividendMonths.length;

        // 각 배당 지급 월에 배당금 추가 (세후)
        stock.dividendMonths.forEach((month) => {
          monthlyDividendArray[month - 1] += perPaymentDividend * (1 - 0.154);
        });
      }
    });

    setAnnualDividend(totalAnnualDividend);
    setMonthlyDividends(monthlyDividendArray);
  };

  return (
    <main className="flex flex-col gap-3.5 p-4">
      <div className="flex items-center gap-4">
        <Tabs className="flex-1" defaultValue="dividend">
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
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <label className="text-sm font-medium whitespace-nowrap">총 투자금</label>
          <Input
            className="flex-1"
            placeholder="총 투자금을 입력하세요"
            type="number"
            {...register('totalInvestment', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">원</span>
        </div>
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
            <Button disabled={Math.abs(totalRatio - 100) > 0.1 || totalInvestment <= 0} type="submit">
              계산
            </Button>
            <Button
              onClick={() => {
                reset();
                setAnnualDividend(null);
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
        </div>
      </form>
    </main>
  );
}
