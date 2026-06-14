import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Keyboard, 
  Smartphone,
  PlayCircle
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

export default function Settings() {
  const { theme, setTheme, inputMode, setInputMode } = useSettingsStore();
  const [testText, setTestText] = useState('');
  const [testNum, setTestNum] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border-default)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[var(--color-brand-red)]/10 rounded-sm">
              <SettingsIcon className="text-[var(--color-brand-red)]" size={24} />
            </div>
            <h1 className="text-3xl font-[var(--font-display)] font-bold m-0 uppercase tracking-tight">System Settings</h1>
          </div>
          <p className="text-[var(--color-text-secondary)] m-0 text-sm">
            Configure display themes and touch input behaviors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Toggles */}
        <div className="space-y-6">
          {/* Card 1: Theme Settings */}
          <div className="card bg-[var(--color-surface-card)] p-6 border border-[var(--color-border-default)]">
            <h2 className="text-lg font-bold font-[var(--font-display)] uppercase tracking-wider mb-4 border-b border-[var(--color-border-default)] pb-2">
              Appearance Theme
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-6">
              Visual presentation mode is locked to Dark Mode per system design regulations (Simon Family Farm standard).
            </p>
            <div className="flex items-center justify-center p-4 border border-[var(--color-brand-red)] bg-[var(--color-brand-red)]/5 text-[var(--color-text-primary)]" style={{ borderRadius: 0 }}>
              <Moon size={24} className="mr-2 text-[var(--color-brand-red)]" />
              <span className="text-xs uppercase tracking-widest font-black">Dark Mode (Locked)</span>
            </div>
          </div>

          {/* Card 2: Input Mode Settings */}
          <div className="card bg-[var(--color-surface-card)] p-6 border border-[var(--color-border-default)]">
            <h2 className="text-lg font-bold font-[var(--font-display)] uppercase tracking-wider mb-4 border-b border-[var(--color-border-default)] pb-2">
              Terminal Input Mode
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-6">
              Toggle the on-screen virtual keyboard. Enable Touchscreen mode to test on desktop environments.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setInputMode('mouse')}
                className={`flex flex-col items-center justify-center p-4 border transition-all cursor-pointer ${
                  inputMode === 'mouse'
                    ? 'border-[var(--color-brand-red)] bg-[var(--color-brand-red)]/5 text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]'
                }`}
                style={{ borderRadius: 0 }}
              >
                <Keyboard size={24} className="mb-2" />
                <span className="text-xs uppercase tracking-widest font-black">Keyboard & Mouse</span>
              </button>
              <button
                onClick={() => setInputMode('touch')}
                className={`flex flex-col items-center justify-center p-4 border transition-all cursor-pointer ${
                  inputMode === 'touch'
                    ? 'border-[var(--color-brand-red)] bg-[var(--color-brand-red)]/5 text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]'
                }`}
                style={{ borderRadius: 0 }}
              >
                <Smartphone size={24} className="mb-2" />
                <span className="text-xs uppercase tracking-widest font-black">Touch Screen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Testing Playground */}
        <div className="space-y-6">
          <div className="card bg-[var(--color-surface-card)] p-6 border border-[var(--color-border-default)] flex flex-col h-full justify-between">
            <div>
              <h2 className="text-lg font-bold font-[var(--font-display)] uppercase tracking-wider mb-4 border-b border-[var(--color-border-default)] pb-2 flex items-center gap-2">
                <PlayCircle size={18} className="text-[var(--color-brand-red)]" />
                Keyboard Playground
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mb-6">
                Active testing sandbox. Make sure "Touch Screen" mode is selected above, then tap/click these fields to physically verify QWERTY and Numpad drawers.
              </p>

              <div className="space-y-6">
                {/* Text Test */}
                <div className="space-y-2">
                  <label className="label text-xs uppercase tracking-wider font-bold">QWERTY Layout Test (Text input)</label>
                  <input
                    type="text"
                    placeholder="Click to type text..."
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="input w-full"
                  />
                  <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                    Current value: "{testText}"
                  </div>
                </div>

                {/* Numeric Test */}
                <div className="space-y-2">
                  <label className="label text-xs uppercase tracking-wider font-bold">Numpad Layout Test (Numeric input)</label>
                  <input
                    type="number"
                    placeholder="Click to input numbers..."
                    value={testNum}
                    onChange={(e) => setTestNum(e.target.value)}
                    className="input w-full font-mono"
                  />
                  <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                    Current value: {testNum || 'empty'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface-raised)] p-4 border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] mt-6">
              <strong>Testing Guide:</strong> In <em>Touch Screen</em> mode, the keyboard automatically opens when clicking either input, slides up from the bottom, and closes immediately when tapping/clicking anywhere outside of the keyboard and input fields.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
