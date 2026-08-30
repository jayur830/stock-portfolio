import { Apple, Chrome } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center gap-1 h-lvh px-2">
      <Button className="max-w-[240px] w-full" variant="outline">
        <Chrome size={16} />
        Google로 로그인
      </Button>
      <Button className="max-w-[240px] w-full" variant="outline">
        <Apple size={20} />
        Apple로 로그인
      </Button>
    </div>
  );
}
