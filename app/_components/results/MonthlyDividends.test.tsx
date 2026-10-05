'use client';

import { render } from '@testing-library/react';

import MonthlyDividends from './MonthlyDividends';

describe('MonthlyDividends', () => {
  it('전달받은 amounts 배열을 월별 행과 연간 합계로 올바르게 표시한다', () => {
    // 12개월 배당금 (3월, 6월, 9월, 12월 각 100,000원)
    const amounts = [
      0, 0, 100000, 0, 0, 100000, 0, 0, 100000, 0, 0, 100000,
    ];

    const { container } = render(<MonthlyDividends amounts={amounts} />);

    // 연간 합계 세후 400,000원 확인
    const totalEl = container.querySelector('.ledger-total-value');
    expect(totalEl?.textContent).toContain('400,000원');

    // 12개 월별 행이 렌더링되는지 확인
    const rowAmounts = Array.from(container.querySelectorAll('.ledger-amount')).map(
      (el) => el.textContent,
    );
    expect(rowAmounts).toHaveLength(12);
    expect(rowAmounts[2]).toContain('100,000원'); // 3월
    expect(rowAmounts[0]).toContain('0원'); // 1월
  });

  it('amounts가 변경되면 UI의 월별 금액과 연간 합계가 즉시 갱신된다', () => {
    const initialAmounts = [
      0, 0, 100000, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    const { container, rerender } = render(<MonthlyDividends amounts={initialAmounts} />);

    expect(container.querySelector('.ledger-total-value')?.textContent).toContain('100,000원');

    // 새로운 계산 결과로 amounts가 갱신되었을 때
    const updatedAmounts = [
      0, 0, 250000, 0, 0, 250000, 0, 0, 0, 0, 0, 0,
    ];
    rerender(<MonthlyDividends amounts={updatedAmounts} />);

    expect(container.querySelector('.ledger-total-value')?.textContent).toContain('500,000원');
    const rowAmounts = Array.from(container.querySelectorAll('.ledger-amount')).map(
      (el) => el.textContent,
    );
    expect(rowAmounts[2]).toContain('250,000원');
    expect(rowAmounts[5]).toContain('250,000원');
  });

  it('배당금이 가장 높은 월에 피크(is-peak) 클래스가 적용된다', () => {
    const amounts = [
      0, 0, 50000, 0, 0, 200000, 0, 0, 100000, 0, 0, 0,
    ];
    const { container } = render(<MonthlyDividends amounts={amounts} />);

    const peakRow = container.querySelector('.ledger-row.is-peak');
    expect(peakRow).not.toBeNull();
    expect(peakRow?.querySelector('.ledger-month')?.textContent).toBe('06월');
    expect(peakRow?.querySelector('.ledger-amount')?.textContent).toContain('200,000원');
  });
});
