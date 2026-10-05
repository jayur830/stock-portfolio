'use client';

import { Glass } from '@samasante/liquid-glass';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface GlassBoxProps {
  children: ReactNode;
  className?: string;
  optics?: ComponentProps<typeof Glass>['optics'];
  radius?: number;
  style?: CSSProperties;
}

export const defaultOptics: ComponentProps<typeof Glass>['optics'] = {
  strength: 0.14,
  depth: 0.95,
  curvature: 0.5,
  dispersion: 0.2,
  bend: 0.4,
  bendWidth: 0.07,
  sheen: 0.5,
  sheenWidth: 3.5,
  specular: 0.8,
  sheenAngle: 0,
  glow: 0.1,
  frost: 1,
  brightness: 0,
};

/** SSR 안전 Glass 래퍼 (마운트 전에는 일반 div로 렌더) */
export default function GlassBox({ children, className, optics = defaultOptics, radius, style }: GlassBoxProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <Glass className={className} optics={optics} radius={radius} style={style}>
      {children}
    </Glass>
  );
}
