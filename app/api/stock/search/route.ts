import { NextRequest, NextResponse } from 'next/server';

import { yahooFinance } from '@/lib/yfinance';

interface NaverStockItem {
  code: string;
  name: string;
  typeCode: string;
  typeName: string;
  nationCode: string;
}

/** 한글 포함 여부 확인 정규식 */
const HANGUL_REGEX = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;

/** 네이버 증권 자동완성 API를 통한 종목 검색 */
async function searchNaverStock(query: string) {
  try {
    const res = await fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { items?: NaverStockItem[] };
    const items = data.items || [];

    return items.map((item) => {
      let symbol = item.code;
      if (item.nationCode === 'KOR') {
        const type = item.typeCode.toUpperCase();
        if (type.includes('KOSPI')) {
          symbol = `${item.code}.KS`;
        } else if (type.includes('KOSDAQ')) {
          symbol = `${item.code}.KQ`;
        } else {
          symbol = `${item.code}.KS`;
        }
      }

      return {
        symbol,
        shortname: item.name,
        exchange: item.typeName || item.typeCode || '',
      };
    });
  } catch (error) {
    console.warn('Naver stock search failed:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const trimmedQuery = query.trim();

  // 한글이 포함된 검색어인 경우 Yahoo Finance는 400 Bad Request를 반환하므로 네이버 검색 우선 사용
  if (HANGUL_REGEX.test(trimmedQuery)) {
    const naverQuotes = await searchNaverStock(trimmedQuery);
    return NextResponse.json({ quotes: naverQuotes });
  }

  try {
    const searchResults = await yahooFinance.search(trimmedQuery, {
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

    // 만약 영문/숫자 티커 검색 결과가 없을 경우 네이버에서도 보조 검색
    if (quotes.length === 0) {
      const fallbackQuotes = await searchNaverStock(trimmedQuery);
      if (fallbackQuotes.length > 0) {
        return NextResponse.json({ quotes: fallbackQuotes });
      }
    }

    return NextResponse.json({ quotes });
  } catch (e) {
    const error = e as Error;
    console.error('Stock search error from Yahoo Finance, falling back to Naver:', error.message);

    // Yahoo Finance 검색 실패 시 네이버 검색 fallback 시도
    const naverQuotes = await searchNaverStock(trimmedQuery);
    if (naverQuotes.length > 0) {
      return NextResponse.json({ quotes: naverQuotes });
    }

    return NextResponse.json({ quotes: [] });
  }
}
