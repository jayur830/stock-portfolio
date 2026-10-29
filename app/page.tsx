import { Suspense } from 'react';

import BrandLogo from '@/components/brand-logo';
import { DarkModeSwitch } from '@/components/dark-mode-switch';
import Footer from '@/components/footer';

import CalculatorFormProvider from './_components/CalculatorFormProvider';
import CalculatorTabs from './_components/CalculatorTabs';
import GuideSection from './_components/GuideSection';
import Inputs from './_components/inputs';
import Results from './_components/results';

export default function Page() {
  return (
    <div className="app-shell flex flex-col justify-between w-full min-h-screen">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <div aria-hidden="true" className="brand-mark">
              <BrandLogo size={18} />
            </div>
            <span className="topbar-name">
              Dividend<span className="brand-wordmark-light"> Lab</span>
            </span>
          </div>
          {/** 배당금 계산/투자금 계산 탭 */}
          <Suspense fallback={<div className="h-9 w-44 rounded-lg bg-muted/40 animate-pulse" />}>
            <CalculatorTabs />
          </Suspense>
          <DarkModeSwitch />
        </div>
      </header>

      <main aria-label="배당주 포트폴리오 계산기" className="page-content flex-1 w-full">
        <div className="mx-auto w-full max-w-desktop">
          <div className="page-hero">
            <p className="page-eyebrow">나의 배당 투자 플랜</p>
            <h1 className="page-hero-title">꾸준한 배당, 명확한 계획.</h1>
            <p className="page-hero-desc">내 포트폴리오의 월별 배당금과 세후 수익을 미리 확인하세요.</p>
          </div>
          <Suspense
            fallback={
              <div className="workspace-grid animate-pulse">
                <div className="h-[600px] rounded-2xl border border-border/40 bg-card/40" />
                <div className="h-[600px] rounded-2xl border border-border/40 bg-card/40" />
              </div>
            }
          >
            <CalculatorFormProvider>
              <div className="workspace-grid">
                <section aria-labelledby="portfolio-builder-title" className="input-column">
                  <div className="section-heading">
                    <div>
                      <h2 className="section-title" id="portfolio-builder-title">
                        포트폴리오 구성
                      </h2>
                    </div>
                  </div>
                  <Inputs />
                </section>

                <aside aria-labelledby="portfolio-result-title" className="result-column">
                  <div className="results-heading">
                    <div className="section-heading">
                      <div>
                        <h2 className="section-title" id="portfolio-result-title">
                          예상 수익
                        </h2>
                      </div>
                    </div>
                  </div>
                  <Results view="summary" />
                </aside>
              </div>
              <Results view="details" />
            </CalculatorFormProvider>
          </Suspense>

          {/* 배당 투자 가이드 & FAQ 섹션 (애드센스 고가치 정보성 콘텐츠) */}
          <GuideSection />
        </div>
      </main>

      {/** OpenToyApp 푸터 */}
      <Footer />
    </div>
  );
}
