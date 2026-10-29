'use client';

import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { estimateComprehensiveTax } from '@/lib/comprehensive-tax';

const references = [
  {
    href: 'https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1033963385',
    label: '조세특례제한법 제104조의27',
  },
  {
    href: 'https://webtv.nts.go.kr/nts/na/ntt/selectNttInfo.do?mi=2201&nttSn=1349597',
    label: '국세청 고배당기업 배당소득 안내',
  },
  {
    href: 'https://t.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7664&mi=2224',
    label: '국세청 종합소득세 신고 안내',
  },
];

export default function ComprehensiveTaxInfo({
  annualDividend,
  expectedWithholding = 0,
  foreignDividend = 0,
}: {
  annualDividend: number;
  expectedWithholding?: number;
  foreignDividend?: number;
}) {
  const [values, setValues] = useState({ external: '', other: '', deductions: '', national: '', local: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReturnType<typeof estimateComprehensiveTax> | null>(null);
  const [snapshot, setSnapshot] = useState('');
  const currentSnapshot = JSON.stringify({ values, confirmed, annualDividend, expectedWithholding, foreignDividend });
  const shown = snapshot === currentSnapshot ? result : null;
  const fields = [
    ['external', '포트폴리오 외 일반 과세대상 이자·배당소득'],
    ['other', '금융소득 외 종합소득금액'],
    ['deductions', '소득공제액'],
    ['national', '금융소득 국내 원천징수·기납부 소득세'],
    ['local', '금융소득 기납부 지방소득세'],
  ] as const;
  const calculate = () => {
    setResult(null);
    try {
      if (Object.values(values).some((value) => !value.trim()))
        throw new Error('모든 금액을 입력하세요. 없는 항목은 0원을 입력하세요.');
      const next = estimateComprehensiveTax({
        portfolioDividend: annualDividend,
        externalFinancialIncome: Number(values.external),
        otherIncome: Number(values.other),
        deductions: Number(values.deductions),
        domesticPrepaid: Number(values.national),
        localPrepaid: Number(values.local),
        foreignDividend,
        excludedFromGrossUp: confirmed,
      });
      setResult(next);
      setSnapshot(currentSnapshot);
      setError('');
    } catch (cause) {
      setError((cause as Error).message);
    }
  };
  return (
    <section
      aria-labelledby="comprehensive-tax-title"
      className="mt-4 rounded-xl border border-border/70 bg-card/60 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground" id="comprehensive-tax-title">
            종합소득세 예상 계산
          </h4>
          <p className="mt-2 text-xs text-muted-foreground">이 포트폴리오 기준 연간 세전 배당금</p>
          <p className="mt-1 break-words text-base font-semibold tabular-nums text-foreground">
            {Math.round(annualDividend).toLocaleString('ko-KR')}원
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            일반 기준 참고: 연간 이자·배당 금융소득 2,000만원. 이 포트폴리오 정보만으로 신고 대상 여부를 판단하지
            않습니다.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="금융소득 종합과세 안내와 공식 자료 보기"
              className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              type="button"
            >
              <HelpCircle className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="max-h-[min(80vh,38rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto text-xs"
          >
            <div className="space-y-3 leading-relaxed">
              <h5 className="font-semibold text-foreground">확인할 사항</h5>
              <p>
                일반적인 기준금액은 연간 이자·배당 금융소득 합계 2,000만원입니다. 카드의 금액은 이 포트폴리오의 예상
                배당만 나타냅니다. 실제 판단에는 포트폴리오 밖 금융소득과 비과세·분리과세 소득 등 적용 조건도 확인해야
                하므로, 이 금액만으로 신고 대상 여부를 확정할 수 없습니다.
              </p>
              <p>
                신고가 필요한 경우 일반적인 신고 시기는 다음 해 5월입니다. 추가 납부·환급액은 다른 소득, 공제,
                기납부세액 등 개인별 상황에 따라 달라집니다.
              </p>
              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <h5 className="font-semibold text-foreground">국내 고배당기업 배당소득 특례</h5>
                <p>
                  일반적인 금융소득 종합과세 기준과 별도 제도입니다. 법정 요건을 충족한 국내 상장 내국법인의 배당에
                  한정되며, 국내주식이라고 모두 대상인 것은 아닙니다. 별도 대상 확인과 신청이 필요하고, 해외주식과 해외
                  상장 ETF 배당에는 적용되지 않습니다. 이 안내는 종목별 적용 여부를 판정하지 않습니다.
                </p>
              </div>
              <nav
                aria-label="종합과세 공식 참고 자료"
                className="flex flex-col gap-1.5 border-t border-border/60 pt-3"
              >
                {references.map(({ href, label }) => (
                  <a
                    className="break-words text-primary underline underline-offset-2 hover:opacity-80"
                    href={href}
                    key={href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {label}
                  </a>
                ))}
                <span className="pt-1 text-[10px] text-muted-foreground/80">자료 확인 기준일: 2026년 10월 29일</span>
              </nav>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="mt-3 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        2026년 대한민국 거주자 · 국내 14% 일반 원천징수 금융소득 중 배당가산 제외 대상만 지원합니다. 고배당기업 분리과세
        특례·배당세액공제·기타 세액공제와 감면을 적용하지 않는 시나리오입니다. 해외 배당, 배당가산 대상, 비영업대금
        이익, 결손금·세액감면은 미지원입니다.
      </p>
      <div className="mt-4 space-y-3 text-xs leading-relaxed">
        <p>
          기존 포트폴리오 예상 원천징수 합계: {expectedWithholding.toLocaleString('ko-KR')}원. 국내·외 세금의 구분이
          확정된 금액은 아닙니다.
        </p>
        <p>
          금융소득 외 종합소득금액은 총급여·매출이 아니라 필요경비·근로소득공제 등을 반영한 소득금액입니다. 소득공제액은
          자동 적용하지 않습니다.
        </p>
        <p>없는 소득·공제는 0원을 입력하세요. 개인 소득 입력은 이 화면에서만 사용합니다.</p>
        {fields.slice(0, 3).map(([key, label]) => (
          <label className="block space-y-1" key={key}>
            <span>{label} (원)</span>
            <Input
              type="number"
              min={0}
              step={1}
              value={values[key]}
              onChange={(event) => setValues({ ...values, [key]: event.target.value })}
            />
          </label>
        ))}
        <details className="rounded-lg border border-border p-3" open>
          <summary className="cursor-pointer font-medium">상세 설정 · 기납부세액 확인 필수</summary>
          <p className="my-2">
            이 포트폴리오 및 외부 금융소득의 국내 소득세와 지방소득세만 입력하세요. 다른 종합소득의 세금과 외국
            납부세액을 중복 입력하지 마세요. 기존 taxRate로 외국 납부액을 추정하지 않습니다.
          </p>
          {fields.slice(3).map(([key, label]) => (
            <label className="mb-2 block space-y-1" key={key}>
              <span>{label} (원)</span>
              <Input
                type="number"
                min={0}
                step={1}
                value={values[key]}
                onChange={(event) => setValues({ ...values, [key]: event.target.value })}
              />
            </label>
          ))}
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>
              모든 금융소득이 국내 14% 일반 원천징수 대상이며 배당가산 제외 대상임을 확인했습니다. KRW 통화만으로
              판단하지 마세요.
            </span>
          </label>
        </details>
        <Button type="button" onClick={calculate}>
          예상 세액 계산
        </Button>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {shown && (
          <div role="status" className="space-y-3 rounded-xl border border-border bg-muted/30 p-3 break-words">
            <p>
              2026년 · 지방소득세는 소득세 모형의 10% · 고배당기업 분리과세 특례 미적용 · 배당가산 제외 · 세액공제·감면
              없음
            </p>
            {(
              [
                ['계산에 반영한 연간 금융소득', shown.financialIncome],
                ['일반 방식 세액', shown.ordinary],
                ['비교과세 세액', shown.comparison],
                ['예상 소득세 산출세액', shown.assessed],
                ['예상 소득세 결정세액', shown.decided],
                ['예상 지방소득세', shown.localTax],
                ['다른 소득 기준세액 (추가 부담에서 제외)', shown.baseline],
                ['다른 소득 기준 지방소득세 (제외)', shown.baselineLocal],
                ['금융소득 국내 기납부 소득세', shown.domesticPrepaid],
                ['금융소득 기납부 지방소득세', shown.localPrepaid],
                ['배당세액공제 (제외 대상)', shown.dividendCredit],
                ['외국납부세액공제 (해외소득 미지원)', shown.foreignCredit],
              ] as const
            ).map(([label, amount]) => (
              <p key={label}>
                {label}: <strong>{amount.toLocaleString('ko-KR')}원</strong>
              </p>
            ))}
            <p className="text-sm font-semibold">금융소득 관련 예상 추가 납부액</p>
            <strong className="block text-2xl tabular-nums">{shown.additional.toLocaleString('ko-KR')}원</strong>
            <p>
              2,000만원 이하 금융소득은 원천징수 분리과세분을 포함한 합계 모형입니다. 산출세액은 세율 적용 후 금액,
              결정세액은 공제·감면 후 금액입니다. 위 모형은 세액공제를 적용하지 않아 두 금액이 같습니다. 추가 부담은
              다른 소득의 기준세액과 금융소득 기납부액을 제외합니다. 0원도 신고 불필요나 환급 확정을 뜻하지 않습니다.
              전체 개인 신고 정산과 실제 납부서 금액은 지원하지 않습니다.
            </p>
          </div>
        )}
        <a
          className="block underline"
          href="https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029623903"
          target="_blank"
          rel="noreferrer"
        >
          소득세법 제62조 비교과세
        </a>
        <a
          className="block underline"
          href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7666&mi=2227"
          target="_blank"
          rel="noreferrer"
        >
          국세청 세율
        </a>
      </div>
    </section>
  );
}
