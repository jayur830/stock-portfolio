'use client';

import { Ellipsis, Home, MessageCircle, PieChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: '홈', href: '/m/home', Icon: Home },
  { label: 'My 포트', href: '/m/portfolio', Icon: PieChart },
  { label: '커뮤니티', href: '/m/community', Icon: MessageCircle },
  { label: '더보기', href: '/m/more', Icon: Ellipsis },
];

export default function Layout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background text-foreground">
      <main className="flex-1 max-w-140 w-full pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-140 border-t border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-200">
        <div className="flex h-16 items-center">
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
                {isActive && <span className="absolute -top-px h-0.5 w-full rounded-full bg-primary shadow-sm transition-all duration-300" />}
                <div className={cn('flex items-center justify-center rounded-xl p-1 transition-all duration-200', isActive && 'scale-110')}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={isActive ? 'font-bold' : undefined}>{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-background/80" />
      </nav>
    </div>
  );
}
