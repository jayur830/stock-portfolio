import { NextRequest, NextResponse } from 'next/server';

import { yahooFinance } from '@/lib/yfinance';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name');
  const quotesCount = Number(searchParams.get('limit') || 10);

  if (!name) {
    return NextResponse.json({ message: 'Name is required' }, { status: 400 });
  }

  const result = await yahooFinance.search(name, { quotesCount });

  return NextResponse.json(result);
}
