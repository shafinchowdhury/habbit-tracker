import React, { useState, useEffect } from 'react';
import {
  Bell,
  Palette,
  Plus,
  Zap,
  Flame,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/api';
import { NotificationItem } from '../../types';

interface Props {
  onOpenAddHabit: () => void;
  onOpenThemeModal: () => void;
  selectedWeekSpan: number;
  onChangeWeekSpan: (span: number) => void;
  level?: number;
  xp?: number;
}

export const Header: React.FC<Props> = ({
  onOpenAddHabit,
  onOpenThemeModal,
  selectedWeekSpan,
  onChangeWeekSpan,
  level = 1,
  xp = 0,
}) => {
  const { user } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const [greeting, setGreeting] = useState('Good day');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch initial notifications
    apiRequest<NotificationItem[]>('/settings') // or activity/notifications
      .catch(() => {});
  }, []);

  const displayName = user?.first_name || user?.username || 'Tracker';
  const weekOptions = [1, 2, 3, 4, 5, 6, 8];

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 px-4 sm:px-8 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Greeting and subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
            {greeting}, {displayName}
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
            <Zap className="w-3 h-3" /> Level {level}
          </span>
        </div>
        <p className="text-sm text-text-secondary mt-0.5">
          Here's your progress at a glance.
        </p>
      </div>

      {/* Center/Right Controls */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Dynamic Week Span Picker */}
        <div className="flex items-center bg-surface-elevated p-1 rounded-xl border border-border shadow-subtle">
          <span className="text-xs font-medium text-text-secondary px-2 hidden sm:inline">
            Span:
          </span>
          {weekOptions.map((num) => (
            <button
              key={num}
              onClick={() => onChangeWeekSpan(num)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedWeekSpan === num
                  ? 'bg-accent text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              {num}W
            </button>
          ))}
        </div>

        {/* Theme quick toggle button */}
        <button
          onClick={onOpenThemeModal}
          title={`Theme: ${theme.toUpperCase()}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated border border-border text-xs font-medium text-text-primary hover:border-accent/40 hover:bg-surface shadow-subtle transition-all"
        >
          <Palette className="w-4 h-4 text-accent" />
          <span className="capitalize hidden sm:inline">{theme}</span>
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-surface-elevated border border-border text-text-secondary hover:text-text-primary hover:bg-surface shadow-subtle transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-surface-elevated border border-border shadow-elevated z-50">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">Notifications</span>
                <span className="text-xs text-text-secondary">3 new</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-surface border border-border/60 text-xs">
                  <p className="font-semibold text-text-primary">🔥 14-Day Streak Alive!</p>
                  <p className="text-text-secondary mt-0.5">You kept your coding streak rolling today.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60 text-xs">
                  <p className="font-semibold text-text-primary">🏆 Achievement Unlocked</p>
                  <p className="text-text-secondary mt-0.5">You earned "On Fire" (+100 XP)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border/60 text-xs">
                  <p className="font-semibold text-text-primary">👥 Arif sent friend request</p>
                  <p className="text-text-secondary mt-0.5">Arif joined your circle.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Level & XP stat badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border shadow-subtle">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
            {level}
          </div>
          <div className="text-left">
            <span className="block text-[11px] font-semibold text-text-primary tabular-nums">
              {xp.toLocaleString()} XP
            </span>
            <span className="block text-[10px] text-text-secondary">Total Earned</span>
          </div>
        </div>

        {/* Primary CTA: Add Habit */}
        <button
          onClick={onOpenAddHabit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover shadow-subtle transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Habit</span>
        </button>
      </div>
    </header>
  );
};
