import { useEffect, useState } from 'react';

/**
 * 값을 debounce 처리하는 커스텀 훅
 * @param value - debounce할 값
 * @param delay - 지연 시간 (ms)
 * @returns debounced된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
