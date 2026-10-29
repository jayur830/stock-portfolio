'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function DarkModeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      aria-label="테마 전환"
      aria-pressed={isDark}
      className="theme-button"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      type="button"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
