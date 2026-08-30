import ExchangeRates from './exchange-rates';
import StockCards from './stock-cards';
import TargetInput from './target-input';

export default function Inputs() {
  return (
    <div className="input-stack">
      {/** 환율 */}
      <ExchangeRates />

      {/** 총 투자금/목표 연 배당금 입력 */}
      <TargetInput />

      {/** 종목 리스트 영역 */}
      <StockCards />
    </div>
  );
}
