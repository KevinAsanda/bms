import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('bms-theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', dark);
    localStorage.setItem('bms-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      className="btn-ghost p-2 rounded-md hover:bg-[var(--color-surface-raised)] transition-all"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <Sun size={20} className="text-[var(--color-brand-red)]" />
      ) : (
        <Moon size={20} className="text-[var(--color-brand-black)]" />
      )}
    </button>
  );
}
