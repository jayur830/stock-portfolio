'use client';

import { HelpCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateHealthInsurance } from '@/lib/utils';

export interface HealthInsuranceInfoProps {
  /** 연간 배당소득 (세전) */
  annualDividend: number;
}

export default function HealthInsuranceInfo({ annualDividend }: HealthInsuranceInfoProps) {
  const {
    isDependentEligible,
    dependentRemainingAmount,
    dependentExcessAmount,
    monthlyExtraHealthInsurance,
    annualExtraHealthInsurance,
    isRegionalCombined,
  } = calculateHealthInsurance(annualDividend);

  return (
    <div className="tax-surface">
      <div className="flex items-center justify-between">
        <h3 className="tax-surface-title">건강보험료 정보</h3>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="건강보험료 부과 기준 안내"
              className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 md:w-96 text-xs space-y-2.5 p-3.5">
            <h4 className="font-semibold text-sm">건강보험료 부과 기준</h4>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <div>
                <p className="font-semibold text-foreground">1. 피부양자 자격 기준</p>
                <p className="ml-2">
                  • 연간 금융소득(이자/배당) 2,000만원 초과 시 피부양자 자격이 상실되어 지역가입자로 전환됩니다.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">2. 직장가입자 소득월액 보험료</p>
                <p className="ml-2">
                  • 월급 외 소득(배당 등)이 연 2,000만원을 초과하는 경우, 초과 금액에 대해 건강보험료(약 8.01%)가 추가
                  부과됩니다.
                </p>
                <p className="ml-2 text-[11px] font-mono text-muted-foreground/80">
                  * 건보료율 7.09% + 장기요양보험료율 12.95% 적용
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">3. 지역가입자 건보료 합산</p>
                <p className="ml-2">
                  • 연간 금융소득이 1,000만원을 초과하면 전액이 건보료 산정 소득 점수에 합산됩니다.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="tax-line">
        <span className="tax-label">피부양자 자격</span>
        <span
          className={`tax-value flex items-center gap-1 ${
            isDependentEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isDependentEligible ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>유지 가능</span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>상실 대상 (지역 전환)</span>
            </>
          )}
        </span>
      </div>

      <div className="tax-line">
        <span className="tax-label">{isDependentEligible ? '피부양자 잔여 한도' : '2,000만원 초과액'}</span>
        <span className="tax-value is-muted">
          {isDependentEligible
            ? `${dependentRemainingAmount.toLocaleString('ko-KR')} 원`
            : `${dependentExcessAmount.toLocaleString('ko-KR')} 원`}
        </span>
      </div>

      <div className="tax-line">
        <span className="tax-label">직장인 추가 건보료</span>
        <span className="tax-value">
          {monthlyExtraHealthInsurance > 0 ? (
            <span>
              월 약 {monthlyExtraHealthInsurance.toLocaleString('ko-KR')}원
              <span className="text-[11px] font-normal text-muted-foreground ml-1">
                (연 {annualExtraHealthInsurance.toLocaleString('ko-KR')}원)
              </span>
            </span>
          ) : (
            <span className="is-muted">0원 (부과 없음)</span>
          )}
        </span>
      </div>

      <div className="tax-line">
        <span className="tax-label">지역가입자 합산</span>
        <span className={`tax-value ${isRegionalCombined ? 'text-amber-600 dark:text-amber-400' : 'is-muted'}`}>
          {isRegionalCombined ? '전액 합산 대상 (1천만 초과)' : '미합산 (1천만 이하)'}
        </span>
      </div>
    </div>
  );
}
