import { connection } from 'next/server';

import BrandLogo from '@/components/brand-logo';
import { DarkModeSwitch } from '@/components/dark-mode-switch';
import Footer from '@/components/footer';

import CalculatorFormProvider from './_components/calculator-form-provider';
import CalculatorTabs from './_components/calculator-tabs';
import Inputs from './_components/inputs';
import Results from './_components/results';

export default async function Page() {
  await connection();
  return (
    <div className="app-shell flex flex-col justify-between w-full min-h-screen">
      <header className="site-header w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="site-header-inner">
          <div className="brand-lockup">
            <div aria-hidden="true" className="brand-mark">
              <BrandLogo size={20} />
            </div>
            <div>
              <span className="brand-name">DIVIDEND<span>LAB</span></span>
              <span className="brand-subtitle">INCOME, BY DESIGN</span>
            </div>
          </div>

          <div className="header-actions">
            {/** 배당금 계산/투자금 계산 탭 */}
            <CalculatorTabs />
            <div aria-hidden="true" className="header-divider" />
            {/** 다크모드 스위치 */}
            <DarkModeSwitch />
          </div>
        </div>
      </header>

      <main aria-label="배당주 포트폴리오 계산기" className="page-content flex-1 w-full">
        <div className="mx-auto w-full max-w-desktop">
          <CalculatorFormProvider>
            <div className="workspace-grid">
              <section aria-labelledby="portfolio-builder-title" className="input-column">
                <div className="section-heading">
                  <span className="section-index">01</span>
                  <div>
                    <span className="section-kicker">BUILD YOUR PLAN</span>
                    <h2 className="section-title" id="portfolio-builder-title">포트폴리오 구성</h2>
                    <p className="section-description">기준 금액과 종목별 비중을 입력해 나만의 배당 설계를 시작하세요.</p>
                  </div>
                </div>
                <Inputs />
              </section>

              <aside aria-labelledby="portfolio-result-title" className="result-column">
                <div className="results-heading">
                  <div className="section-heading">
                    <span className="section-index">02</span>
                    <div>
                      <span className="section-kicker">SEE THE FLOW</span>
                      <h2 className="section-title" id="portfolio-result-title">현금흐름 미리보기</h2>
                    </div>
                  </div>
                </div>
                <Results />
              </aside>
            </div>
          </CalculatorFormProvider>
        </div>
      </main>

      {/** OpenToyApp 푸터 */}
      <Footer />
    </div>
  );
}
