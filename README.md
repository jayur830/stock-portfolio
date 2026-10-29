# 배당주 포트폴리오 계산기 (Dividend Lab)

> 국내외 배당주 포트폴리오의 예상 배당금, 필요한 투자금과 월별 현금흐름을 계산하고 시각화하는 도구입니다.

🌐 **서비스 URL**: [https://stock-portfolio.opentoyapp.kr](https://stock-portfolio.opentoyapp.kr)

## 주요 기능

- 투자금에서 예상 배당금을 계산하거나, 목표 연 배당금에 필요한 투자금을 계산합니다.
- 국내외 종목을 구성하고 비중, 배당월, 환율을 설정해 예상 보유 수량을 확인합니다.
- 월별 배당 목록과 배당 달력, 종목별 주가·배당·수익 차트를 제공합니다.
- 월별 목록에서 배당소득세와 예상 추가 건강보험료를 반영하고 계산 안내를 확인할 수 있습니다.
- 월 적립금과 배당 재투자를 반영한 복리 시뮬레이션과 CSV 내보내기를 지원합니다.
- URL 쿼리에 입력값을 저장해 공유하거나 다시 열 수 있습니다. 기본 다크 테마와 라이트 모드 전환을 지원합니다.

## 기술 스택

| 분류            | 기술                                                              |
| --------------- | ----------------------------------------------------------------- |
| 프레임워크·언어 | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5        |
| 폼·상태         | React Hook Form, TanStack Query v5                                |
| UI·스타일       | Tailwind CSS 4, Radix UI                                          |
| 글꼴·아이콘     | Pretendard Variable, 시스템 모노스페이스, Lucide React            |
| 차트            | Apache ECharts, echarts-for-react                                 |
| 시장 데이터     | Yahoo Finance 2 (`yahoo-finance2`), 네이버 증권, ExchangeRate-API |
| 배포 설정       | Netlify (`@netlify/plugin-nextjs`, `netlify.toml`)                |

종목 시세와 이력은 Yahoo Finance에서 조회합니다. 한글 종목 검색과 거래대금 상위 종목 조회에는 네이버 증권도 사용합니다. 환율 정보는 클라이언트에서 ExchangeRate-API를 직접 조회합니다.

## 로컬 개발 및 명령

Node.js와 Yarn을 사용합니다. 의존성을 설치한 뒤 개발 서버를 실행합니다.

```bash
yarn
yarn dev
```

개발 서버는 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행됩니다. 주요 명령은 `package.json`을 기준으로 합니다.

| 명령         | 용도                                                            |
| ------------ | --------------------------------------------------------------- |
| `yarn dev`   | 개발 서버 실행. 실행 전에 `size-sensor` 방어 패치를 적용합니다. |
| `yarn build` | 프로덕션 빌드. 빌드 전에 같은 방어 패치를 적용합니다.           |
| `yarn start` | 프로덕션 서버 실행                                              |
| `yarn lint`  | ESLint 검사                                                     |
| `yarn test`  | Jest 테스트 실행                                                |

패키지 설치 후 실행되는 `postinstall`도 `scripts/patch-size-sensor.mjs`를 실행해 `size-sensor`의 센서 해제 오류를 방어합니다.

## 환경 변수

- `NEXT_PUBLIC_GA_ID`: Google Analytics 측정 ID
- `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`: 네이버 사이트 소유 확인 메타데이터 값

## 주요 폴더 구조

```text
stock-portfolio/
├── app/
│   ├── about/page.tsx             # 서비스 소개 페이지
│   ├── api/stock/                  # 종목 검색·시세·이력·거래대금 상위 API
│   ├── _components/
│   │   ├── CalculatorFormProvider.tsx # 계산 폼, 입력값 검증과 URL 복원
│   │   ├── inputs/                 # 종목·투자금·환율 입력
│   │   └── results/                # 배당 결과, 달력, 차트, 시뮬레이터
│   ├── globals.css                 # 전역 스타일과 반응형 디자인
│   ├── layout.tsx                  # 루트 레이아웃, Google Analytics, 메타데이터
│   └── page.tsx                    # 메인 계산기 페이지
├── components/
│   ├── site-header.tsx             # 공통 사이트 헤더
│   ├── footer.tsx                  # 공통 푸터
│   └── ui/                         # 재사용 UI 컴포넌트
├── lib/                            # 계산·달력·배당 성장·CSV 유틸리티
├── scripts/patch-size-sensor.mjs   # size-sensor 방어 패치
├── netlify.toml                    # Netlify 빌드·플러그인 설정
└── types/                          # TypeScript 타입 정의
```
