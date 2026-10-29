import { BookOpen, Calendar, ChevronDown, Coins, HelpCircle, ShieldCheck, TrendingUp } from 'lucide-react';

export default function GuideSection() {
  const faqs = [
    {
      question: '배당소득세(15.4%)는 언제, 어떻게 차감되나요?',
      answer:
        '국내 주식 및 해외 주식의 배당금은 계좌에 입금될 때 원천징수세(국내 14% + 지방소득세 1.4% = 총 15.4%)가 자동으로 차감된 후 "세후 실수령액"으로 입금됩니다. 미국 주식의 경우 미국 현지 배당소득세율이 15%로 적용되며, 한미 조세조약에 따라 국내에서 14% 초과분에 대해 추가 원천징수되지 않아 약 15% 내외로 원천징수 후 입금됩니다.',
    },
    {
      question: '연간 배당금이 2,000만원을 초과하면 어떻게 되나요?',
      answer:
        '일반적인 금융소득 종합과세 기준은 이자와 배당 등 연간 금융소득 합계 2,000만원이며, 판단할 때는 이 포트폴리오 외 금융소득과 비과세·분리과세 소득 등 적용 요건도 확인해야 합니다. 요건에 따라 신고가 필요한 경우 일반적인 신고 시기는 다음 해 5월입니다. 신고 대상 여부와 추가 납부·환급액은 다른 소득, 공제, 기납부세액 및 적용되는 특례에 따라 달라지므로 포트폴리오 배당금만으로 확정할 수 없습니다. 국내 고배당기업 배당소득 특례는 법정 요건을 갖춘 국내 상장 내국법인의 해당 배당에 한하며, 자동 적용되지 않아 별도 확인과 신청이 필요합니다. 해외주식 및 해외 상장 ETF 배당에는 이 특례가 적용되지 않습니다.',
    },
    {
      question: '배당을 받으려면 배당락일 며칠 전에 매수해야 하나요?',
      answer:
        '주식 거래는 매수 체결일로부터 결제일까지 통상 2영업일(T+2)이 소요됩니다. 따라서 배당을 지급받기 위한 "배당기준일(Record Date)"의 2영업일 전, 즉 "배당락일(Ex-Dividend Date)" 최소 1영업일 전 장 마감 전까지 매수 체결을 완료해야 안전하게 배당 권리를 획득할 수 있습니다. 배당락일 당일에 매수하면 해당 회차의 배당금은 수령할 수 없습니다.',
    },
    {
      question: '고배당주(10% 이상)와 배당성장주(3~4%) 중 무엇이 더 유리한가요?',
      answer:
        '당장 매달 생활비나 높은 현금흐름이 필요한 은퇴자에게는 고배당 ETF(커버드콜, 리츠 등)가 유용할 수 있습니다. 하지만 고배당 상품은 원금(주가) 상승 여력이 제한되거나 주가 잠식 위험이 있습니다. 반면 SCHD 같은 배당성장주는 현재 배당률은 3~4% 수준이지만 매년 배당금을 연평균 8~12%씩 올려주어, 장기 투자 시 매수 원금 대비 배당수익률(Yield on Cost)이 극대화되고 원금 시세차익도 함께 누릴 수 있습니다. 일반적으로 두 성격을 5:5 또는 7:3으로 분산 조합하는 전략이 추천됩니다.',
    },
    {
      question: '달러(USD) 환율 변동은 배당금에 어떤 영향을 미치나요?',
      answer:
        '해외 주식(미국 배당주)은 배당금이 달러로 지급되므로, 원/달러 환율이 상승(원화 약세)하면 원화로 환전 시 수령액이 늘어나는 자연스러운 환차익 효과를 누릴 수 있습니다. 반대로 환율이 하락하면 원화 환산 배당금이 줄어들 수 있으므로, 환율 추이와 원화 환산 배당금을 함께 확인하는 것이 좋습니다.',
    },
  ];

  return (
    <section aria-labelledby="dividend-guide-title" className="guide-section w-full space-y-12">
      {/* 섹션 헤더 */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <BookOpen size={15} />
          <span>조금 더 깊이 알아보기</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground" id="dividend-guide-title">
          계획에 도움이 되는 투자 상식
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
          지속 가능한 월 현금흐름을 만들기 위한 핵심 투자 원칙과 세금 상식을 확인하고 더 스마트한 배당 포트폴리오를
          완성해 보세요.
        </p>
      </div>

      {/* 4대 핵심 전략 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 가이드 1 */}
        <article className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase">STRATEGY 01</span>
              <h3 className="text-sm sm:text-base font-bold text-foreground">배당수익률과 배당성장률의 균형</h3>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
            배당률이 연 10%가 넘는 초고배당주는 주가 하락으로 인한 원금 손실이나 배당 삭감(Dividend Cut) 위험이
            있습니다. S&P 500 지수 ETF나 SCHD처럼 연속 배당 증액 역사를 지닌 우량 배당성장주와 인컴형 고배당주를 적절히
            배분하여 <strong>원금 보존과 인컴 성장</strong>을 동시에 챙기세요.
          </p>
        </article>

        {/* 가이드 2 */}
        <article className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase">STRATEGY 02</span>
              <h3 className="text-sm sm:text-base font-bold text-foreground">월별 캘린더 분산 설계</h3>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
            미국 주식은 3개월마다 배당을 지급하는 분기 배당이 일반적입니다. [1·4·7·10월 주기], [2·5·8·11월 주기],
            [3·6·9·12월 주기]의 종목들을 교차로 조합하거나 월배당 ETF(JEPI, O 등)를 함께 구성하면{' '}
            <strong>1년 12달 매월 끊기지 않는 월급 형태의 배당금</strong>을 만들 수 있습니다.
          </p>
        </article>

        {/* 가이드 3 */}
        <article className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Coins size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase">STRATEGY 03</span>
              <h3 className="text-sm sm:text-base font-bold text-foreground">금융소득 종합과세 기준과 배당 특례</h3>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
            일반적으로 금융소득 종합과세 판단 시 연간 이자·배당소득 합계 <strong>2,000만원</strong>을 기준으로 참고하며,
            다른 금융소득과 비과세·분리과세 적용 요건도 함께 확인해야 합니다. 신고가 필요한 경우 일반적인 신고 시기는
            다음 해 5월이며, 실제 신고 대상 여부와 세액은 개인별 소득·공제·기납부세액 등에 따라 달라집니다.
            <br />
            국내 고배당기업 배당소득 특례는 법정 요건을 충족한 국내 상장 내국법인의 해당 배당에 한하며 자동 적용되지
            않습니다. 대상 확인 및 별도 신청이 필요하고, 해외주식·해외 상장 ETF 배당은 적용 대상이 아닙니다.
          </p>
        </article>

        {/* 가이드 4 */}
        <article className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase">STRATEGY 04</span>
              <h3 className="text-sm sm:text-base font-bold text-foreground">배당락일(Ex-Dividend Date) 체크</h3>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
            배당을 받기 위해서는 주주명부에 등재되어야 하므로 결제일(T+2)을 감안하여{' '}
            <strong>배당락일 전일까지 매수를 완료</strong>해야 합니다. 본 서비스의 배당 캘린더에서 종목별 배당락일과
            예상 입금일을 미리 확인하고 매수 계획을 세우세요.
          </p>
        </article>
      </div>

      {/* 자주 묻는 질문 (FAQ) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <HelpCircle size={15} />
          <span>궁금한 점이 있나요?</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-foreground">자주 묻는 질문 (FAQ)</h3>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              className="group rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:border-border open:bg-card/90"
              key={index}
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-xs sm:text-sm text-foreground list-none">
                <span>{faq.question}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 text-muted-foreground" />
              </summary>
              <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
