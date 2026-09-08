# 📈 배당주 포트폴리오 계산기 (Dividend Lab)

> **스마트한 배당 설계를 위한 포트폴리오 관리 및 현금흐름 시각화 도구**  
> 국내외 배당주를 조합하여 목표 배당금, 필요 투자금, 월별 현금흐름 및 세후 실수령액을 실시간으로 계산하고 시각화합니다.

🌐 **서비스 URL**: [https://stock-portfolio.opentoyapp.kr](https://stock-portfolio.opentoyapp.kr)

---

## 🛠 기술 스택

| 분류 | 기술 |
| :--- | :--- |
| **Framework** | **Next.js 16** (App Router, Turbopack) |
| **Language** | **TypeScript 5** |
| **State & Form** | **React Hook Form**, **TanStack Query (React Query v5)** |
| **UI & Styling** | **Tailwind CSS v4**, **Radix UI** (Dialog, Select, Popover, Slider, Tabs, Switch) |
| **Icons & Font** | **Lucide React**, **Geist Sans / Geist Mono** |
| **Charts** | **Apache ECharts**, **echarts-for-react** |
| **Market Data** | **Yahoo Finance 2 (`yahoo-finance2`)**, **ExchangeRate-API** |
| **Deployment** | **Netlify** (`@netlify/plugin-nextjs`), **Let's Encrypt SSL** |

---

## 💻 로컬 개발 환경 실행

```bash
# 1. 의존성 패키지 설치
yarn

# 2. 로컬 개발 서버 실행
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 확인할 수 있습니다.

```bash
# 린트 검사
yarn lint

# 단위 테스트 실행
yarn test

# 프로덕션 빌드
yarn build
```

---

## 📁 프로젝트 폴더 구조

```
stock-portfolio/
├── app/
│   ├── _components/
│   │   ├── inputs/               # 사용자 입력 섹션
│   │   │   ├── stock-cards/      # 종목 카드 및 검색창
│   │   │   ├── ExchangeRates.tsx # 환율 입력 및 모바일 아코디언
│   │   │   └── ExchangeRateChart.tsx # 환율 추이 차트 & 모달
│   │   └── results/              # 결과 및 차트 섹션
│   │       ├── stock-charts/     # ECharts 기반 주가/배당/수익률 차트
│   │       ├── MonthlyDividends.tsx # 월별 배당금 분포
│   │       └── TaxInfo.tsx       # 세금 및 실수령액 상세
│   ├── api/                          # Next.js API Routes (주가/환율/검색)
│   ├── globals.css                   # 글로벌 스타일 & 반응형 디자인
│   ├── layout.tsx                    # 루트 레이아웃 (애드센스, GA, 메타데이터)
│   ├── page.tsx                      # 메인 웹 페이지
│   ├── robots.ts                     # SEO robots.txt
│   └── sitemap.ts                    # SEO sitemap.xml
├── components/
│   ├── brand-logo.tsx                # 공식 SVG 브랜드 로고
│   ├── dark-mode-switch.tsx          # 다크모드 테마 스위치
│   └── ui/                           # Shadcn / Radix UI 컴포넌트
├── lib/                              # 유틸리티 함수 및 야후 파이낸스 클라이언트
├── public/
│   └── ads.txt                       # 구글 애드센스 사이트 인증 파일
└── types/                            # TypeScript 인터페이스 및 환경변수 정의
```
