import './globals.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import ReactQueryProvider from '@/components/react-query-provider';
import StructuredData from '@/components/structured-data';
import { ThemeProvider } from '@/components/theme-provider';

const displayFont = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  variable: '--font-mono-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: '#f2f4f9',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://stock-portfolio.opentoyapp.kr'),
  title: '배당주 포트폴리오 계산기 | 배당금 자동 계산',
  description: '배당주 포트폴리오 관리 및 배당금 계산. 국내외 주식, 환율 환산, 종합소득세 계산 지원.',
  keywords: [
    '배당주', '배당금 계산', '포트폴리오', '주식 투자', '배당률', '월배당', '배당 계산기', '주식 계산기', '배당 포트폴리오',
  ],
  authors: [{ name: 'opentoyapp' }],
  openGraph: {
    title: '배당주 포트폴리오 계산기',
    description: '배당주 포트폴리오 관리 및 배당금 계산. 국내외 주식, 환율 환산, 종합소득세 계산 지원.',
    url: 'https://stock-portfolio.opentoyapp.kr',
    siteName: '배당주 포트폴리오 계산기',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '배당주 포트폴리오 계산기',
    description: '배당주 포트폴리오 관리 및 배당금 계산. 국내외 주식, 환율 환산, 종합소득세 계산 지원.',
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
      ...(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && {
        'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
      }),
    },
  },
  other: {
    ...(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && {
      'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
    }),
  },
};

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
        {adsenseClientId && (
          <>
            <meta content={adsenseClientId} name="google-adsense-account" />
            <script
              async
              crossOrigin="anonymous"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            />
          </>
        )}
        <StructuredData />
      </head>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      <body
        className={`${displayFont.variable} ${monoFont.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange={false}
          enableSystem
        >
          <ReactQueryProvider>
            <div className="w-full min-h-screen">
              {children}
            </div>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
