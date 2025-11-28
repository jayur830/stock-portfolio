import { NextRequest, NextResponse } from 'next/server';

import { yahooFinance } from '@/lib/yfinance';

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'Symbols array is required' }, { status: 400 });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5); // 5년치 데이터 조회

    const histories = await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          // 주가 히스토리 조회
          const history = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d',
          });
          const data = history.map((item) => ({
            date: item.date,
            close: item.close,
          }));

          try {
            const dividends = await yahooFinance.historical(symbol, {
              period1: startDate,
              period2: endDate,
              events: 'dividends',
            });

            return {
              symbol,
              data,
              dividends: dividends.map((item) => ({
                date: item.date,
                amount: item.dividends || 0,
              })),
            };
          } catch (divError) {
            console.warn(`Failed to fetch dividend history for ${symbol}:`, divError);
            // 배당 정보가 없어도 계속 진행
            return {
              symbol,
              data,
              dividends: [],
            };
          }
        } catch (error) {
          console.error(`Failed to fetch history for ${symbol}:`, error);
          return {
            symbol,
            data: [],
            dividends: [],
            error: 'Failed to fetch history',
          };
        }
      }),
    );

    return NextResponse.json({ histories });
  } catch (error) {
    console.error('Stock history error:', error);
    return NextResponse.json({
      error: 'Failed to fetch stock histories',
    }, { status: 500 });
  }
}
