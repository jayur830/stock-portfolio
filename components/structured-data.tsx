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

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '배당소득세(15.4%)는 언제, 어떻게 차감되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '국내 주식 및 해외 주식의 배당금은 계좌에 입금될 때 원천징수세(국내 14% + 지방소득세 1.4% = 총 15.4%)가 자동으로 차감된 후 "세후 실수령액"으로 입금됩니다.',
      },
    },
    {
      '@type': 'Question',
      name: '연간 배당금이 2,000만원을 초과하면 어떻게 되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '1년 동안 발생한 금융소득(이자+배당) 합계액이 2,000만원을 초과할 경우, 2,000만원 초과분에 대해 다른 종합소득과 합산하여 5월에 금융소득종합과세 신고를 진행해야 합니다.',
      },
    },
    {
      '@type': 'Question',
      name: '배당을 받으려면 배당락일 며칠 전에 매수해야 하나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '주식 거래는 결제일까지 통상 2영업일(T+2)이 소요되므로, 배당기준일 2영업일 전이자 배당락일 최소 1영업일 전 장 마감 전까지 매수 체결을 완료해야 합니다.',
      },
    },
  ],
};

export default function StructuredData() {
  return (
    <>
      <Script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        id="structured-data"
        type="application/ld+json"
      />
      <Script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        id="faq-structured-data"
        type="application/ld+json"
      />
    </>
  );
}
