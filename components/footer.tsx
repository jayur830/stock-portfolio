import { OpenToyAppLogo, OpenToyAppTextLogo } from '@/components/opentoyapp-logo';

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border/70 bg-card/60 text-muted-foreground backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(1.25rem,4vw,3.5rem)] py-8 pb-28 sm:pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-12">
          {/* 브랜드 & 소개 */}
          <div className="flex flex-col gap-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2.5 text-foreground">
              <OpenToyAppLogo className="h-9 w-auto dark:invert" />
              <OpenToyAppTextLogo className="h-4.5 w-auto text-foreground" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong>opentoyapp</strong>은 다양한 영역에서 유용한 웹 도구를 개발하는 토이 프로젝트 연구소입니다.
              배당주 포트폴리오 시뮬레이터를 비롯해 다양하고 실용적인 웹 애플리케이션을 만들어갑니다.
            </p>
          </div>

          {/* 서비스 안내 & 면책조항 */}
          <div className="flex flex-col gap-1.5 md:max-w-sm md:text-right">
            <h4 className="text-[11px] font-bold tracking-wider text-foreground uppercase">Disclaimer</h4>
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              본 서비스에서 제공하는 배당금, 주가 및 환율 정보는 시장 데이터를 기반으로 산출된 시뮬레이션 결과로, 실제 수치와 다를 수 있으며 투자 결과에 대한 법적 책임을 지지 않습니다.
            </p>
          </div>
        </div>

        {/* 하단 카피라이트 */}
        <div className="mt-6 border-t border-border/40 pt-4 text-[11px] text-muted-foreground/70">
          <p>© {new Date().getFullYear()} opentoyapp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
