/** 2026, 소득세법 제62조: 14% 일반 원천징수·배당가산 제외 금융소득만 지원. */
export interface TaxEstimateInput {
  portfolioDividend: number;
  externalFinancialIncome: number;
  otherIncome: number;
  deductions: number;
  domesticPrepaid: number;
  localPrepaid: number;
  foreignDividend: number;
  excludedFromGrossUp: boolean;
}

export function progressiveTax(base: number): number {
  const bands = [
    [14e6, 0.06, 0],
    [50e6, 0.15, 1260000],
    [88e6, 0.24, 5760000],
    [150e6, 0.35, 15440000],
    [300e6, 0.38, 19940000],
    [500e6, 0.4, 25940000],
    [1e9, 0.42, 35940000],
    [Infinity, 0.45, 65940000],
  ];
  const taxable = Math.max(0, base);
  const [, rate, deduction] = bands.find(([limit]) => taxable <= limit)!;
  return Math.floor(taxable * rate - deduction);
}

export function estimateComprehensiveTax(input: TaxEstimateInput) {
  for (const [key, value] of Object.entries(input)) {
    if (
      key !== 'excludedFromGrossUp' &&
      (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12)
    ) {
      throw new Error('모든 금액에 0 이상 1조원 이하의 유한한 숫자를 입력하세요.');
    }
  }
  if (input.foreignDividend > 0)
    throw new Error(
      '해외·혼합 배당은 국가별 외국납부세액공제와 국내 원천징수 구분 검토가 필요하여 이번 계산 범위에서 지원하지 않습니다.',
    );
  if (!input.excludedFromGrossUp)
    throw new Error(
      '배당가산 제외 대상인지 확인이 필요합니다. 배당가산 대상 국내 배당과 해당 여부 미확인 배당은 지원하지 않습니다.',
    );
  const financialIncome = input.portfolioDividend + input.externalFinancialIncome;
  const baseline = progressiveTax(input.otherIncome - input.deductions);
  const comparison = Math.floor(financialIncome * 0.14) + baseline;
  const ordinary =
    financialIncome > 20e6
      ? progressiveTax(financialIncome - 20e6 + input.otherIncome - input.deductions) + 2800000
      : comparison;
  const assessed = Math.max(ordinary, comparison);
  // 공제·감면 없는 시나리오. 다른 소득의 기준세액을 제외한 금융소득 증가분만 정산.
  const decided = assessed;
  const localTax = Math.floor(decided * 0.1);
  const baselineLocal = Math.floor(baseline * 0.1);
  const additionalNational = Math.max(0, decided - baseline - input.domesticPrepaid);
  const additionalLocal = Math.max(0, localTax - baselineLocal - input.localPrepaid);
  return {
    financialIncome,
    ordinary,
    comparison,
    assessed,
    decided,
    localTax,
    baseline,
    baselineLocal,
    domesticPrepaid: input.domesticPrepaid,
    localPrepaid: input.localPrepaid,
    dividendCredit: 0,
    foreignCredit: 0,
    additional: additionalNational + additionalLocal,
  };
}
