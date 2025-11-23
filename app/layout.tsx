import './globals.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import ReactQueryProvider from '@/components/react-query-provider';
import StructuredData from '@/components/structured-data';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#fff',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: '배당주 포트폴리오 계산기 | 배당금 자동 계산',
  description: '배당주 투자를 위한 포트폴리오 관리 도구. 총 투자금으로 예상 배당금 계산, 목표 배당금으로 필요 투자금 계산. 국내/해외 주식 지원, 환율 자동 환산.',
  keywords: [
    '배당주', '배당금 계산', '포트폴리오', '주식 투자', '배당률', '월배당', '배당 계산기', '주식 계산기', '배당 포트폴리오',
  ],
  authors: [{ name: 'opentoyapp' }],
  openGraph: {
    title: '배당주 포트폴리오 계산기',
    description: '배당주 투자를 위한 포트폴리오 관리 및 배당금 계산 도구',
    url: 'https://stock-portfolio.opentoyapp.kr',
    siteName: '배당주 포트폴리오 계산기',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '배당주 포트폴리오 계산기',
    description: '배당주 투자를 위한 포트폴리오 관리 및 배당금 계산 도구',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://stock-portfolio.opentoyapp.kr',
  },
  verification: {
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <StructuredData />
      </head>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="max-w-[1440px] mx-auto">
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </div>
      </body>
    </html>
  );
}
