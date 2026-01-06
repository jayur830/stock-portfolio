import { NextRequest, NextResponse } from 'next/server';

import { yahooFinance } from '@/lib/yfinance';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
    });

    const quotes = searchResults.quotes
      .filter((quote) => quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF')
      .map((quote) => ({
        symbol: quote.symbol,
        shortname: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchDisp || quote.exchange || '',
      }));

    return NextResponse.json({ quotes: quotes || [] });
  } catch (e) {
    const error = e as Error;
    console.error('Stock search error:', error.message, error.name);

    if (error.name === 'BadRequestError') {
      return NextResponse.json({
        quotes: [],
        error: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      quotes: [],
      error: 'Failed to search stocks',
    }, { status: 500 });
  }
}
