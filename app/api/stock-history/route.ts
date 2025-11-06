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
    startDate.setFullYear(startDate.getFullYear() - 1);

    const historyData = await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          const history = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d',
          });

          return {
            symbol,
            data: history.map((item) => ({
              date: item.date,
              close: item.close,
            })),
          };
        } catch (error) {
          console.error(`Failed to fetch history for ${symbol}:`, error);
          return {
            symbol,
            data: [],
            error: 'Failed to fetch history',
          };
        }
      })
    );

    return NextResponse.json({ histories: historyData });
  } catch (error) {
    console.error('Stock history error:', error);
    return NextResponse.json({
      error: 'Failed to fetch stock histories',
    }, { status: 500 });
  }
}
