export interface MonthlyDividendsProps {
  amounts: number[];
}

/** 월별 배당금 목록 (세후) */
export default function MonthlyDividends({ amounts }: MonthlyDividendsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {amounts.map((amount, index) => (
        <div
          className="flex flex-row md:flex-col justify-between items-center p-2 bg-white rounded border border-blue-100"
          key={index}
        >
          <span className="text-xs md:text-sm text-blue-600 font-medium">{index + 1}월</span>
          <span className="text-sm font-semibold text-blue-900">
            {amount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
          </span>
        </div>
      ))}
    </div>
  );
}
