import Footer from '@/components/footer';
import SiteHeader from '@/components/site-header';

import Comparison from './Comparison';
export default function ComparePage() {
  return (
    <>
      <SiteHeader activePage="compare" />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28">
        <h1 className="mb-6 text-2xl font-bold">포트폴리오 비교</h1>
        <Comparison />
      </main>
      <Footer />
    </>
  );
}
