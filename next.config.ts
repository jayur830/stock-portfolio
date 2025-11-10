import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 성능 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
  },

  // 압축 활성화
  compress: true,

  // 번들 최적화
  experimental: {
    optimizePackageImports: ['echarts', '@tanstack/react-query', 'react-hook-form'],
  },
};

export default nextConfig;
