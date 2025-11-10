import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = '배당주 포트폴리오 계산기';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(to bottom right, #059669, #10b981)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            배당주 포트폴리오
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            계산기
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              textAlign: 'center',
              opacity: 0.9,
              marginTop: '20px',
            }}
          >
            배당금 자동 계산 | 국내/해외 주식 지원
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 300,
              textAlign: 'center',
              opacity: 0.8,
            }}
          >
            stock-portfolio.opentoyapp.kr
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
