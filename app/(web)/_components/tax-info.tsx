
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
      <div className="flex justify-between items-center">
        <span className="text-xs md:text-sm text-muted-foreground">연간 배당소득 (세전)</span>
        <span className="text-sm md:text-base font-medium">
          {stockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs md:text-sm text-muted-foreground">원천징수 세액</span>
        <span className="text-sm md:text-base font-medium text-muted-foreground">
          {stockDividends.reduce((sum, { annualDividend, taxRate }) => sum + annualDividend * taxRate, 0).toLocaleString('ko-KR', {
            maximumFractionDigits: 0,
          })}{' '}
          원
        </span>
      </div>
    </>
  );
}
