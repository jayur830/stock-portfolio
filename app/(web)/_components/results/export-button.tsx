'use client';

import { FileDown } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { exportPortfolioToCsv } from '@/lib/export-excel';
import type { FormValues } from '@/types';

interface ExportButtonProps {
  className?: string;
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
}

export default function ExportButton({
  className = '',
  variant = 'outline',
}: ExportButtonProps) {
  const { getValues } = useFormContext<FormValues>();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(() => {
    try {
      setIsExporting(true);
      const values = getValues();
      exportPortfolioToCsv(values);
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error);
    } finally {
      setIsExporting(false);
    }
  }, [getValues]);

  return (
    <Button
      aria-label="포트폴리오 분석 결과 엑셀(CSV) 다운로드"
      className={`export-action ${className}`}
      disabled={isExporting}
      onClick={handleExport}
      title="포트폴리오 분석 결과 엑셀(CSV) 다운로드"
      type="button"
      variant={variant}
    >
      <FileDown className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="hidden sm:inline">{isExporting ? '내보내는 중...' : '엑셀 내보내기'}</span>
    </Button>
  );
}
