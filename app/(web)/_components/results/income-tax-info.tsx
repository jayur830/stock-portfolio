import { HelpCircle } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function TaxInfoTooltip() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="cursor-pointer text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
          type="button"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 md:w-96">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">종합소득세 계산 방식</h4>

          <div className="space-y-2 text-xs">
            <div>
              <p className="font-medium text-gray-700">1. 기준 금액</p>
              <p className="text-gray-600 ml-2">• 금융소득 2,000만원 이하: 분리과세 (15.4%)</p>
              <p className="text-gray-600 ml-2">• 금융소득 2,000만원 초과: 종합과세 대상</p>
            </div>

            <div>
              <p className="font-medium text-gray-700">2. 세액 계산</p>
              <div className="ml-2 space-y-1">
                <p className="text-gray-600">① 분리과세분 (2,000만원)</p>
                <p className="text-gray-500 ml-3 font-mono text-[10px]">2,000만원 × 15.4%</p>

                <p className="text-gray-600 mt-2">② 초과분 종합과세</p>
                <p className="text-gray-500 ml-3 font-mono text-[10px]">(초과금액 × 1.11) × 누진세율 - 누진공제</p>
                <p className="text-gray-500 ml-3 text-[10px]">* 1.11: 배당세액공제 Gross-up</p>

                <p className="text-gray-600 mt-2">③ 지방소득세</p>
                <p className="text-gray-500 ml-3 font-mono text-[10px]">소득세 × 10%</p>

                <p className="text-gray-600 mt-2">④ 배당세액공제</p>
                <p className="text-gray-500 ml-3 font-mono text-[10px]">Gross-up 금액 × 15%</p>
              </div>
            </div>

            <div>
              <p className="font-medium text-gray-700">3. 최종 납부/환급액</p>
              <p className="text-gray-500 ml-2 font-mono text-[10px]">총 세액 - 원천징수액 - 배당세액공제</p>
            </div>

            <div className="bg-blue-50 p-2 rounded">
              <p className="text-gray-700 font-medium">💡 외국 배당의 경우</p>
              <p className="text-gray-600 ml-2 mt-1">• 배당세액공제 미적용 (Gross-up 없음)</p>
              <p className="text-gray-600 ml-2">• 외국납부세액공제 적용</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface IncomeTaxInfoProps {
  /** 종합소득세 추가 납부세액 */
  additionalTax: number;
}

export default function IncomeTaxInfo({ additionalTax }: IncomeTaxInfoProps) {
  return (
    <>
      <div className="border-t pt-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">종합과세 대상</div>
              <TaxInfoTooltip />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              금융소득이 2,000만원을 초과하여 종합과세 대상입니다.
            </div>
          </div>
        </div>
      </div>
      <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-2 rounded-md p-3 ${
        additionalTax > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : additionalTax === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
      }`}
      >
        <span className={`text-sm font-semibold ${
          additionalTax > 0 ? 'text-red-900 dark:text-red-100' : additionalTax === 0 ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'
        }`}
        >
          {additionalTax > 0 ? '내년 추가 납부 예정' : additionalTax === 0 ? '내년 납부 없음' : '내년 환급 예정'}
        </span>
        <span className={`text-base md:text-lg font-bold ${
          additionalTax > 0 ? 'text-red-600 dark:text-red-400' : additionalTax === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
        }`}
        >
          {additionalTax.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원
        </span>
      </div>
    </>
  );
}
