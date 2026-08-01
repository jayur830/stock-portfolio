'use client';

import { Calculator, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    label: '홈',
    href: '/m/home',
    Icon: Home,
  },
  {
    label: '계산기',
    href: '/m/calculator',
    Icon: Calculator,
  },
];

export default function Layout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* 메인 콘텐츠 영역 (하단 내비게이션 바 높이 고려하여 하단 여백 부여) */}
      <main className="flex-1 pb-20">{children}</main>

      {/* 하단 내비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-200">
        <div className="mx-auto flex h-16 w-full items-center">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                className={cn(
                  'relative flex h-full flex-1 basis-0 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-all duration-200 active:scale-95',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
                href={href}
                key={href}
              >
                {/* 활성화 탭 인디케이터 */}
                {isActive && (
                  <span className="absolute -top-px h-0.5 w-8 rounded-full bg-primary transition-all duration-300 shadow-sm" />
                )}

                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl p-1 transition-all duration-200',
                    isActive && 'bg-primary/10 scale-110',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* 모바일 하단 Safe Area 마진 */}
        <div className="h-[env(safe-area-inset-bottom)] bg-background/80" />
      </nav>
    </div>
  );
}
