import { NextRequest, NextResponse } from 'next/server';

export interface TopTradingStock {
  symbol: string;
  name: string;
  label: string;
  exchange: string;
  tradingValue: string;
}

/**
 * 실시간/당일 거래대금 TOP 10 종목 조회 API
 * - KOSPI (국내 코스피)
 * - NASDAQ (미국 나스닥)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const market = (searchParams.get('market') || 'KOSPI').toUpperCase();

  try {
    let url = 'https://m.stock.naver.com/api/stocks/priceTop/KOSPI?page=1&pageSize=10';
    if (market === 'NASDAQ') {
      url = 'https://api.stock.naver.com/stock/exchange/NASDAQ/priceTop?page=1&pageSize=10';
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!response.ok) {
      throw new Error(`Naver API responded with status ${response.status}`);
    }

    const data = await response.json();
    const rawStocks = (data.stocks || []) as any[];

    const stocks: TopTradingStock[] = rawStocks.slice(0, 10).map((s) => {
      if (market === 'NASDAQ') {
        return {
          symbol: s.symbolCode || s.reutersCode || '',
          name: s.stockName || s.stockNameEng || '',
          label: s.stockName ? `${s.stockName} (${s.symbolCode})` : s.symbolCode,
          exchange: s.stockExchangeType?.name || 'NASDAQ',
          tradingValue: s.accumulatedTradingValueKrwHangeul || s.accumulatedTradingValue || '',
        };
      }

      // KOSPI (Yahoo Finance 형식에 맞춰 .KS 부착)
      const code = s.itemCode || s.reutersCode || '';
      return {
        symbol: `${code}.KS`,
        name: s.stockName || '',
        label: s.stockName || code,
        exchange: s.stockExchangeType?.nameKor || '코스피',
        tradingValue: s.accumulatedTradingValueKrwHangeul || '',
      };
    });

    return NextResponse.json({
      market,
      stocks: stocks.filter((s) => s.symbol && s.name),
    });
  } catch (error) {
    console.error('Failed to fetch top trading stocks:', error);

    // 네트워크 오류 시 대비 폴백 (실제 주요 거래대금 상위 종목)
    const fallbackKOSPI: TopTradingStock[] = [
      { symbol: '005930.KS', name: '삼성전자', label: '삼성전자', exchange: '코스피', tradingValue: '' },
      { symbol: '000660.KS', name: 'SK하이닉스', label: 'SK하이닉스', exchange: '코스피', tradingValue: '' },
      { symbol: '005935.KS', name: '삼성전자우', label: '삼성전자우', exchange: '코스피', tradingValue: '' },
      { symbol: '005380.KS', name: '현대차', label: '현대차', exchange: '코스피', tradingValue: '' },
      { symbol: '005387.KS', name: '현대차2우B', label: '현대차2우B', exchange: '코스피', tradingValue: '' },
      { symbol: '088980.KS', name: '맥쿼리인프라', label: '맥쿼리인프라', exchange: '코스피', tradingValue: '' },
      { symbol: '055550.KS', name: '신한지주', label: '신한지주', exchange: '코스피', tradingValue: '' },
      { symbol: '105560.KS', name: 'KB금융', label: 'KB금융', exchange: '코스피', tradingValue: '' },
      { symbol: '086790.KS', name: '하나금융지주', label: '하나금융지주', exchange: '코스피', tradingValue: '' },
      { symbol: '035420.KS', name: 'NAVER', label: 'NAVER', exchange: '코스피', tradingValue: '' },
    ];

    const fallbackNASDAQ: TopTradingStock[] = [
      { symbol: 'NVDA', name: '엔비디아', label: '엔비디아 (NVDA)', exchange: 'NASDAQ', tradingValue: '' },
      { symbol: 'TSLA', name: '테슬라', label: '테슬라 (TSLA)', exchange: 'NASDAQ', tradingValue: '' },
      { symbol: 'AAPL', name: '애플', label: '애플 (AAPL)', exchange: 'NASDAQ', tradingValue: '' },
      { symbol: 'MSFT', name: '마이크로소프트', label: '마이크로소프트 (MSFT)', exchange: 'NASDAQ', tradingValue: '' },
      { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', label: 'SCHD', exchange: 'AMEX', tradingValue: '' },
      { symbol: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', label: 'JEPI', exchange: 'AMEX', tradingValue: '' },
      {
        symbol: 'JEPQ',
        name: 'JPMorgan Nasdaq Equity Premium Income ETF',
        label: 'JEPQ',
        exchange: 'AMEX',
        tradingValue: '',
      },
      { symbol: 'O', name: 'Realty Income', label: '리얼티인컴 (O)', exchange: 'NYSE', tradingValue: '' },
      { symbol: 'KO', name: 'The Coca-Cola Company', label: '코카콜라 (KO)', exchange: 'NYSE', tradingValue: '' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', label: 'QQQ', exchange: 'NASDAQ', tradingValue: '' },
    ];

    return NextResponse.json({
      market,
      stocks: market === 'NASDAQ' ? fallbackNASDAQ : fallbackKOSPI,
    });
  }
}
