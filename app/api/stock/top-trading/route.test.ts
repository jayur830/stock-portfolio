/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { GET } from './route';

describe('/api/stock/top-trading', () => {
  it('returns KOSPI top trading stocks by default', async () => {
    const request = new NextRequest('http://localhost/api/stock/top-trading');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.market).toBe('KOSPI');
    expect(Array.isArray(data.stocks)).toBe(true);
    expect(data.stocks.length).toBeGreaterThan(0);
    expect(data.stocks[0]).toHaveProperty('symbol');
    expect(data.stocks[0]).toHaveProperty('name');
  });

  it('returns NASDAQ top trading stocks when market=NASDAQ', async () => {
    const request = new NextRequest('http://localhost/api/stock/top-trading?market=NASDAQ');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.market).toBe('NASDAQ');
    expect(Array.isArray(data.stocks)).toBe(true);
    expect(data.stocks.length).toBeGreaterThan(0);
  });
});
