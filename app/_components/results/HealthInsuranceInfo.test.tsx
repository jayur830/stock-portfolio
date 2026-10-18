import { render } from '@testing-library/react';

import HealthInsuranceInfo from './HealthInsuranceInfo';

describe('HealthInsuranceInfo', () => {
  it('renders correctly when dividend is 10,000,000 KRW or less', () => {
    const { container } = render(<HealthInsuranceInfo annualDividend={5_000_000} />);

    expect(container.textContent).toContain('건강보험료 정보');
    expect(container.textContent).toContain('유지 가능');
    expect(container.textContent).toContain('피부양자 잔여 한도');
    expect(container.textContent).toContain('15,000,000 원');
    expect(container.textContent).toContain('0원 (부과 없음)');
    expect(container.textContent).toContain('미합산 (1천만 이하)');
  });

  it('renders correctly when dividend is 25,000,000 KRW (exceeds 20M)', () => {
    const { container } = render(<HealthInsuranceInfo annualDividend={25_000_000} />);

    expect(container.textContent).toContain('상실 대상 (지역 전환)');
    expect(container.textContent).toContain('2,000만원 초과액');
    expect(container.textContent).toContain('5,000,000 원');
    expect(container.textContent).toContain('전액 합산 대상 (1천만 초과)');
    expect(container.textContent).toContain('월 약');
  });
});
