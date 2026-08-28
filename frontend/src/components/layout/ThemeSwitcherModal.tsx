import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeMode } from '../../types';
import { X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeOption {
  id: ThemeMode;
  name: string;
  subtitle: string;
  bgHex: string;
  surfaceHex: string;
  accentHex: string;
  textHex: string;
  isDark: boolean;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'clarity',
    name: 'Clarity',
    subtitle: 'Clean white & royal blue',
    bgHex: '#FFFFFF',
    surfaceHex: '#F5F8FC',
    accentHex: '#2563EB',
    textHex: '#101828',
    isDark: false,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    subtitle: 'Deep dark & purple',
    bgHex: '#0B0B10',
    surfaceHex: '#16151D',
    accentHex: '#8B5CF6',
    textHex: '#F2F1F7',
    isDark: true,
  },
  {
    id: 'fresh',
    name: 'Fresh',
    subtitle: 'Crisp green & whitespace',
    bgHex: '#FFFFFF',
    surfaceHex: '#F7FAF8',
    accentHex: '#16A34A',
    textHex: '#12201A',
    isDark: false,
  },
  {
    id: 'harvest',
    name: 'Harvest',
    subtitle: 'Warm olive & golden reward',
    bgHex: '#FCFBF3',
    surfaceHex: '#F6F4E4',
    accentHex: '#65A30D',
    textHex: '#24291B',
    isDark: false,
  },
];

export const ThemeSwitcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl p-6 rounded-2xl bg-surface-elevated border border-border shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Select Appearance Theme</h3>
            <p className="text-sm text-text-secondary mt-1">
              Choose one of the 4 tailored color palettes. Applied seamlessly across the app.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                }}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent/30 shadow-card'
                    : 'border-border hover:border-text-secondary/40 hover:shadow-subtle'
                }`}
                style={{ backgroundColor: opt.surfaceHex }}
              >
                {/* Header label */}
                <div className="flex items-center justify-between w-full mb-3">
                  <div>
                    <span
                      className="font-semibold text-base"
                      style={{ color: opt.textHex }}
                    >
                      {opt.name}
                    </span>
                    <p
                      className="text-xs mt-0.5 opacity-80"
                      style={{ color: opt.textHex }}
                    >
                      {opt.subtitle}
                    </p>
                  </div>
                  {isSelected && (
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-full text-white"
                      style={{ backgroundColor: opt.accentHex }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Mini mockup card inside */}
                <div
                  className="w-full p-3 rounded-lg border flex flex-col gap-2"
                  style={{
                    backgroundColor: opt.bgHex,
                    borderColor: opt.isDark ? '#2A2934' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-16 h-2.5 rounded-full"
                      style={{ backgroundColor: opt.accentHex }}
                    />
                    <div
                      className="w-8 h-2 rounded-full opacity-60"
                      style={{ backgroundColor: opt.textHex }}
                    />
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-[10px] text-white font-bold"
                      style={{ backgroundColor: opt.accentHex }}
                    >
                      ✓
                    </div>
                    <div
                      className="w-4 h-4 rounded border opacity-40"
                      style={{ borderColor: opt.textHex }}
                    />
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-[10px] text-white font-bold"
                      style={{ backgroundColor: opt.accentHex }}
                    >
                      ✓
                    </div>
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-[10px] text-white font-bold"
                      style={{ backgroundColor: opt.accentHex }}
                    >
                      ✓
                    </div>
                    <div
                      className="w-4 h-4 rounded border opacity-40"
                      style={{ borderColor: opt.textHex }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition-colors shadow-subtle"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
