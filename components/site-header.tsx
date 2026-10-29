import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import BrandLogo from '@/components/brand-logo';
import { DarkModeSwitch } from '@/components/dark-mode-switch';

export default function SiteHeader({ activePage }: { activePage: 'calculator' | 'about' }) {
  const calculatorHref = activePage === 'calculator' ? '#calculator' : '/#calculator';

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link aria-label="Dividend Lab 홈" className="topbar-brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            <BrandLogo size={17} />
          </span>
          <span className="topbar-name">Dividend Lab</span>
        </Link>
        <nav aria-label="주 메뉴" className="topbar-nav">
          <Link aria-current={activePage === 'calculator' ? 'page' : undefined} href={calculatorHref}>
            계산기
          </Link>
          <Link aria-current={activePage === 'about' ? 'page' : undefined} href="/about">
            서비스 소개
          </Link>
        </nav>
        <div className="topbar-actions">
          <DarkModeSwitch />
          <Link className="nav-start" href={calculatorHref}>
            시작하기 <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
