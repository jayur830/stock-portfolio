import AppleLogo from '@/assets/svgs/apple-logo.svg';
import GoogleLogo from '@/assets/svgs/google-logo.svg';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center gap-1 h-lvh px-2">
      <Button className="max-w-[240px] w-full" variant="outline">
        <GoogleLogo height={16} width={16} />
        Google로 로그인
      </Button>
      <Button className="max-w-[240px] w-full" variant="outline">
        <AppleLogo height={20} width={20} />
        Apple로 로그인
      </Button>
    </div>
  );
}
