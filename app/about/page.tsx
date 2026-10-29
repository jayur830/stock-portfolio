import { ArrowDown, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import GuideSection from '@/app/_components/GuideSection';
import Footer from '@/components/footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: '서비스 소개 | Dividend Lab',
  description:
    '국내외 배당주 포트폴리오의 예상 배당금, 필요 투자금, 월별 현금흐름을 설계하는 Dividend Lab을 소개합니다.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="app-shell">
      <SiteHeader activePage="about" />
      <main aria-label="Dividend Lab 서비스 소개" className="page-content">
        <section aria-labelledby="hero-title" className="page-hero">
          <div className="hero-badge">작은 계획에서 시작하는 배당 투자</div>
          <h1 className="page-hero-title" id="hero-title">
            투자는 차분하게.
            <br />
            <span>배당은 꾸준하게.</span>
          </h1>
          <p className="page-hero-desc">
            Dividend Lab은 국내외 배당주를 조합해 예상 현금흐름을 설계하는 계산기입니다.
            <br />
            월별 배당부터 세후 수익까지, 한곳에서 설계하세요.
          </p>
          <div className="hero-actions">
            <Link className="hero-primary" href="/#calculator">
              계산기 시작하기 <ArrowUpRight size={18} />
            </Link>
            <Link className="hero-secondary" href="#dividend-guide">
              투자 가이드 <ArrowDown size={16} />
            </Link>
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

        <section aria-labelledby="features-title" className="about-overview">
          <div className="calculator-intro">
            <h2 id="features-title">배당 계획에 필요한 기능을 한곳에</h2>
            <p>투자 규모부터 매달의 현금흐름까지 간편하게 살펴보세요.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: '배당금 · 투자금 계산',
                description: '투자금에 따른 예상 배당금과 목표 연 배당금에 필요한 투자금을 계산합니다.',
              },
              {
                icon: CalendarDays,
                title: '월별 현금흐름 확인',
                description: '종목별 보유 수량, 세후 배당금과 예상 건보료를 살펴보고 월별 목록과 달력으로 확인합니다.',
              },
              {
                icon: ChartNoAxesCombined,
                title: '장기 투자 시뮬레이션',
                description: '주가와 배당 이력을 비교하고, 월 적립금과 배당 재투자에 따른 자산 변화를 살펴봅니다.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <article className="rounded-3xl border border-border bg-card p-6" key={title}>
                <Icon aria-hidden="true" className="mb-5 text-muted-foreground" size={22} />
                <h3 className="text-base font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-to-title" className="about-overview">
          <div className="calculator-intro">
            <h2 id="how-to-title">세 단계로 시작하세요</h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: '계산 모드 선택',
                description: '배당금 계산 또는 투자금 계산을 선택하고 투자금이나 목표 연 배당금을 입력하세요.',
              },
              {
                title: '포트폴리오 구성',
                description: '종목을 추가하고 배당률, 배당월, 투자 비중을 설정하세요. 해외 주식은 환율도 확인하세요.',
              },
              {
                title: '결과 확인',
                description:
                  '결과 계산하기를 눌러 예상 수익을 확인하세요. 입력값이 담긴 URL로 포트폴리오를 다시 열 수 있습니다.',
              },
            ].map(({ title, description }, index) => (
              <li className="border-t border-border pt-5" key={title}>
                <span className="text-xs text-muted-foreground">0{index + 1}</span>
                <h3 className="mt-3 text-base font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
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
          <Link className="hero-primary" href="/#calculator">
            계산기 시작하기 <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
