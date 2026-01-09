import Script from 'next/script';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '배당주 포트폴리오 계산기',
  description: '배당주 투자를 위한 포트폴리오 관리 및 배당금 계산 도구. 총 투자금으로 예상 배당금 계산, 목표 배당금으로 필요 투자금 계산. 국내/해외 주식 지원, 환율 자동 환산.',
  url: 'https://stock-portfolio.opentoyapp.kr',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
  author: {
    '@type': 'Organization',
    name: 'opentoyapp',
    url: 'https://stock-portfolio.opentoyapp.kr',
  },
  featureList: [
    '배당금 계산 모드: 총 투자금으로 예상 배당금 계산',
    '투자금 계산 모드: 목표 배당금으로 필요한 투자금 계산',
    '세전/세후 배당금 자동 계산',
    '월별 배당금 분포 시각화',
    '국내/해외(USD) 주식 지원',
    '환율 자동 조회 및 환산',
    '주가 추이 차트',
    '누적 수익금 차트',
  ],
  inLanguage: 'ko-KR',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
};

export default function StructuredData() {
  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      id="structured-data"
      type="application/ld+json"
    />
  );
}
