import { connection } from 'next/server';

import { DarkModeSwitch } from '@/components/dark-mode-switch';

import CalculatorFormProvider from './_components/calculator-form-provider';
import CalculatorTabs from './_components/calculator-tabs';
import Inputs from './_components/inputs';
import Results from './_components/results';

export default async function Page() {
  await connection();
  return (
    <main aria-label="배당주 포트폴리오 계산기" className="flex flex-col overflow-x-hidden">
      <div className="fixed flex justify-between items-center gap-4 p-4 w-full z-50 backdrop-blur-sm">
        {/** 배당금 계산/투자금 계산 탭 */}
        <CalculatorTabs />
        {/** 다크모드 스위치 */}
        <DarkModeSwitch />
      </div>

      <div className="flex flex-col mt-16 p-4">
        <CalculatorFormProvider>
          {/** 입력 영역 */}
          <Inputs />

          {/** 결과 */}
          <Results />
        </CalculatorFormProvider>
      </div>
    </main>
  );
}
