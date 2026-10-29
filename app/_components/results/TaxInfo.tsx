import ComprehensiveTaxInfo from './ComprehensiveTaxInfo';

export interface TaxInfoProps {
  /** 세전 연배당금 */
  stockDividends: {
    annualDividend: number;
    taxRate: number;
    isForeign: boolean;
  }[];
}

export default function TaxInfo({ stockDividends }: TaxInfoProps) {
  const annualDividend = stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0);

  return (
    <>
      <div className="tax-line">
        <span className="tax-label">연간 배당소득 (세전)</span>
        <span className="tax-value">{annualDividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원</span>
      </div>
      <div className="tax-line">
        <span className="tax-label">원천징수 세액</span>
        <span className="tax-value is-muted">
          {stockDividends
            .reduce((sum, { annualDividend, taxRate }) => sum + Math.round(annualDividend * taxRate), 0)
            .toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
          {' 원'}
        </span>
      </div>
      <ComprehensiveTaxInfo
        annualDividend={annualDividend}
        expectedWithholding={stockDividends.reduce(
          (sum, stock) => sum + Math.round(stock.annualDividend * stock.taxRate),
          0,
        )}
        foreignDividend={stockDividends
          .filter((stock) => stock.isForeign)
          .reduce((sum, stock) => sum + stock.annualDividend, 0)}
      />
    </>
  );
}
