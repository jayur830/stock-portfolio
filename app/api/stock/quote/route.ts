import { NextRequest, NextResponse } from 'next/server';

import { yahooFinance } from '@/lib/yfinance';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol || symbol.trim().length === 0) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const quote = await yahooFinance.quote(symbol);

    // 배당 내역 조회 (최근 1년)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const dividendMonths: number[] = [];
    let annualDividend = 0;

    try {
      const dividendHistory = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        events: 'dividends',
      });

      if (dividendHistory && dividendHistory.length > 0) {
        // 배당 지급 월 추출 (중복 제거)
        const months = new Set(
          dividendHistory.map((div) => new Date(div.date).getMonth() + 1),
        );
        dividendMonths.push(...Array.from(months).sort((a, b) => a - b));

        // 연간 배당금 계산 (최근 1년간 실제 지급된 배당금의 총합)
        annualDividend = dividendHistory.reduce((sum, div) => sum + (div.dividends || 0), 0);
      }
    } catch (divError) {
      console.warn('Failed to fetch dividend history:', divError);
      // 배당 정보가 없어도 계속 진행
    }

    // 거래소에 따라 통화 결정
    const isKorean = quote.exchange === 'KRW' || quote.exchange === 'KSC' || quote.exchange === 'KOE';
    const currency = isKorean ? 'KRW' : 'USD';

    // 배당률 계산 (배당금 / 주가 * 100)
    const price = quote.regularMarketPrice || 0;
    const yieldRate = price > 0 ? Math.round((annualDividend / price) * 100 * 10000) / 10000 : 0;

    return NextResponse.json({
      symbol: quote.symbol,
      price,
      currency,
      dividend: annualDividend,
      yield: yieldRate,
      dividendMonths,
      exchange: quote.exchange,
    });
  } catch (error) {
    console.error('Stock quote error:', error);
    return NextResponse.json({
      error: 'Failed to fetch stock quote',
    }, { status: 500 });
  }
}
