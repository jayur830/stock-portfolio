import { estimateComprehensiveTax, progressiveTax } from './comprehensive-tax';

const base = {
  portfolioDividend: 0,
  externalFinancialIncome: 0,
  otherIncome: 0,
  deductions: 0,
  domesticPrepaid: 0,
  localPrepaid: 0,
  foreignDividend: 0,
  excludedFromGrossUp: true,
};

describe('2026 배당가산 제외 비교과세', () => {
  it.each([
    [0, 0],
    [14e6, 840000],
    [50e6, 6240000],
    [88e6, 15360000],
    [150e6, 37060000],
    [300e6, 94060000],
    [500e6, 174060000],
    [1e9, 384060000],
  ])('과표 %s', (income, tax) => {
    expect(progressiveTax(income)).toBe(tax);
  });
  it('0원과 2천만원 경계: 일반 금융소득 14%, 별도 기준세액 없음', () => {
    expect(estimateComprehensiveTax(base).additional).toBe(0);
    expect(estimateComprehensiveTax({ ...base, portfolioDividend: 20e6 }).assessed).toBe(2800000);
    expect(estimateComprehensiveTax({ ...base, portfolioDividend: 20000001 }).assessed).toBe(2800000);
  });
  it('1억원: max((8천만원×24%-576만원)+280만원, 1400만원)=1624만원', () => {
    const result = estimateComprehensiveTax({
      ...base,
      portfolioDividend: 100e6,
      domesticPrepaid: 14e6,
      localPrepaid: 1400000,
    });
    expect(result.assessed).toBe(16240000);
    expect(result.localTax).toBe(1624000);
    expect(result.additional).toBe(2464000);
  });
  it('금융4천만원+다른소득5천만원: max(1384만원,1184만원), 기준624만원 제외', () => {
    const input = {
      ...base,
      portfolioDividend: 30e6,
      externalFinancialIncome: 10e6,
      otherIncome: 50e6,
      domesticPrepaid: 5600000,
      localPrepaid: 560000,
    };
    expect(estimateComprehensiveTax(input).additional).toBe(2200000);
    // 공제1천만원: A=1144만원, B=1034만원, 기준474만원 -> 추가110만원.
    expect(estimateComprehensiveTax({ ...input, deductions: 10e6 }).additional).toBe(1210000);
  });
  it.each([-1, NaN, Infinity, undefined])('잘못된 입력 %s 거절', (value) => {
    expect(() => estimateComprehensiveTax({ ...base, otherIncome: value as number })).toThrow();
  });
  it('해외·혼합, 배당가산 미확인은 0원이 아닌 미지원', () => {
    expect(() => estimateComprehensiveTax({ ...base, foreignDividend: 1000 })).toThrow('해외·혼합');
    expect(() => estimateComprehensiveTax({ ...base, excludedFromGrossUp: false })).toThrow('배당가산');
  });
});
