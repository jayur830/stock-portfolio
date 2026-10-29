import { Suspense } from 'react';

import Footer from '@/components/footer';
import SiteHeader from '@/components/site-header';

import CalculatorFormProvider from './_components/CalculatorFormProvider';
import CalculatorTabs from './_components/CalculatorTabs';
import Inputs from './_components/inputs';
import Results from './_components/results';

export default function Page() {
  return (
    <div className="app-shell">
      <SiteHeader activePage="calculator" />
      <main aria-label="배당주 포트폴리오 계산기" className="page-content calculator-page">
        <section aria-labelledby="calculator-title" className="calculator-section" id="calculator">
          <div className="calculator-intro">
            <h1 id="calculator-title">배당주 포트폴리오 계산기</h1>
            <p>투자금과 종목을 입력해 예상 배당금과 월별 현금흐름을 확인하세요.</p>
          </div>
          <Suspense fallback={<div aria-label="계산기 불러오는 중" className="calculator-loading animate-pulse" />}>
            <CalculatorFormProvider>
              <div className="calculator-toolbar">
                <Suspense>
                  <CalculatorTabs />
                </Suspense>
                <span className="calculator-note">국내 · 해외 주식 지원</span>
              </div>
              <div className="workspace-grid">
                <section aria-label="포트폴리오 구성" className="input-column">
                  <Inputs />
                </section>
                <aside aria-label="예상 수익" className="result-column">
                  <Results view="summary" />
                </aside>
              </div>
              <Results view="details" />
            </CalculatorFormProvider>
          </Suspense>
        </section>
      </main>
      <Footer />
    </div>
  );
}
