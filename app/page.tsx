import { ArrowDown, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Wallet } from 'lucide-react';
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
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a aria-label="Dividend Lab 홈" className="topbar-brand" href="#">
            <span aria-hidden="true" className="brand-mark">
              <BrandLogo size={17} />
            </span>
            <span className="topbar-name">Dividend Lab</span>
          </a>
          <nav aria-label="주 메뉴" className="topbar-nav">
            <a href="#calculator">계산기</a>
            <a href="#dividend-guide">투자 가이드</a>
          </nav>
          <div className="topbar-actions">
            <DarkModeSwitch />
            <a className="nav-start" href="#calculator">
              시작하기 <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </header>

      <main aria-label="배당주 포트폴리오 계산기" className="page-content">
        <section aria-labelledby="hero-title" className="page-hero">
          <div className="hero-badge">
            <span />
            작은 계획에서 시작하는 배당 투자
          </div>
          <h1 className="page-hero-title" id="hero-title">
            투자는 차분하게.
            <br />
            <span>배당은 꾸준하게.</span>
          </h1>
          <p className="page-hero-desc">
            오늘의 포트폴리오가 만드는 내일의 현금흐름.
            <br />
            월별 배당부터 세후 수익까지, 한곳에서 설계하세요.
          </p>
          <div className="hero-actions">
            <a className="hero-primary" href="#calculator">
              포트폴리오 만들기 <ArrowUpRight size={18} />
            </a>
            <a className="hero-secondary" href="#dividend-guide">
              투자 가이드 <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-capabilities">
            <span>
              <CalendarDays size={15} />
              월별 배당 흐름
            </span>
            <span>
              <Wallet size={15} />
              세후 수익 계산
            </span>
            <span>
              <ChartNoAxesCombined size={15} />
              배당 재투자 시뮬레이션
            </span>
          </div>
        </section>

        <section aria-labelledby="calculator-title" className="calculator-section" id="calculator">
          <div className="calculator-intro">
            <p className="section-eyebrow">YOUR NEXT CHAPTER</p>
            <h2 id="calculator-title">나의 배당 플랜을 만들어보세요.</h2>
            <p>투자금과 종목을 담으면, 예상 수익이 명확해집니다.</p>
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

        <div id="dividend-guide">
          <GuideSection />
        </div>
        <section aria-labelledby="closing-title" className="closing-section">
          <p>미래의 나에게, 꾸준한 현금흐름을.</p>
          <h2 id="closing-title">
            다음 배당을
            <br />
            <span>지금 계획하세요.</span>
          </h2>
          <a className="hero-primary" href="#calculator">
            배당 플랜 시작하기 <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
