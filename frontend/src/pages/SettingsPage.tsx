import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';
import { apiRequest, API_BASE } from '../lib/api';
import {
  Palette,
  Bell,
  Lock,
  Download,
  Trash2,
  Check,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const THEME_OPTIONS: { id: ThemeMode; name: string; subtitle: string; bgHex: string; accentHex: string }[] = [
  { id: 'clarity', name: 'Clarity', subtitle: 'Clean white & royal blue', bgHex: '#FFFFFF', accentHex: '#2563EB' },
  { id: 'midnight', name: 'Midnight', subtitle: 'Deep dark & purple', bgHex: '#0B0B10', accentHex: '#8B5CF6' },
  { id: 'fresh', name: 'Fresh', subtitle: 'Crisp green & whitespace', bgHex: '#FFFFFF', accentHex: '#16A34A' },
  { id: 'harvest', name: 'Harvest', subtitle: 'Warm olive & golden reward', bgHex: '#FCFBF3', accentHex: '#65A30D' },
];

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [reminderEnabled, setReminderEnabled] = useState(user?.settings?.reminder_enabled || false);
  const [reminderTime, setReminderTime] = useState(user?.settings?.daily_reminder_time || '20:00');
  const [profileVis, setProfileVis] = useState(user?.settings?.profile_visibility || 'PUBLIC');
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveSettings = async () => {
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          theme,
          reminder_enabled: reminderEnabled,
          daily_reminder_time: reminderTime,
          profile_visibility: profileVis,
        }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/settings/export/json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('habitquest_token')}`,
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitquest_data_${user?.username || 'export'}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('⚠️ PERMANENT ACTION: Are you sure you want to permanently delete your account and all history? This cannot be undone.')) {
      await apiRequest('/settings/account', { method: 'DELETE' });
      logout();
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary">
          Settings & Preferences
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Customize your theme, reminders, privacy rules, and data.
        </p>
      </div>

      {/* 1. Appearance Theme Picker */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-accent" />
          <div>
            <h2 className="font-bold text-base text-text-primary">
              Appearance Theme
            </h2>
            <p className="text-xs text-text-secondary">
              Select your color palette. Controls all cards, buttons, borders, and charts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent/30 shadow-subtle bg-surface-elevated'
                    : 'border-border bg-surface-elevated/40 hover:bg-surface-elevated'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full border shadow-subtle"
                    style={{ backgroundColor: opt.accentHex }}
                  />
                  <div>
                    <span className="font-semibold text-sm text-text-primary block">
                      {opt.name}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {opt.subtitle}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Notifications & Daily Reminders */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          <div>
            <h2 className="font-bold text-base text-text-primary">
              Notifications & Daily Reminders
            </h2>
            <p className="text-xs text-text-secondary">
              Stay accountable with daily check-in prompts.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border">
            <div>
              <span className="font-semibold text-sm text-text-primary block">
                Daily Check-in Reminder
              </span>
              <span className="text-xs text-text-secondary">
                Receive an alert at your scheduled reflection time.
              </span>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-accent"
            />
          </div>

          {reminderEnabled && (
            <div className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">Reminder Time</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Privacy & Visibility */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-accent" />
          <div>
            <h2 className="font-bold text-base text-text-primary">
              Privacy & Habit Sharing
            </h2>
            <p className="text-xs text-text-secondary">
              Your habits belong to you. Choose what is visible to friends.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
            Profile Visibility
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['PUBLIC', 'FRIENDS', 'PRIVATE'].map((vis) => (
              <button
                key={vis}
                onClick={() => setProfileVis(vis)}
                className={`py-2 rounded-xl border text-xs font-semibold uppercase ${
                  profileVis === vis
                    ? 'bg-accent/15 border-accent text-accent ring-2 ring-accent/20'
                    : 'bg-surface-elevated border-border text-text-secondary'
                }`}
              >
                {vis}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Settings Action */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover shadow-subtle transition-all active:scale-95"
          >
            Save Preferences
          </button>
          {isSaved && (
            <span className="text-xs text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          )}
        </div>
      </div>

      {/* 4. Data Export & Account Deletion */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
        <h2 className="font-bold text-base text-text-primary">
          Data Portability & Account Management
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div>
            <span className="font-semibold text-sm text-text-primary block">
              Export Habit History
            </span>
            <span className="text-xs text-text-secondary">
              Download your complete habit history, completions, and streaks in JSON format.
            </span>
          </div>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-surface-elevated hover:bg-surface text-xs font-semibold text-text-primary shadow-subtle transition-colors shrink-0"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export JSON</span>
          </button>
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-sm text-danger block">
              Permanently Delete Account
            </span>
            <span className="text-xs text-text-secondary">
              Permanently remove your account and erase all habit data from the database.
            </span>
          </div>

          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-danger/40 bg-danger/10 text-danger hover:bg-danger text-xs font-semibold hover:text-white transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};
