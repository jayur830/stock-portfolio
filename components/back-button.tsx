'use client';

import { useRouter } from 'next/navigation';
import type { ButtonHTMLAttributes } from 'react';

export interface BackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export default function BackButton({ onClick, ...props }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      {...props}
      onClick={(e) => {
        router.back();
        onClick?.(e);
      }}
    />
  );
}
