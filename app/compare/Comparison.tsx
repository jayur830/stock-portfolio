'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { comparePortfolios, readPortfolios, type SavedPortfolio, writePortfolios } from '@/lib/saved-portfolios';
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
      setError('저장 목록을 읽지 못했습니다. 저장 데이터 또는 브라우저 접근 권한을 확인해주세요.');
    }
  }, []);
  function select(ids: string[]) {
    setSelected(ids);
    const next = ids[0] || '';
    if (!investment && next) setInvestment(String(items.find((p) => p.id === next)?.investment || ''));
  }
  const money = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';
  const rows = [
    { label: '세전 연 배당금', get: (p: NonNullable<typeof result>[number]) => p.annualGross },
    { label: '세후 연 배당금', get: (p: NonNullable<typeof result>[number]) => p.annualNet },
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
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        이 브라우저에 저장된 구성입니다. 저장한 가격·환율을 사용하며, 세후는 배당소득세 차감 기준입니다.
        건보료·종합소득세 정산은 제외합니다.
      </p>
      {!items.length && <p>저장된 구성이 없습니다. 계산기에서 정상 계산 후 저장해주세요.</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => select(items.map((p) => p.id))}>
          모두 선택
        </Button>
        <Button type="button" variant="outline" onClick={() => select([])}>
          선택 해제
        </Button>
      </div>
      {items.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={(e) => select(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))}
            />
            {p.name}
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-primary" href={`/?load=${encodeURIComponent(p.id)}&tab=${p.mode}`}>
              계산기로 불러오기
            </Link>
            <button
              type="button"
              onClick={() => {
                try {
                  const next = readPortfolios().filter((v) => v.id !== p.id);
                  writePortfolios(next);
                  setItems(next);
                  select(selected.filter((id) => id !== p.id));
                } catch {
                  setError('삭제하지 못했습니다. 브라우저 저장소를 확인해주세요.');
                }
              }}
            >
              삭제
            </button>
          </div>
          <details>
            <summary className="text-sm">저장 조건 보기</summary>
            <p>
              투자금 {money(p.investment)} · {p.mode === 'dividend' ? '배당금 계산' : '투자금 역산'}
            </p>
            <pre className="overflow-auto text-xs">
              {JSON.stringify({ stocks: p.stocks, exchangeRates: p.exchangeRates }, null, 2)}
            </pre>
          </details>
        </div>
      ))}
      <label className="block">
        공통 투자금 (원)
        <Input
          aria-label="공통 투자금"
          type="number"
          min="0"
          value={investment}
          onChange={(e) => setInvestment(e.target.value)}
        />
      </label>
      <Button
        type="button"
        onClick={() => {
          try {
            const latest = readPortfolios();
            const chosen = selected.map((id) => latest.find((p) => p.id === id));
            if (chosen.some((p) => !p)) throw new Error('삭제된 항목이 있습니다. 목록을 새로고침해주세요.');
            const next = comparePortfolios(chosen as SavedPortfolio[], Number(investment), chosen[0]!.id);
            setResult(next);
            setError('');
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        비교 계산
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <section aria-label="비교 결과">
          <h2 className="text-xl font-bold">비교 결과 · 공통 투자금 {money(result[0].investment)}</h2>
          <p className="text-xs text-muted-foreground">비교 계산 버튼을 누른 시점의 선택·기준·금액입니다.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {result.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-2 text-sm">
                  세전 수익률 {formatMetric(p.metrics.grossYield, '%')} · 세후 {formatMetric(p.metrics.netYield, '%')}
                </p>
                <p className="text-sm">
                  매수 {money(p.metrics.invested)} · 잔액 {money(p.metrics.cash)}
                </p>
                <p className="text-xs text-muted-foreground">
                  사용률 {formatMetric(p.metrics.utilization, '%')} · 보유 {p.metrics.stockCount}종목
                </p>
                <p className="text-xs text-muted-foreground">
                  세후 월 배당 {formatMetric(p.metrics.monthlyNetMin, '원')} ~{' '}
                  {formatMetric(p.metrics.monthlyNetMax, '원')} (평균 {formatMetric(p.metrics.monthlyNetAverage, '원')})
                </p>
              </article>
            ))}
          </div>
          <details className="mt-4 rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-medium">투자·현금흐름·집중도 상세</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-card p-2 text-left">지표</th>
                    {result.map((p) => (
                      <th key={p.id} className="p-2">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricRows.map((row) => (
                    <tr key={row.key}>
                      <th className="sticky left-0 bg-card p-2 text-left">{row.label}</th>
                      {result.map((p) => {
                        const value = p.metrics[row.key] as number | null;
                        const highIsDividend = [
                          'grossYield',
                          'netYield',
                          'incomeMonths',
                          'monthlyNetMin',
                          'monthlyNetMax',
                          'monthlyNetAverage',
                        ].includes(row.key);
                        const best = highIsDividend
                          ? Math.max(...result.map((item) => item.metrics[row.key] ?? -Infinity))
                          : -Infinity;
                        return (
                          <td
                            key={p.id}
                            className={`p-2 text-center ${highIsDividend && value === best ? 'bg-emerald-500/10' : ''}`}
                          >
                            {formatMetric(value, row.unit)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-36 bg-card p-3">항목</th>
                  {result.map((p) => (
                    <th key={p.id} className="min-w-44 p-3">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th className="sticky left-0 bg-card p-3 text-left">{row.label}</th>
                    {result.map((p) => {
                      const values = result.map((item) => row.get(item));
                      const best = Math.max(...values);
                      return (
                        <td
                          key={p.id}
                          className={`p-3 tabular-nums ${row.label.startsWith('세전') || row.label.startsWith('세후') ? (row.get(p) === best ? 'bg-emerald-500/10' : '') : ''}`}
                        >
                          {money(row.get(p))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
