import { act, renderHook } from '@testing-library/react';

import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('초기값을 즉시 반환한다', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('delay 시간 후 값을 업데이트한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('delay 시간 전에 값이 변경되면 타이머를 리셋한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 500 },
    });

    rerender({ value: 'second', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('first');

    rerender({ value: 'third', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('third');
  });

  it('여러 번 값이 변경되면 마지막 값만 적용한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'v1', delay: 300 },
    });

    rerender({ value: 'v2', delay: 300 });
    rerender({ value: 'v3', delay: 300 });
    rerender({ value: 'v4', delay: 300 });

    expect(result.current).toBe('v1');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('v4');
  });

  it('delay가 0일 때 즉시 업데이트한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 0 },
    });

    rerender({ value: 'updated', delay: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current).toBe('updated');
  });

  it('delay 값이 변경되면 새로운 delay로 동작한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    rerender({ value: 'updated', delay: 100 });

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');
  });

  it('unmount 시 타이머를 정리한다', () => {
    const { unmount, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    rerender({ value: 'updated', delay: 500 });

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
