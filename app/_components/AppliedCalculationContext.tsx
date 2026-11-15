'use client';

import { createContext, useContext } from 'react';

import type { AppliedCalculation } from '@/types';

export const AppliedCalculationContext = createContext<AppliedCalculation | null>(null);
export const useAppliedCalculation = () => useContext(AppliedCalculationContext);
