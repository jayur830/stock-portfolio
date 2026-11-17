'use client';

import { Check, ChevronDown, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell,TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { comparePortfolios, readPortfolios, type SavedPortfolio, writePortfolios } from '@/lib/saved-portfolios';

const currencyNames: Record<string, string> = {
  KRW: '원화',
  USD: '미국 달러',
  JPY: '일본 엔',
  EUR: '유로',
  GBP: '영국 파운드',
  CNY: '중국 위안',
  CAD: '캐나다 달러',
  AUD: '호주 달러',
  CHF: '스위스 프랑',
  HKD: '홍콩 달러',
};

export default function Comparison() {
  const [items, setItems] = useState<SavedPortfolio[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [investment, setInvestment] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReturnType<typeof comparePortfolios> | null>(null);
  useEffect(() => {
    try {
      setItems(readPortfolios());
    } catch {
      setError('저장 목록을 읽지 못했습니다. 브라우저 저장 공간과 접근 권한을 확인해주세요.');
    }
  }, []);
  function select(ids: string[]) {
    setSelected(ids);
    const first = ids[0] || '';
    if (!investment && first) setInvestment(String(items.find((p) => p.id === first)?.investment || ''));
  }
  const toggle = (id: string) => select(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  const money = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
  const rows = [
    { label: '세전 연 배당금', get: (p: NonNullable<typeof result>[number]) => p.annualGross, group: '연간 배당' },
    { label: '세후 연 배당금', get: (p: NonNullable<typeof result>[number]) => p.annualNet, group: '연간 배당' },
  ];
  const metricRows = [
    { label: '세전 연 배당수익률', key: 'grossYield', unit: '%' },
    { label: '세후 연 배당수익률', key: 'netYield', unit: '%' },
    { label: '실제 매수 금액', key: 'invested', unit: '원' },
    { label: '잔여 현금', key: 'cash', unit: '원' },
    { label: '투자금 사용률', key: 'utilization', unit: '%' },
    { label: '배당 발생 월 수', key: 'incomeMonths', unit: '개월' },
    { label: '배당 없는 월 수', key: 'noIncomeMonths', unit: '개월' },
    { label: '세후 월 배당 최소', key: 'monthlyNetMin', unit: '원' },
    { label: '세후 월 배당 최대', key: 'monthlyNetMax', unit: '원' },
    { label: '세후 월 배당 평균', key: 'monthlyNetAverage', unit: '원' },
    { label: '실제 보유 종목 수', key: 'stockCount', unit: '종목' },
    { label: '최대 종목 비중', key: 'maxStockShare', unit: '%' },
    { label: '상위 3종목 합산 비중', key: 'topThreeShare', unit: '%' },
  ] as const;
  const formatMetric = (value: number | null, unit: string) =>
    value === null || !Number.isFinite(value)
      ? '해당 없음'
      : unit === '%'
        ? `${value.toFixed(2)}%`
        : `${Math.round(value).toLocaleString('ko-KR')} ${unit}`;
  const remove = (id: string) => {
    try {
      const next = readPortfolios().filter((p) => p.id !== id);
      writePortfolios(next);
      setItems(next);
      select(selected.filter((value) => value !== id));
      setError('');
    } catch {
      setError('삭제하지 못했습니다. 브라우저 저장 공간과 접근 권한을 확인해주세요.');
    }
  };
  const runComparison = () => {
    try {
      if (selected.length < 2) {
        throw new Error('비교할 포트폴리오를 2개 이상 선택해주세요.');
      }
      const latest = readPortfolios();
      const chosen = selected.map((id) => latest.find((p) => p.id === id));
      if (chosen.some((p) => !p)) throw new Error('선택한 저장 구성이 삭제되었습니다. 목록을 새로고침해주세요.');
      const resolved = chosen.filter((p): p is SavedPortfolio => Boolean(p));
      const baselineId = resolved[0]?.id;
      if (!baselineId) throw new Error('비교 기준 포트폴리오를 확인할 수 없습니다.');
      const next = comparePortfolios(resolved, Number(investment), baselineId);
      setResult(next);
      setError('');
    } catch (cause) {
      setError((cause as Error).message);
    }
  };
  return (
    <div className="page space-y-6">
      <Card role="region" aria-labelledby="compare-select-title" className="panel gap-0">
        <CardHeader className="sectionHead gap-0 p-0">
          <div>
            <span className="step">01</span>
            <div>
              <CardTitle role="heading" aria-level={2} id="compare-select-title">
                포트폴리오 선택
              </CardTitle>
              <p>이 브라우저에 저장한 구성을 선택하세요.</p>
            </div>
          </div>
          <div className="tools">
            <span className="count">{selected.length}개 선택</span>
            <Button size="sm" variant="outline" type="button" onClick={() => select(items.map((p) => p.id))}>
              모두 선택
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => select([])}>
              선택 해제
            </Button>
          </div>
        </CardHeader>
        {items.length === 0 ? (
          <div className="empty">
            <div className="empty">+</div>
            <h3>저장된 구성이 없습니다</h3>
            <p>계산기에서 계산을 마친 뒤 이름을 붙여 저장하면 여기서 비교할 수 있어요.</p>
            <Button asChild variant="link">
              <Link href="/#calculator">계산기로 이동 →</Link>
            </Button>
          </div>
        ) : (
          <div className="cards">
            {items.map((p) => {
              const checked = selected.includes(p.id);
              const stockCount = p.stocks.filter((stock) => stock.enabled).length;
              const currencies = Object.entries(p.exchangeRates).filter(([, rate]) => rate > 0);
              return (
                <Card key={p.id} className={`card gap-0 py-0 ${checked ? 'cardSelected' : ''}`}>
                  <label className="cardLabel">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      aria-label={`${p.name} 선택`}
                    />
                    <span className="check" aria-hidden="true">
                      <Check size={14} />
                    </span>
                    <span className="cardName" title={p.name}>
                      {p.name}
                    </span>
                  </label>
                  <div className="facts">
                    <span>
                      저장 투자금<strong>{money(p.investment)}</strong>
                    </span>
                    <span>
                      활성 종목<strong>{stockCount}개</strong>
                    </span>
                  </div>
                  <details className="conditions">
                    <summary>
                      <span>저장 조건 보기</span>
                      <ChevronDown size={14} />
                    </summary>
                    <div className="stocks">
                      {p.stocks.map((stock, index) => (
                        <div className="stock" key={`${stock.ticker}-${index}`}>
                          <div className="stockHead">
                            <strong>{stock.name || stock.ticker}</strong>
                            <span>
                              {stock.ticker} · {stock.currency}
                            </span>
                          </div>
                          <dl>
                            <div>
                              <dt>가격</dt>
                              <dd>
                                {stock.price.toLocaleString('ko-KR')} {stock.currency}
                              </dd>
                            </div>
                            <div>
                              <dt>배당률</dt>
                              <dd>{stock.yield}%</dd>
                            </div>
                            <div>
                              <dt>비중</dt>
                              <dd>{stock.ratio}%</dd>
                            </div>
                            <div className="wide">
                              <dt>배당월</dt>
                              <dd>
                                {stock.dividendMonths.length
                                  ? stock.dividendMonths.map((m) => `${m}월`).join(' · ')
                                  : '설정 없음'}
                                {!stock.enabled && ' · 비활성'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                    </div>
                    <div className="fx">
                      <span>저장 환율</span>
                      {currencies.length ? (
                        currencies.map(([currency, rate]) => (
                          <span key={currency}>
                            {currencyNames[currency] || currency} <b>{rate.toLocaleString('ko-KR')}원</b>
                          </span>
                        ))
                      ) : (
                        <span>설정된 환율 없음</span>
                      )}
                    </div>
                  </details>
                  <CardFooter className="actions px-2 py-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/?load=${encodeURIComponent(p.id)}&tab=${p.mode}`}>계산기로 불러오기</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`${p.name} 삭제`}
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 size={14} /> 삭제
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
      <Card role="region" aria-labelledby="compare-settings-title" className="panel compare-settings gap-0">
        <CardHeader className="sectionHead gap-0 p-0">
          <div>
            <span className="step">02</span>
            <div>
              <CardTitle role="heading" aria-level={2} id="compare-settings-title">
                공통 투자금 설정
              </CardTitle>
              <p>모든 구성을 같은 금액으로 계산합니다.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="settingsRow p-0">
          <label htmlFor="common-investment">비교 투자금</label>
          <div className="investInput">
            <Input
              id="common-investment"
              aria-label="공통 투자금"
              type="number"
              min="0"
              inputMode="numeric"
              value={investment}
              onChange={(e) => setInvestment(e.target.value)}
            />
            <span>원</span>
          </div>
          <Button className="run" type="button" onClick={runComparison}>
            비교 계산
          </Button>
        </CardContent>
        <CardDescription className="note">
          저장된 가격과 환율을 사용합니다. 세후 배당은 배당소득세 차감 기준이며 건보료·종합소득세 정산은 제외합니다.
        </CardDescription>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {!result && <p className="before">두 개 이상의 구성을 선택하고 비교 계산을 누르면 결과가 여기에 표시됩니다.</p>}
      </Card>
      {result && (
        <Card role="region" aria-label="비교 결과" className="panel compare-results gap-0">
          <CardHeader className="sectionHead gap-0 p-0">
            <div>
              <span className="step">03</span>
              <div>
                <CardTitle role="heading" aria-level={2}>
                  비교 결과
                </CardTitle>
                <p>
                  공통 투자금 <strong>{money(result[0].investment)}</strong> · {result.length}개 구성
                </p>
              </div>
            </div>
            <span className="legend">
              <i /> 행별 최고 배당 지표
            </span>
          </CardHeader>
          <div className="summaries">
            {result.map((p) => (
              <Card key={p.id} className="summary gap-0">
                <CardTitle role="heading" aria-level={3} title={p.name}>
                  {p.name}
                </CardTitle>
                <span className="summaryLabel">세후 연 배당금</span>
                <strong className="summaryValue">{money(p.annualNet)}</strong>
                <div className="summarySub">
                  <span>
                    세후 수익률 <b>{formatMetric(p.metrics.netYield, '%')}</b>
                  </span>
                  <span>
                    세전 배당 <b>{money(p.annualGross)}</b>
                  </span>
                </div>
                <div className="summaryMeta">
                  <span>매수 {money(p.metrics.invested)}</span>
                  <span>잔액 {money(p.metrics.cash)}</span>
                  <span>보유 {p.metrics.stockCount}종목</span>
                </div>
              </Card>
            ))}
          </div>
          <details className="details" open>
            <summary>
              <span>상세 지표</span>
              <ChevronDown size={16} />
            </summary>
            <Table className="table" containerClassName="tableScroll">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky">지표</TableHead>
                  {result.map((p) => (
                    <TableHead key={p.id}>{p.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="group">
                  <TableHead colSpan={result.length + 1}>
                    <span className="groupLabel">연간 배당</span>
                  </TableHead>
                </TableRow>
                {rows.map((row) => {
                  const best = Math.max(...result.map(row.get));
                  return (
                    <TableRow key={row.label}>
                      <TableHead className="sticky">{row.label}</TableHead>
                      {result.map((portfolio) => (
                        <TableCell key={portfolio.id} className={row.get(portfolio) === best ? 'best' : ''}>
                          {money(row.get(portfolio))}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                <TableRow className="group">
                  <TableHead colSpan={result.length + 1}>
                    <span className="groupLabel">투자 효율</span>
                  </TableHead>
                </TableRow>
                {metricRows.slice(0, 2).map((row) => (
                  <MetricRow key={row.key} row={row} result={result} formatMetric={formatMetric} />
                ))}
                <TableRow className="group">
                  <TableHead colSpan={result.length + 1}>
                    <span className="groupLabel">투자금 활용</span>
                  </TableHead>
                </TableRow>
                {metricRows.slice(2, 5).map((row) => (
                  <MetricRow key={row.key} row={row} result={result} formatMetric={formatMetric} />
                ))}
                <TableRow className="group">
                  <TableHead colSpan={result.length + 1}>
                    <span className="groupLabel">현금흐름 분포</span>
                  </TableHead>
                </TableRow>
                {metricRows.slice(5, 10).map((row) => (
                  <MetricRow key={row.key} row={row} result={result} formatMetric={formatMetric} />
                ))}
                <TableRow className="group">
                  <TableHead colSpan={result.length + 1}>
                    <span className="groupLabel">종목 집중도</span>
                  </TableHead>
                </TableRow>
                {metricRows.slice(10).map((row) => (
                  <MetricRow key={row.key} row={row} result={result} formatMetric={formatMetric} />
                ))}
              </TableBody>
            </Table>
          </details>
        </Card>
      )}
    </div>
  );
}
function MetricRow({
  row,
  result,
  formatMetric,
}: {
  row: { label: string; key: keyof (typeof result)[number]['metrics']; unit: string };
  result: NonNullable<ReturnType<typeof comparePortfolios>>;
  formatMetric: (value: number | null, unit: string) => string;
}) {
  const dividendMetric = [
    'grossYield',
    'netYield',
    'incomeMonths',
    'monthlyNetMin',
    'monthlyNetMax',
    'monthlyNetAverage',
  ].includes(row.key);
  const best = dividendMetric ? Math.max(...result.map((p) => p.metrics[row.key] ?? -Infinity)) : -Infinity;
  return (
    <TableRow>
      <TableHead className="sticky">{row.label}</TableHead>
      {result.map((p) => {
        const value = p.metrics[row.key] as number | null;
        return (
          <TableCell key={p.id} className={dividendMetric && value === best ? 'best' : ''}>
            {formatMetric(value, row.unit)}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
