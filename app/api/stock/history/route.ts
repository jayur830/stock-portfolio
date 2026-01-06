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
          const { quotes, events } = await yahooFinance.chart(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d',
            events: 'div',
          });

          const data = quotes.map((item) => ({
            date: item.date,
            close: item.close,
          }));

          const dividends = (events?.dividends || []).map(
            (item) => ({
              date: item.date,
              amount: item.amount || 0,
            }),
          );

          return {
            symbol,
            data,
            dividends,
          };
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
