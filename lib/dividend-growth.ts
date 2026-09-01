export interface DividendHistoryItem {
  date: Date | string;
  amount: number;
}

export type DividendBadgeType = 'king' | 'aristocrat' | 'champion' | 'grower';

export interface DividendGrowthInfo {
  cagr5Y: number | null; // 5년 배당성장률 (%)
  growthStreak: number; // 연속 배당 증액 연수
  badge: {
    type: DividendBadgeType;
    label: string;
    icon: string;
    colorClass: string;
    description: string;
  } | null;
}

/**
 * 공식 배당킹 (50년 이상 연속 배당 증액) 대표 티커 및 연속 연수
 */
export const DIVIDEND_KINGS: Record<string, { years: number; name: string }> = {
  AWR: { years: 70, name: 'American States Water' },
  DOV: { years: 69, name: 'Dover Corporation' },
  NWN: { years: 69, name: 'Northwest Natural' },
  GPC: { years: 68, name: 'Genuine Parts Company' },
  PG: { years: 68, name: 'Procter & Gamble' },
  EMR: { years: 67, name: 'Emerson Electric' },
  MMM: { years: 66, name: '3M Company' },
  CINF: { years: 64, name: 'Cincinnati Financial' },
  JNJ: { years: 62, name: 'Johnson & Johnson' },
  KO: { years: 62, name: 'Coca-Cola' },
  CL: { years: 62, name: 'Colgate-Palmolive' },
  LOW: { years: 62, name: 'Lowe\'s Companies' },
  HRL: { years: 58, name: 'Hormel Foods' },
  ABM: { years: 57, name: 'ABM Industries' },
  SYY: { years: 55, name: 'Sysco Corporation' },
  FRT: { years: 55, name: 'Federal Realty Investment Trust' },
  BDX: { years: 53, name: 'Becton Dickinson' },
  PEP: { years: 52, name: 'PepsiCo' },
  ABBV: { years: 52, name: 'AbbVie' },
  TGT: { years: 52, name: 'Target' },
  GWW: { years: 52, name: 'W.W. Grainger' },
  SPGI: { years: 51, name: 'S&P Global' },
  ADM: { years: 51, name: 'Archer-Daniels-Midland' },
  NUE: { years: 51, name: 'Nucor Corporation' },
};

/**
 * 공식 배당귀족 (25년 이상 50년 미만 연속 배당 증액) 대표 티커 및 연속 연수
 */
export const DIVIDEND_ARISTOCRATS: Record<string, { years: number; name: string }> = {
  O: { years: 31, name: 'Realty Income' },
  MCD: { years: 48, name: 'McDonald\'s' },
  WMT: { years: 51, name: 'Walmart' },
  XOM: { years: 42, name: 'Exxon Mobil' },
  CVX: { years: 37, name: 'Chevron' },
  CLX: { years: 47, name: 'Clorox' },
  AFL: { years: 42, name: 'Aflac' },
  ED: { years: 50, name: 'Consolidated Edison' },
  APD: { years: 42, name: 'Air Products & Chemicals' },
  SHW: { years: 46, name: 'Sherwin-Williams' },
  ITW: { years: 51, name: 'Illinois Tool Works' },
  LIN: { years: 32, name: 'Linde plc' },
  IBM: { years: 29, name: 'IBM' },
  CAT: { years: 31, name: 'Caterpillar' },
  GD: { years: 33, name: 'General Dynamics' },
  NEE: { years: 30, name: 'NextEra Energy' },
  MDLZ: { years: 25, name: 'Mondelez' },
};

/**
 * 10년 이상 연속 배당 증액 대표 ETF 및 종목
 */
export const DIVIDEND_CHAMPIONS: Record<string, { years: number; name: string }> = {
  SCHD: { years: 12, name: 'Schwab US Dividend Equity ETF' },
  VIG: { years: 10, name: 'Vanguard Dividend Appreciation ETF' },
  DGRO: { years: 10, name: 'iShares Core Dividend Growth ETF' },
  AAPL: { years: 12, name: 'Apple Inc.' },
  MSFT: { years: 20, name: 'Microsoft' },
  COST: { years: 20, name: 'Costco Wholesale' },
  HD: { years: 15, name: 'Home Depot' },
  TXN: { years: 20, name: 'Texas Instruments' },
  QCOM: { years: 21, name: 'Qualcomm' },
  UNH: { years: 15, name: 'UnitedHealth Group' },
  V: { years: 16, name: 'Visa' },
  MA: { years: 18, name: 'Mastercard' },
  LLY: { years: 10, name: 'Eli Lilly' },
};

/**
 * 연도별 배당금 합산 및 5년 CAGR, 연속 증액 연수 계산
 */
export function calculateDividendGrowth(
  symbol: string,
  dividendHistory?: DividendHistoryItem[],
): DividendGrowthInfo {
  const upperSymbol = (symbol || '').toUpperCase().trim();

  // 1. 사전 정의된 공식 데이터베이스 확인
  const king = DIVIDEND_KINGS[upperSymbol];
  const aristocrat = DIVIDEND_ARISTOCRATS[upperSymbol];
  const champion = DIVIDEND_CHAMPIONS[upperSymbol];

  let streak = 0;
  if (king) {
    streak = king.years;
  } else if (aristocrat) {
    streak = aristocrat.years;
  } else if (champion) {
    streak = champion.years;
  }

  // 2. 배당 히스토리가 있는 경우 연도별 합산 및 5년 CAGR 계산
  let cagr5Y: number | null = null;

  if (dividendHistory && dividendHistory.length > 0) {
    // 연도별 배당금 합계 맵 생성
    const yearlyMap: Record<number, number> = {};

    dividendHistory.forEach((item) => {
      const date = new Date(item.date);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        yearlyMap[year] = (yearlyMap[year] || 0) + (item.amount || 0);
      }
    });

    const currentYear = new Date().getFullYear();
    const years = Object.keys(yearlyMap)
      .map(Number)
      .filter((y) => y < currentYear) // 아직 끝나지 않은 올해 제외
      .sort((a, b) => b - a); // 최근 연도부터 내림차순

    // 만약 공식 DB에 없었다면 히스토리로부터 연속 증액 연수 계산
    if (streak === 0 && years.length >= 2) {
      let calculatedStreak = 0;
      for (let i = 0; i < years.length - 1; i++) {
        const currentAmount = yearlyMap[years[i]];
        const prevAmount = yearlyMap[years[i + 1]];
        if (currentAmount >= prevAmount * 0.98) { // 2% 이내 오차 허용
          calculatedStreak++;
        } else {
          break;
        }
      }
      streak = calculatedStreak;
    }

    // 5년 CAGR 계산: 최근 완료된 연도 vs 5년 전 연도
    if (years.length >= 5) {
      const latestYear = years[0];
      const startYear = latestYear - 5;
      const latestAmount = yearlyMap[latestYear];
      const startAmount = yearlyMap[startYear];

      if (latestAmount > 0 && startAmount > 0) {
        const cagr = (Math.pow(latestAmount / startAmount, 1 / 5) - 1) * 100;
        cagr5Y = Math.round(cagr * 10) / 10;
      }
    }
  }

  // 3. 배지 결정
  let badge: DividendGrowthInfo['badge'] = null;

  if (streak >= 50) {
    badge = {
      type: 'king',
      label: `배당킹 ${streak}년`,
      icon: '👑',
      colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      description: `50년 이상 연속 배당을 인상한 '배당킹' 종목입니다. (연속 ${streak}년 증액)`,
    };
  } else if (streak >= 25) {
    badge = {
      type: 'aristocrat',
      label: `배당귀족 ${streak}년`,
      icon: '🛡️',
      colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      description: `25년 이상 연속 배당을 인상한 '배당귀족' 종목입니다. (연속 ${streak}년 증액)`,
    };
  } else if (streak >= 10) {
    badge = {
      type: 'champion',
      label: `배당성취 ${streak}년`,
      icon: '🌟',
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      description: `10년 이상 연속 배당을 인상한 우량 배당성장 종목입니다. (연속 ${streak}년 증액)`,
    };
  } else if (streak >= 5) {
    badge = {
      type: 'grower',
      label: `${streak}년 연속증액`,
      icon: '📈',
      colorClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
      description: `5년 이상 꾸준히 배당을 늘려온 배당성장 종목입니다. (연속 ${streak}년 증액)`,
    };
  }

  return {
    cagr5Y,
    growthStreak: streak,
    badge,
  };
}
