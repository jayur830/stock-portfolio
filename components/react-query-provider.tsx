'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import * as sizeSensor from 'size-sensor';

// size-sensor 런타임 unmount 시 disconnect 에러 안전 방어
if (typeof window !== 'undefined') {
  try {
    const rawClear = (sizeSensor as unknown as { clear?: (el: HTMLElement) => void }).clear;
    if (typeof rawClear === 'function') {
      (sizeSensor as unknown as { clear: (el: HTMLElement) => void }).clear = function safeClear(element: HTMLElement) {
        try {
          return rawClear(element);
        } catch {
          // size-sensor unmount 시 발생하는 disconnect undefined 무해하게 흡수
        }
      };
    }
  } catch {
    // ignore
  }

  window.addEventListener('error', (event) => {
    if (
      event.message?.includes("reading 'disconnect'") ||
      (event.error && typeof event.error.message === 'string' && event.error.message.includes("reading 'disconnect'"))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      typeof event.reason.message === 'string' &&
      event.reason.message.includes("reading 'disconnect'")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function ReactQueryProvider({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
