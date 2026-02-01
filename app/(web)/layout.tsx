import type { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="max-w-[1440px] mx-auto">
      {children}
    </div>
  );
}
