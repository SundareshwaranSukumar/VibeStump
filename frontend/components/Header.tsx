'use client';

import { useVibeStore } from '@/lib/store';
import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

export default function Header() {
  const { theme, toggleTheme } = useVibeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <header className="glass border-b border-[rgba(var(--color-border),0.3)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        {/* Logo + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/stumps-logo.png"
            alt="VibeStump"
            className="h-9 w-auto flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight whitespace-nowrap">
              <span className="text-[rgb(var(--color-text))]">VibeStump</span>
              <span className="hidden sm:inline text-[rgb(var(--color-muted))] font-normal mx-1">—</span>
              <span className="hidden sm:inline text-[rgb(var(--color-primary))]">Agentic Premier League</span>
            </h1>
          </div>
          <img
            src="/ipl-logo.png"
            alt="IPL"
            className="h-8 w-auto flex-shrink-0 hidden sm:block"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* Right side: Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[rgba(var(--color-surface),0.8)] border border-[rgba(var(--color-border),0.3)]
                     hover:border-[rgba(var(--color-primary),0.4)] transition-all flex-shrink-0"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
}
