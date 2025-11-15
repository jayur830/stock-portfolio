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
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <svg fill="none" height="227" viewBox="0 0 227 227" width="227" xmlns="http://www.w3.org/2000/svg">
          <rect fill="black" height="27" rx="4" width="51" y="200" />
          <rect fill="black" height="50" rx="4" width="53" x="57" y="177" />
          <rect fill="black" height="104" rx="4" width="54" x="116" y="123" />
          <rect fill="black" height="164" rx="4" width="51" x="176" y="63" />
          <path d="M215 7L163.847 16.1291L197.329 55.8646L215 7ZM18 173L20.8997 176.441L186.929 36.5384L184.029 33.0972L181.13 29.656L15.1003 169.559L18 173Z" fill="black" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
