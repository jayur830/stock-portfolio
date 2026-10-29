import { fireEvent, render, screen } from '@testing-library/react';

import ComprehensiveTaxInfo from './ComprehensiveTaxInfo';

describe('ComprehensiveTaxInfo', () => {
  it.each([
    [0, '0원'],
    [20_000_000, '20,000,000원'],
    [25_000_000, '25,000,000원'],
  ] as const)('포트폴리오 세전 배당금 %s원을 신고 여부 판단 없이 안내한다', (annualDividend, formattedDividend) => {
    const { container } = render(<ComprehensiveTaxInfo annualDividend={annualDividend} />);
    const text = container.textContent || '';

    expect(text).toContain('종합소득세 예상 계산');
    expect(text).toContain('이 포트폴리오 기준 연간 세전 배당금');
    expect(text).toContain(formattedDividend);
    expect(text).toContain('2,000만원');
    expect(text).toContain('이 포트폴리오 정보만으로 신고 대상 여부를 판단하지 않습니다.');
    expect(text).not.toMatch(/신고 불필요|추가 납부 없음|환급 예정/);
  });
});

it('필수 입력을 검증하고 계산·변경 시 결과를 갱신한다', () => {
  render(<ComprehensiveTaxInfo annualDividend={40000000} />);
  fireEvent.click(screen.getByRole('button', { name: '예상 세액 계산' }));
  expect(screen.getByRole('alert').textContent).toContain('모든 금액');
  const inputs = screen.getAllByRole('spinbutton');
  ['0', '50000000', '0', '5600000', '560000'].forEach((value, index) =>
    fireEvent.change(inputs[index], { target: { value } }),
  );
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: '예상 세액 계산' }));
  expect(screen.getByRole('status').textContent).toContain('2,200,000원');
  fireEvent.change(inputs[2], { target: { value: '10000000' } });
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '예상 세액 계산' }));
  expect(screen.getByRole('status').textContent).toContain('1,210,000원');
});
