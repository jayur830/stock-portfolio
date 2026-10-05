import ExchangeRates from './ExchangeRates';
import StockCards from './stock-cards';
import TargetInput from './TargetInput';

export default function Inputs() {
  return (
    <div className="input-stack">
      <div className="input-grid">
        {/** 환율 */}
        <ExchangeRates />

        {/** 총 투자금/목표 연 배당금 입력 */}
        <TargetInput />
      </div>

      {/** 종목 리스트 영역 */}
      <StockCards />
    </div>
  );
}
