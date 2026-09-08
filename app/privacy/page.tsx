import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import BrandLogo from '@/components/brand-logo';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 배당주 포트폴리오 계산기 (Dividend Lab)',
  description: 'Dividend Lab의 개인정보처리방침 및 Google 애드센스 쿠키 사용 정책 안내입니다.',
  alternates: {
    canonical: 'https://stock-portfolio.opentoyapp.kr/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* 헤더 */}
      <header className="w-full border-b border-border/70 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 w-full max-w-desktop items-center justify-between px-[clamp(1.25rem,4vw,3.5rem)]">
          <Link className="flex items-center gap-2.5 group" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 transition-transform group-hover:scale-105">
              <BrandLogo size={20} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight">DIVIDEND<span className="text-emerald-500">LAB</span></span>
            </div>
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            href="/"
          >
            <ArrowLeft size={14} />
            계산기로 돌아가기
          </Link>
        </div>
      </header>

      {/* 본문 콘텐츠 */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-[clamp(1.25rem,4vw,3.5rem)] py-12">
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
              <ShieldCheck size={14} />
              <span>개인정보보호 및 쿠키 정책</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              개인정보처리방침 (Privacy Policy)
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              최종 수정일: {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 1일
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">1. 총칙</h2>
              <p>
                배당주 포트폴리오 계산기(이하 &apos;서비스&apos;, Dividend Lab)는 이용자의 개인정보를 중요시하며, &apos;개인정보 보호법&apos; 및 &apos;정보통신망 이용촉진 및 정보보호 등에 관한 법률&apos;을 준수하고 있습니다. 본 서비스는 별도의 회원가입 없이 누구나 무료로 시뮬레이션 기능을 이용할 수 있는 웹 도구입니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">2. 수집하는 개인정보 항목 및 수집 방법</h2>
              <p>
                본 서비스는 회원가입을 받지 않으며, 이용자의 성명, 주민등록번호, 연락처 등 직접적인 개인 식별 정보를 일체 서버에 수집·저장하지 않습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>포트폴리오 입력 데이터:</strong> 사용자가 입력한 종목명, 매수가, 비중, 목표 배당금 등의 데이터는 이용자의 웹 브라우저 로컬(URL 파라미터 등)에서만 처리되며, 서버 데이터베이스에 영구 저장되지 않습니다.</li>
                <li><strong>자동 수집 정보:</strong> 서비스 이용 과정에서 접속 IP, 브라우저 종류, 방문 일시, 기기 정보 등의 표준 웹 로그가 통계 및 서비스 안정성 유지를 위해 생성될 수 있습니다.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">3. Google 애드센스 및 제3자 광고 쿠키(Cookie) 안내</h2>
              <p>
                본 서비스는 웹사이트 유지 및 운영 비용 충당을 위해 Google AdSense(구글 애드센스)를 통한 광고를 게재하고 있습니다. 이와 관련하여 다음과 같은 정책이 적용됩니다:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Google 및 제3자 공급업체는 쿠키(Cookie)를 사용하여 이용자의 이전 웹사이트 방문 기록을 바탕으로 관련성 높은 맞춤형 광고를 게재합니다.
                </li>
                <li>
                  광고 쿠키를 사용함으로써 Google과 파트너사는 이용자가 본 사이트 및 인터넷의 다른 사이트를 방문한 기록을 토대로 맞춤형 광고를 제공할 수 있습니다.
                </li>
                <li>
                  이용자는{' '}
                  <a
                    className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2"
                    href="https://www.google.com/settings/ads"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Google 광고 설정
                  </a>
                  을 방문하여 개인 맞춤 광고 게재에 사용되는 쿠키 설정을 언제든지 해제(Opt-out)할 수 있습니다.
                </li>
                <li>
                  또한{' '}
                  <a
                    className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2"
                    href="https://www.aboutads.info/choices"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    aboutads.info
                  </a>
                  를 통해서도 제3자 공급업체의 맞춤 광고용 쿠키 수집을 차단할 수 있습니다.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">4. 웹로그 분석 도구 (Google Analytics)</h2>
              <p>
                서비스는 사이트 트래픽 및 사용 현황 분석을 위해 Google Analytics(구글 애널리틱스)를 사용하고 있습니다. 구글 애널리틱스는 익명화된 이용자 행태 데이터를 수집하며, 특정 개인을 식별할 수 없습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">5. 개인정보의 파기</h2>
              <p>
                본 서비스는 이용자의 개인식별 정보를 수집·보관하지 않으므로 원칙적으로 별도의 파기 대상 정보가 존재하지 않습니다. 브라우저에 임시 저장된 상태 정보는 사용자가 브라우저 캐시를 지우거나 창을 닫음으로써 언제든지 삭제할 수 있습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">6. 투자 정보에 대한 면책 고지</h2>
              <p>
                본 서비스가 제공하는 배당금, 배당수익률, 주가, 환율, 세금 계산 결과는 공개 시장 데이터를 바탕으로 한 추정치 및 시뮬레이션입니다. 실제 지급액 및 과세 금액은 시장 상황, 환율 변동, 개별 세법 적용 여부에 따라 달라질 수 있으며, 본 서비스는 본 정보에 기반한 투자 결과에 대해 법적 책임을 지지 않습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">7. 문의처</h2>
              <p>
                개인정보 처리방침 및 서비스 관련 문의사항은 아래로 연락해 주시기 바랍니다.
              </p>
              <div className="p-4 rounded-xl border border-border/70 bg-card/60">
                <p className="font-semibold text-foreground">운영자: opentoyapp</p>
                <p className="text-xs text-muted-foreground mt-1">웹사이트: https://stock-portfolio.opentoyapp.kr</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
