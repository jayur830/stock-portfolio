import { connection } from 'next/server';

import BrandLogo from '@/components/brand-logo';
import { DarkModeSwitch } from '@/components/dark-mode-switch';
import Footer from '@/components/footer';
import GlassBox, { defaultOptics } from '@/components/glass-box';

import CalculatorFormProvider from './_components/CalculatorFormProvider';
import CalculatorTabs from './_components/CalculatorTabs';
import GuideSection from './_components/GuideSection';
import Inputs from './_components/inputs';
import Results from './_components/results';

export default async function Page() {
  await connection();

  return (
    <div className="app-shell flex flex-col justify-between w-full min-h-screen">
      <header className="topbar">
        <GlassBox
          optics={{
            ...defaultOptics,
            strength: 0.04,
            depth: 1,
            curvature: 1,
            dispersion: 0.8,
            frost: 2,
            brightness: 0.1,
          }}
          style={{ width: '100%' }}
        >
          <div className="topbar-inner">
            <div className="topbar-brand">
              <div aria-hidden="true" className="brand-mark">
                <BrandLogo size={18} />
              </div>
              <span className="topbar-name">Dividend Lab</span>
            </div>
            {/** 배당금 계산/투자금 계산 탭 */}
            <CalculatorTabs />
            <DarkModeSwitch />
          </div>
        </GlassBox>
      </header>

      <main aria-label="배당주 포트폴리오 계산기" className="page-content flex-1 w-full">
        <div className="mx-auto w-full max-w-desktop">
          <div className="page-hero">
            <h1 className="page-hero-title">배당 포트폴리오, 현금흐름으로 설계하기</h1>
            <p className="page-hero-desc">투자금과 목표 배당금을 입력하면 월별 입금 흐름과 세후 실수령액을 바로 계산합니다.</p>
          </div>
          <CalculatorFormProvider>
            <div className="workspace-grid">
              <section aria-labelledby="portfolio-builder-title" className="input-column">
                <div className="section-heading">
                  <span className="section-index">01</span>
                  <div>
                    <span className="section-kicker">Build your plan</span>
                    <h2 className="section-title" id="portfolio-builder-title">포트폴리오 구성</h2>
                  </div>
                </div>
                <Inputs />
              </section>

              <aside aria-labelledby="portfolio-result-title" className="result-column">
                <div className="results-heading">
                  <div className="section-heading">
                    <span className="section-index">02</span>
                    <div>
                      <span className="section-kicker">See the flow</span>
                      <h2 className="section-title" id="portfolio-result-title">현금흐름 미리보기</h2>
                    </div>
                  </div>
                </div>
                <Results />
              </aside>
            </div>
          </CalculatorFormProvider>

          {/* 배당 투자 가이드 & FAQ 섹션 (애드센스 고가치 정보성 콘텐츠) */}
          <GuideSection />
        </div>
      </main>

      {/** OpenToyApp 푸터 */}
      <Footer />
    </div>
  );
}
