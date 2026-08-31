import dayjs from 'dayjs';

import { convertCurrency, mergeMonthlyDividends } from '@/lib/utils';
import type { FormValues } from '@/types';

/** CSV 셀 값 포맷팅 (쉼표나 줄바꿈, 따옴표 포함 시 이스케이프) */
function formatCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `"${stringValue}"`;
}

/** 포트폴리오 분석 결과 엑셀(CSV) 내보내기 */
export function exportPortfolioToCsv(values: FormValues) {
  const {
    stocks,
    stockDividends,
    totalInvestment,
    targetAnnualDividend,
    calculatedCategory,
    exchangeRates,
  } = values;

  const validStocks = stocks.filter((s) => s.enabled);
  const activeStockDividends = stockDividends || [];

  /** 세전 연 배당금 */
  const annualDividend = activeStockDividends.reduce((sum, { annualDividend }) => sum + annualDividend, 0);

  /** 세후 연 배당금 */
  const afterTaxAnnualDividend = activeStockDividends.reduce(
    (sum, { annualDividend, taxRate }) => sum + annualDividend * (1 - taxRate),
    0,
  );

  /** 총 배당소득세 */
  const totalTax = annualDividend - afterTaxAnnualDividend;

  /** 세후 월평균 배당금 */
  const monthlyAverageDividend = afterTaxAnnualDividend / 12;

  /** 실제 계산에 사용된 총 투자금 */
  let finalTotalInvestment = totalInvestment;
  if (calculatedCategory === 'investment') {
    const weightedYield = validStocks.reduce((sum, s) => sum + (s.yield / 100) * (s.ratio / 100), 0);
    finalTotalInvestment = weightedYield > 0 ? targetAnnualDividend / weightedYield : 0;
  }

  /** 포트폴리오 평균 배당수익률 */
  const portfolioYield = finalTotalInvestment > 0 ? (annualDividend / finalTotalInvestment) * 100 : 0;

  /** 월별 배당금 합산 (12개 요소 배열: 인덱스 0 = 1월, 인덱스 11 = 12월) */
  const monthlyAmounts = mergeMonthlyDividends(
    activeStockDividends.filter((sd) => sd && sd.monthlyDividends),
  );

  const rows: string[] = [];

  // 1. 헤더 & 메타 정보
  rows.push(['# 배당주 포트폴리오 분석 보고서'].map(formatCsvCell).join(','));
  rows.push(['생성일시', dayjs().format('YYYY-MM-DD HH:mm:ss')].map(formatCsvCell).join(','));
  rows.push(['서비스명', 'Dividend Lab (배당주 포트폴리오 계산기)'].map(formatCsvCell).join(','));
  rows.push(['서비스 URL', 'https://stock-portfolio.opentoyapp.kr'].map(formatCsvCell).join(','));
  rows.push('');

  // 2. 포트폴리오 종합 요약
  rows.push(['[1. 포트폴리오 종합 요약]'].map(formatCsvCell).join(','));
  rows.push(['항목', '금액 / 수치', '비고'].map(formatCsvCell).join(','));
  rows.push(['총 투자금', `${Math.round(finalTotalInvestment).toLocaleString('ko-KR')} 원`, calculatedCategory === 'investment' ? '목표 배당 역산 투자금' : '입력 총 투자금'].map(formatCsvCell).join(','));
  rows.push(['세전 연간 배당금', `${Math.round(annualDividend).toLocaleString('ko-KR')} 원`, '연간 총 예상 배당'].map(formatCsvCell).join(','));
  rows.push(['배당소득세(15.4%)', `${Math.round(totalTax).toLocaleString('ko-KR')} 원`, '원천징수 공제세액'].map(formatCsvCell).join(','));
  rows.push(['세후 연간 배당금', `${Math.round(afterTaxAnnualDividend).toLocaleString('ko-KR')} 원`, '실수령 기준'].map(formatCsvCell).join(','));
  rows.push(['세후 월평균 배당금', `${Math.round(monthlyAverageDividend).toLocaleString('ko-KR')} 원`, '월평균 실수령액'].map(formatCsvCell).join(','));
  rows.push(['포트폴리오 평균 배당수익률', `${portfolioYield.toFixed(2)} %`, '가중평균 배당률'].map(formatCsvCell).join(','));
  rows.push('');

  // 3. 종목별 상세 내역
  rows.push(['[2. 종목별 상세 내역]'].map(formatCsvCell).join(','));
  rows.push([
    '종목명',
    '티커(심볼)',
    '통화',
    '비중(%)',
    '현재가',
    '원화 환산가(원)',
    '매수일자',
    '보유 수량(주)',
    '투자 금액(원)',
    '주당 배당금',
    '배당수익률(%)',
    '배당 지급월',
    '세전 연 배당금(원)',
    '세후 연 배당금(원)',
  ].map(formatCsvCell).join(','));

  validStocks.forEach((stock, index) => {
    const stockDiv = activeStockDividends[index];
    const stockPriceInKRW = convertCurrency(stock.price, stock.currency, 'KRW', exchangeRates as Record<string, number>);
    const stockInvestment = finalTotalInvestment * (stock.ratio / 100);
    const shares = stockPriceInKRW > 0 ? Math.floor(stockInvestment / stockPriceInKRW) : 0;
    const stockAnnualDiv = stockDiv?.annualDividend || 0;
    const stockTaxRate = stockDiv?.taxRate || 0.154;
    const stockAfterTaxDiv = stockAnnualDiv * (1 - stockTaxRate);
    const monthsText = (stock.dividendMonths || []).sort((a, b) => a - b).map((m) => `${m}월`).join(', ') || '미정';
    const dividendPerShare = (stock.price * stock.yield) / 100;
    const purchaseDateText = stock.purchaseDate ? dayjs(stock.purchaseDate).format('YYYY-MM-DD') : '-';

    rows.push([
      stock.name,
      stock.ticker,
      stock.currency,
      `${stock.ratio}%`,
      stock.price.toLocaleString('ko-KR'),
      Math.round(stockPriceInKRW).toLocaleString('ko-KR'),
      purchaseDateText,
      shares.toLocaleString('ko-KR'),
      Math.round(stockInvestment).toLocaleString('ko-KR'),
      dividendPerShare.toLocaleString('ko-KR', { maximumFractionDigits: 2 }),
      `${stock.yield.toFixed(2)}%`,
      monthsText,
      Math.round(stockAnnualDiv).toLocaleString('ko-KR'),
      Math.round(stockAfterTaxDiv).toLocaleString('ko-KR'),
    ].map(formatCsvCell).join(','));
  });
  rows.push('');

  // 4. 월별 예상 현금흐름 (1월 ~ 12월)
  rows.push(['[3. 월별 예상 배당 현금흐름]'].map(formatCsvCell).join(','));
  rows.push(['월', '세전 배당금(원)', '세후 배당금(원)'].map(formatCsvCell).join(','));

  for (let m = 1; m <= 12; m++) {
    const beforeTax = monthlyAmounts[m - 1] || 0;
    const afterTax = beforeTax * (1 - 0.154);
    rows.push([
      `${m}월`,
      Math.round(beforeTax).toLocaleString('ko-KR'),
      Math.round(afterTax).toLocaleString('ko-KR'),
    ].map(formatCsvCell).join(','));
  }

  rows.push([
    '연간 합계',
    Math.round(annualDividend).toLocaleString('ko-KR'),
    Math.round(afterTaxAnnualDividend).toLocaleString('ko-KR'),
  ].map(formatCsvCell).join(','));

  // CSV 문자열 생성 (한글 깨짐 방지용 UTF-8 BOM \uFEFF 포함)
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `dividend-portfolio-${dayjs().format('YYYYMMDD-HHmmss')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
