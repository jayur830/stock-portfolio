'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { setSearchParams } from '@/lib/utils';
import type { Category } from '@/types';

export default function CalculatorTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsObject = Object.fromEntries(searchParams.entries());
  const activeTab = (searchParams.get('tab') || 'dividend') as Category;

  const handleTabChange = useCallback((value: string) => {
    setSearchParams(pathname, { ...searchParamsObject, tab: value });
  }, [pathname, searchParamsObject]);

  return (
    <Tabs aria-label="계산 모드 선택" className="calculator-mode-tabs" onValueChange={handleTabChange} value={activeTab}>
      <TabsList className="calculator-mode-list">
        <TabsTrigger className="calculator-mode-trigger" value="dividend">배당금 계산</TabsTrigger>
        <TabsTrigger className="calculator-mode-trigger" value="investment">투자금 계산</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
