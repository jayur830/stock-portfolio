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
    <Tabs className="flex-1 w-full" onValueChange={handleTabChange} value={activeTab}>
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="dividend">배당금 계산</TabsTrigger>
        <TabsTrigger value="investment">투자금 계산</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
