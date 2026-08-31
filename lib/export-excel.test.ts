import { exportPortfolioToCsv } from '@/lib/export-excel';
import type { FormValues } from '@/types';

describe('exportPortfolioToCsv', () => {
  let originalCreateElement: typeof document.createElement;
  let clicked = false;
  let downloadedFileName = '';

  beforeEach(() => {
    clicked = false;
    downloadedFileName = '';
    originalCreateElement = document.createElement.bind(document);

    // Mock URL.createObjectURL & revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock anchor element
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        element.click = () => {
          clicked = true;
        };
        const origSetAttribute = element.setAttribute.bind(element);
        element.setAttribute = (name: string, value: string) => {
          if (name === 'download') {
            downloadedFileName = value;
          }
          origSetAttribute(name, value);
        };
      }
      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('포트폴리오 입력값을 바탕으로 정상적으로 CSV 파일을 다운로드 트리거한다', () => {
    const mockValues: FormValues = {
      totalInvestment: 10000000,
      targetAnnualDividend: 500000,
      calculatedCategory: 'dividend',
      exchangeRates: { USD: 1350, JPY: 9, EUR: 1450, CNY: 185, GBP: 1700, HKD: 170, VND: 0.055 },
      stocks: [
        {
          name: '삼성전자',
          ticker: '005930.KS',
          currency: 'KRW',
          price: 70000,
          yield: 2.06,
          dividendMonths: [3, 6, 9, 12],
          ratio: 100,
          enabled: true,
        },
      ],
      stockDividends: [
        {
          annualDividend: 200000,
          taxRate: 0.154,
          isForeign: false,
          monthlyDividends: { 3: 50000, 6: 50000, 9: 50000, 12: 50000 },
        },
      ],
    };

    exportPortfolioToCsv(mockValues);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(clicked).toBe(true);
    expect(downloadedFileName).toMatch(/^dividend-portfolio-\d{8}-\d{6}\.csv$/);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
