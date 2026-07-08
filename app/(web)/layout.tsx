import type { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="max-w-desktop mx-auto">
      {children}
    </div>
  );
}
