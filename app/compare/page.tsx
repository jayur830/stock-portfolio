import './_components/compare.css';

import Footer from '@/components/footer';
import SiteHeader from '@/components/site-header';

import Comparison from './_components/Comparison';

export default function ComparePage() {
  return (
    <>
      <SiteHeader activePage="compare" />
      <main className="main">
        <div className="heading">
          <span>DIVIDEND LAB</span>
          <h1>포트폴리오 비교</h1>
          <p>저장한 투자 구성을 같은 기준으로 비교해보세요.</p>
        </div>
        <Comparison />
      </main>
      <Footer />
    </>
  );
}
