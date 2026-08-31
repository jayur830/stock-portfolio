# 📈 배당주 포트폴리오 계산기 (Dividend Lab)

> **스마트한 배당 설계를 위한 포트폴리오 관리 및 현금흐름 시각화 도구**  
> 국내외 배당주를 조합하여 목표 배당금, 필요 투자금, 월별 현금흐름 및 세후 실수령액을 실시간으로 계산하고 시각화합니다.

🌐 **서비스 URL**: [https://stock-portfolio.opentoyapp.kr](https://stock-portfolio.opentoyapp.kr)

---

## 📋 기능 체크리스트 (Features & Roadmap)

### 1. 배당 및 투자금 계산 엔진
- [x] **배당금 계산 모드**: 총 투자금 입력 시 종목별 비중에 따른 예상 연간/월간 배당금 자동 계산
- [x] **투자금 역산 모드**: 목표 연 배당금 입력 시 필요한 총 투자금 및 종목별 매수 금액 역산
- [x] **정밀 세금 계산**: 기본 배당소득세(15.4%) 및 2,000만원 초과 시 금융소득종합과세 자동 시뮬레이션
- [x] **포트폴리오 비중 조절**: 슬라이더 및 수치 직접 입력을 통한 실시간 비중(%) 정규화

### 2. 종목 관리 & 실시간 데이터 연동
- [x] **실시간 종목 검색 & 자동완성**: Yahoo Finance API 연동 (국내 코스피/코스닥 및 미국/해외 주식 지원)
- [x] **배당 정보 자동 반영**: 최근 주가, 주당 배당금, 배당수익률, 배당 지급 월 자동 채우기 및 수동 편집
- [x] **매수일 기준 수익 추적**: 매수 시점 대비 현재 주가 시세차익 수익률 계산
- [x] **매수일 프리셋 버튼**: 1개월 전, 3개월 전, 6개월 전, 1년 전, 3년 전 및 **초기화** 버튼 지원
- [ ] **배당 성장 지표 추가**: 종목별 5년 배당성장률(CAGR) 및 연속 배당 지급 연수(배당귀족/배당킹) 뱃지 표시

### 3. 다중 환율 & 환율 추이 차트
- [x] **7개국 통화 지원**: USD, JPY, EUR, CNY, GBP, HKD, VND 실시간 환율 조회 및 원화(KRW) 자동 환산
- [x] **데스크탑 환율 모달 팝업**: 각 통화별 차트 버튼 클릭 시 기간별(`1M`, `3M`, `6M`, `1Y`, `3Y`, `5Y`) 환율 추이 차트 및 최고/최저/변동률 통계 제공
- [x] **모바일 환율 아코디언**: 모바일 환경에서 접기/펼치기 형태로 현재 선택된 통화의 환율 차트 인라인 노출
- [x] **반응형 환율 그리드**: 대화면 5열, 태블릿(1280px 미만) 3열 자동 재배치로 요소 잘림 방지

### 4. 차트 & 시각화 분석 (ECharts)
- [x] **종목별 누적 등락률 비교 차트**: 기간별 주가 등락률(%) 오버랩 및 개별 비교
- [x] **종목별 분석 차트**: 5년치 주가 추이 일봉 라인 차트 및 월별 배당금 막대 차트
- [x] **누적 시세차익 vs 배당 재투자 복리 차트**: 순수 시세 평가손익과 배당금 발생 시점마다 전액 재투자했을 때의 복리 수익률 분리 계산
- [x] **차트 안정성 & UX 최적화**: 미확정 종가(`null`/`0`) 필터링(-100% 급락 방지) 및 툴팁 이탈 방지(`confine: true`)
- [ ] **월별 배당 캘린더 (달력 뷰)**: 1월~12월 달력 형태로 각 종목별 배당락일 및 배당지급 예정일 시각화

### 5. 포트폴리오 저장, 공유 & 내보내기
- [x] **URL 파라미터 상태 영속화**: 입력 상태가 URL에 base64로 인코딩되어 링크 공유 및 브라우저 뒤로가기/앞으로가기 완벽 지원
- [ ] **포트폴리오 로컬 저장 & 불러오기 (Local Storage)**: 여러 개의 포트폴리오를 이름으로 저장하고 원클릭 전환
- [ ] **기본 프리셋 포트폴리오 템플릿**: 초보자를 위한 대표 배당 조합(예: SCHD+JEPI 등) 템플릿 제공
- [ ] **포트폴리오 요약 카드 이미지 내보내기**: 연 배당금 및 월 현금흐름 요약 카드 캡처 다운로드 및 SNS 공유
- [x] **포트폴리오 분석 결과 엑셀(CSV) 다운로드**: 종목별 수량, 평균 매수가, 연간 배당금, 세후 실수령액 내보내기

### 6. UI/UX, 인프라 & 수익화
- [x] **브랜드 아이덴티티**: 공식 SVG 로고(`BrandLogo`) 컴포넌트, 파비콘 및 OpenGraph 이미지 적용
- [x] **다크/라이트 테마**: `next-themes` 기반 시스템/다크/라이트 모드 지원 및 시인성 최적화 스위치
- [x] **Netlify 호환 인프라**: Next.js 15 App Router 플러그인(`@netlify/plugin-nextjs`) 세팅 및 무중단 배포
- [x] **구글 애드센스(Google AdSense) 연동**: 공식 메타태그, 스크립트, `public/ads.txt`, 환경변수 분리 및 CMP 동의 메시지 연동
- [ ] **수동 애드센스 광고 배너 컴포넌트 (`AdSenseBanner`)**: 사이트 승인 후 분석 결과 하단 및 푸터 상단에 인라인 배너 유닛 배치
- [ ] **다국어(i18n) 지원**: 글로벌 사용자(영어, 일본어 등)를 위한 다국어 인터페이스 지원
- [ ] **회원제 & 클라우드 동기화 (장기 로드맵)**: 소셜 로그인 기반 클라우드 백업 및 포트폴리오 공유 커뮤니티

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
│   ├── (web)/
│   │   ├── _components/
│   │   │   ├── inputs/               # 사용자 입력 섹션
│   │   │   │   ├── stock-cards/      # 종목 카드 및 검색창
│   │   │   │   ├── exchange-rates.tsx# 환율 입력 및 모바일 아코디언
│   │   │   │   └── exchange-rate-chart.tsx # 환율 추이 차트 & 모달
│   │   │   └── results/              # 결과 및 차트 섹션
│   │   │       ├── stock-charts/     # ECharts 기반 주가/배당/수익률 차트
│   │   │       ├── monthly-dividends.tsx # 월별 배당금 분포
│   │   │       └── tax-breakdown.tsx # 세금 및 실수령액 상세
│   │   └── page.tsx                  # 메인 웹 페이지
│   ├── api/                          # Next.js API Routes (주가/환율/검색)
│   ├── globals.css                   # 글로벌 스타일 & 반응형 디자인
│   ├── layout.tsx                    # 루트 레이아웃 (애드센스, GA, 메타데이터)
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
