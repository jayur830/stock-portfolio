import { HelpCircle } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function IncomeTaxInfo() {
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
