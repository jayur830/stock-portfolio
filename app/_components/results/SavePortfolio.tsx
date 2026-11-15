'use client';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { readPortfolios, savePortfolio, writePortfolios } from '@/lib/saved-portfolios';

import { useAppliedCalculation } from '../AppliedCalculationContext';
export default function SavePortfolio() {
  const applied = useAppliedCalculation();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  if (!applied) return null;
  return (
    <div className="result-surface space-y-2">
      <p className="text-xs text-muted-foreground">
        마지막 정상 계산의 구성을 이 브라우저에 저장합니다. 수정 중인 미계산 입력은 포함하지 않습니다.
      </p>
      <Input
        aria-label="저장할 포트폴리오 이름"
        placeholder="포트폴리오 이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        type="button"
        onClick={() => {
          try {
            writePortfolios([...readPortfolios(), savePortfolio(applied, name)]);
            setMessage('저장했습니다.');
          } catch {
            setMessage('저장하지 못했습니다. 이름·저장 데이터·브라우저 저장 공간 및 접근 권한을 확인해주세요.');
          }
        }}
      >
        포트폴리오 저장
      </Button>
      <Link href="/compare" className="ml-3 text-sm text-primary">
        저장 목록·비교
      </Link>
      <p role="status" className="text-xs">
        {message}
      </p>
    </div>
  );
}
