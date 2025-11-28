import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

import BackButton from '@/components/back-button';
import { Button, buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-gray-50 to-gray-100">
      <div className="text-center px-4">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <FileQuestion className="h-32 w-32 text-gray-300" strokeWidth={1.5} />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
              404
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          페이지를 찾을 수 없습니다.
        </h1>

        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          URL을 다시 확인해주세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button className="px-8 py-6 text-base" size="lg">
              홈으로 돌아가기
            </Button>
          </Link>

          <BackButton className={buttonVariants({ variant: 'outline', size: 'lg', className: 'px-8 py-6 text-base' })}>
            이전 페이지로
          </BackButton>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            문제가 지속되면{' '}
            <a
              className="text-blue-600 hover:text-blue-700 underline"
              href="mailto:opentoyapp@gmail.com"
            >
              opentoyapp@gmail.com
            </a>
            로 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
