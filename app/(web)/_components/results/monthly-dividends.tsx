export interface MonthlyDividendsProps {
  amounts: number[];
}

/** 월별 배당금 목록 (세후) */
export default function MonthlyDividends({ amounts }: MonthlyDividendsProps) {
  return (
    <div className="monthly-surface">
      <h3 className="monthly-title">예상 월별 배당금 (세후)</h3>
      <div className="monthly-grid">
        {amounts.map((amount, index) => (
          <div
            className="monthly-item"
            key={index}
          >
            <span className="monthly-month">{index + 1}월</span>
            <span className="monthly-amount">
              {amount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
