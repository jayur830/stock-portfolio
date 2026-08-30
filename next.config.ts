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

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Webpack 프로덕션 빌드에서도 SVG를 React 컴포넌트로 사용
  webpack(config) {
    type WebpackRule = {
      [key: string]: unknown;
      exclude?: RegExp;
      oneOf?: WebpackRule[];
      test?: RegExp;
    };

    const rules = config.module.rules as unknown as WebpackRule[];
    const svgRule: WebpackRule = {
      issuer: /\.[jt]sx?$/,
      test: /\.svg$/i,
      use: [{ loader: '@svgr/webpack', options: { exportType: 'default' } }],
    };
    const oneOfRule = rules.find((rule) => Array.isArray(rule.oneOf));

    if (oneOfRule?.oneOf) {
      oneOfRule.oneOf.unshift(svgRule);
    } else {
      rules.unshift(svgRule);
    }

    return config;
  },
};

export default nextConfig;
