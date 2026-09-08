import { KRW_CGT } from '@/lib/utils';

export interface TaxInfoProps {
  /** 세전 연배당금 */
  stockDividends: {
    annualDividend: number;
    taxRate: number;
  }[];
}

export default function TaxInfo({ stockDividends }: TaxInfoProps) {
  return (
    <>
      <div className="tax-line">
        <span className="tax-label">연간 배당소득 (세전)</span>
        <span className="tax-value">
          {stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
        </span>
      </div>
      <div className="tax-line">
        <span className="tax-label">원천징수 세액</span>
        <span className="tax-value is-muted">
          {stockDividends
            .reduce((sum, { annualDividend, taxRate }) => sum + annualDividend * (taxRate + (KRW_CGT - Math.min(KRW_CGT, taxRate)) * 1.1), 0)
            .toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
          {' 원'}
        </span>
      </div>
    </>
  );
}
