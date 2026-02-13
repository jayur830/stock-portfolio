import { DIVIDEND_TAX_RATE } from '@/lib/utils';

export interface TaxInfoProps {
  dividend: number;
}

export default function TaxInfo({ dividend }: TaxInfoProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-xs md:text-sm text-muted-foreground">연간 배당소득 (세전)</span>
        <span className="text-sm md:text-base font-medium">
          {dividend.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs md:text-sm text-muted-foreground">원천징수 세액 (15.4%)</span>
        <span className="text-sm md:text-base font-medium text-muted-foreground">
          {(dividend * DIVIDEND_TAX_RATE).toLocaleString('ko-KR', {
            maximumFractionDigits: 0,
          })}{' '}
          원
        </span>
      </div>
    </>
  );
}
