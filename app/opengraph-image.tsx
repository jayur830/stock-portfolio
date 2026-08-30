import { ImageResponse } from 'next/og';

export const alt = '배당주 포트폴리오 계산기';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(130deg, #10243d 0%, #123751 52%, #0e615a 100%)',
          color: '#f3fffd',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          padding: '58px 68px',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            border: '1px solid rgba(200, 255, 247, 0.14)',
            borderRadius: '50%',
            bottom: '-230px',
            display: 'flex',
            height: '520px',
            position: 'absolute',
            right: '-110px',
            width: '520px',
          }}
        />
        <div
          style={{
            border: '1px solid rgba(200, 255, 247, 0.12)',
            borderRadius: '50%',
            bottom: '-125px',
            display: 'flex',
            height: '330px',
            position: 'absolute',
            right: '8px',
            width: '330px',
          }}
        />

        <div style={{ alignItems: 'center', display: 'flex', gap: '14px' }}>
          <div
            style={{
              alignItems: 'center',
              background: 'linear-gradient(145deg, #1aa899 0%, #0c625b 100%)',
              borderRadius: '14px',
              display: 'flex',
              height: '48px',
              justifyContent: 'center',
              width: '48px',
            }}
          >
            <svg fill="none" height="26" viewBox="0 0 26 26" width="26" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 20L9 14L13 17L22 6" stroke="#F3FFFD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
              <path d="M17 6H22V11" stroke="#F3FFFD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#ffffff', display: 'flex', fontSize: '21px', fontWeight: 800, letterSpacing: '6px' }}>
              <span>DIVIDEND</span>
              <span style={{ color: '#78e4d3' }}>LAB</span>
            </div>
            <div style={{ color: 'rgba(231, 255, 251, 0.62)', fontSize: '10px', fontWeight: 700, letterSpacing: '4px', marginTop: '7px' }}>
              INCOME, BY DESIGN
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '70px', width: '690px' }}>
          <div
            style={{
              alignItems: 'center',
              border: '1px solid rgba(186, 255, 244, 0.28)',
              borderRadius: '999px',
              color: '#bafff4',
              display: 'flex',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '3px',
              padding: '10px 15px',
            }}
          >
            DIVIDEND PORTFOLIO PLANNER
          </div>
          <div style={{ color: '#ffffff', fontSize: '54px', fontWeight: 750, letterSpacing: '-2px', lineHeight: 1.14, marginTop: '24px' }}>
            배당을 모으는 일이,
          </div>
          <div style={{ color: '#78e4d3', fontSize: '64px', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1.12 }}>
            계획이 되도록.
          </div>
          <div style={{ color: 'rgba(231, 255, 251, 0.72)', fontSize: '18px', lineHeight: 1.5, marginTop: '22px' }}>
            투자금과 목표 배당금으로 설계하는 나만의 현금흐름 플래너
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(200, 255, 247, 0.22)',
            borderRadius: '22px',
            display: 'flex',
            flexDirection: 'column',
            height: '278px',
            padding: '26px',
            position: 'absolute',
            right: '74px',
            top: '150px',
            width: '326px',
          }}
        >
          <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#a9eee2', fontSize: '10px', fontWeight: 800, letterSpacing: '3px' }}>YOUR INCOME PLAN</div>
              <div style={{ color: '#ffffff', fontSize: '23px', fontWeight: 750, marginTop: '10px' }}>Monthly dividend</div>
              <div style={{ color: 'rgba(231, 255, 251, 0.58)', fontSize: '11px', marginTop: '5px' }}>작은 습관이 만드는 큰 흐름</div>
            </div>
            <div style={{ color: '#bafff4', fontSize: '11px', fontWeight: 750 }}>↗ LIVE</div>
          </div>
          <div style={{ display: 'flex', height: '105px', marginTop: '22px', position: 'relative', width: '100%' }}>
            <div style={{ borderBottom: '1px solid rgba(200, 255, 247, 0.2)', borderTop: '1px solid rgba(200, 255, 247, 0.1)', height: '54px', position: 'absolute', top: '24px', width: '100%' }} />
            <svg fill="none" height="105" viewBox="0 0 274 105" width="274" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 89C22 84 35 71 53 76C74 82 81 57 105 63C126 69 142 43 161 52C180 61 198 29 217 38C236 47 247 14 272 20" stroke="#7CE5D5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <circle cx="217" cy="38" fill="#C6FFF5" r="5" stroke="#0E615A" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ color: 'rgba(231, 255, 251, 0.54)', display: 'flex', fontSize: '10px', justifyContent: 'space-between', marginTop: '10px' }}>
            <span>NOW</span><span>12 MONTHS</span>
          </div>
        </div>

        <div style={{ alignItems: 'center', bottom: '52px', color: 'rgba(231, 255, 251, 0.68)', display: 'flex', fontSize: '13px', fontWeight: 700, gap: '20px', position: 'absolute' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '5px' }}>
            <span style={{ color: '#bafff4', fontWeight: 800 }}>01</span>
            <span>금액 설정</span>
          </div>
          <span style={{ color: '#6ed9ca' }}>•</span>
          <div style={{ alignItems: 'center', display: 'flex', gap: '5px' }}>
            <span style={{ color: '#bafff4', fontWeight: 800 }}>02</span>
            <span>종목 배분</span>
          </div>
          <span style={{ color: '#6ed9ca' }}>•</span>
          <div style={{ alignItems: 'center', display: 'flex', gap: '5px' }}>
            <span style={{ color: '#bafff4', fontWeight: 800 }}>03</span>
            <span>현금흐름 확인</span>
          </div>
        </div>
        <div style={{ bottom: '52px', color: 'rgba(231, 255, 251, 0.5)', fontSize: '13px', position: 'absolute', right: '74px' }}>
          stock-portfolio.opentoyapp.kr
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
