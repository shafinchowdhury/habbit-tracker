import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Clock, FileText, Calendar, Infinity as InfinityIcon, Loader2 } from 'lucide-react';
import { Habit } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialHabit?: Habit | null;
}

const PRESET_ICONS = ['🎯', '💻', '💧', '🏃', '🏋️', '📚', '🧘', '😴', '🥑', '⚡', '🎨', '📝', '🌿', '🚴', '🧠', '☕'];

const PERIOD_PRESETS: { label: string; days: number | null; subtitle: string }[] = [
  { label: '7 Days', days: 7, subtitle: '1 Week' },
  { label: '14 Days', days: 14, subtitle: '2 Weeks' },
  { label: '21 Days', days: 21, subtitle: 'Habit Formation' },
  { label: '30 Days', days: 30, subtitle: '1 Month Goal' },
  { label: '60 Days', days: 60, subtitle: '2 Months' },
  { label: '90 Days', days: 90, subtitle: 'Quarter Goal' },
  { label: '100 Days', days: 100, subtitle: 'Challenge' },
  { label: 'Ongoing', days: null, subtitle: 'No End Date' },
];

export const HabitFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialHabit,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [name, setName] = useState(initialHabit?.name || '');
  const [description, setDescription] = useState(initialHabit?.description || '');
  const [durationMinutes, setDurationMinutes] = useState<string>(
    initialHabit?.default_duration_minutes ? String(initialHabit.default_duration_minutes) : '30'
  );
  const [icon, setIcon] = useState(initialHabit?.icon || '🎯');
  const [startDate, setStartDate] = useState<string>(
    initialHabit?.start_date ? initialHabit.start_date.split('T')[0] : todayStr
  );

  // Determine initial tracking period
  const getInitialTargetDays = (): number | null => {
    if (initialHabit?.target_days) return initialHabit.target_days;
    if (initialHabit?.end_date && initialHabit?.start_date) {
      const diffMs = new Date(initialHabit.end_date).getTime() - new Date(initialHabit.start_date).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    }
    if (initialHabit && !initialHabit.end_date) return null; // ongoing
    return 30; // default for new habit
  };

  const initialDays = getInitialTargetDays();
  const [targetDays, setTargetDays] = useState<number | null>(initialDays);
  const [isCustomDays, setIsCustomDays] = useState<boolean>(
    initialDays !== null && !PERIOD_PRESETS.some((p) => p.days === initialDays)
  );
  const [customDaysValue, setCustomDaysValue] = useState<string>(
    initialDays !== null && !PERIOD_PRESETS.some((p) => p.days === initialDays) ? String(initialDays) : ''
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute calculated end date string
  const calculateEndDate = (): { endDateStr: string; formatted: string } | null => {
    if (targetDays === null || targetDays <= 0) return null;
    const start = new Date(startDate || todayStr);
    const end = new Date(start.getTime() + targetDays * 24 * 60 * 60 * 1000);
    const dateStr = end.toISOString().split('T')[0];
    const formatted = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return { endDateStr: dateStr, formatted };
  };

  const endCalc = calculateEndDate();

  const handleSelectPreset = (days: number | null) => {
    setIsCustomDays(false);
    setTargetDays(days);
  };

  const handleCustomDaysChange = (val: string) => {
    setCustomDaysValue(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTargetDays(parsed);
    } else if (val === '') {
      setTargetDays(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(startDate || todayStr);
      let endDateTime: Date | null = null;

      if (targetDays !== null && targetDays > 0) {
        endDateTime = new Date(startDateTime.getTime() + targetDays * 24 * 60 * 60 * 1000);
      }

      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        default_duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : 0,
        icon,
        category: 'General',
        color: '#2563EB',
        measurement_type: 'boolean',
        target_value: 1.0,
        unit: 'times',
        frequency_type: 'daily',
        start_date: startDateTime.toISOString(),
        end_date: endDateTime ? endDateTime.toISOString() : null,
        target_days: targetDays,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save habit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg p-6 rounded-3xl bg-surface-elevated border border-border shadow-elevated max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {initialHabit ? 'Edit Habit' : 'Create New Habit'}
              </h3>
              <p className="text-xs text-text-secondary">
                Set routine targets, tracking duration, and consistency goals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Habit Name */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Habit Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary focus:border-accent"
              placeholder="e.g. Drink Water, Code, Read Books"
            />
          </div>

          {/* Description (shown on habit dashboard) */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-accent" /> Description / Target Note
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary focus:border-accent"
              placeholder="e.g. 2.5L throughout the day (shown on dashboard)"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === emoji
                      ? 'bg-accent/20 border-2 border-accent scale-110 shadow-subtle'
                      : 'bg-surface border border-border hover:bg-surface-elevated'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Time Duration (Minutes per Day) */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-accent" /> Daily Time Investment (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(String(mins))}
                  className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    durationMinutes === String(mins)
                      ? 'bg-accent text-white border-accent shadow-subtle'
                      : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary focus:border-accent"
              placeholder="Custom duration in minutes (e.g. 90)"
            />
          </div>

          {/* Tracking Period (Days to Track Habit) */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Tracking Period (How many days?)
              </label>
              <span className="text-[11px] font-medium text-accent">
                {targetDays !== null ? `${targetDays} Days Goal` : 'Ongoing (Indefinite)'}
              </span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {PERIOD_PRESETS.map((preset) => {
                const isSelected =
                  !isCustomDays &&
                  ((preset.days === null && targetDays === null) ||
                    (preset.days !== null && targetDays === preset.days));

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset.days)}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-accent shadow-subtle'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight flex items-center gap-1">
                      {preset.days === null ? <InfinityIcon className="w-3 h-3" /> : null}
                      {preset.label}
                    </span>
                    <span className="text-[10px] opacity-70 mt-0.5">{preset.subtitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Days & Start Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-medium text-text-tertiary mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary focus:border-accent"
                />
              </div>

              {/* Custom Number of Days */}
              <div>
                <label className="block text-[11px] font-medium text-text-tertiary mb-1 flex items-center justify-between">
                  <span>Custom Days</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDays(true);
                      if (!customDaysValue) {
                        setCustomDaysValue('45');
                        setTargetDays(45);
                      }
                    }}
                    className={`text-[10px] underline ${isCustomDays ? 'text-accent font-bold' : 'text-text-secondary'}`}
                  >
                    Use Custom
                  </button>
                </label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={isCustomDays ? customDaysValue : ''}
                  onFocus={() => setIsCustomDays(true)}
                  onChange={(e) => handleCustomDaysChange(e.target.value)}
                  placeholder="e.g. 45 or 120 days"
                  className={`w-full px-3 py-2 rounded-xl bg-surface border text-xs text-text-primary focus:border-accent ${
                    isCustomDays ? 'border-accent ring-1 ring-accent/30' : 'border-border'
                  }`}
                />
              </div>
            </div>

            {/* Live Period Summary Pill */}
            <div className="mt-2 p-2.5 rounded-xl bg-surface border border-border flex items-center gap-2 text-xs">
              <span className="text-sm shrink-0">
                {targetDays !== null ? '🎯' : '♾️'}
              </span>
              <div className="text-text-secondary min-w-0">
                {targetDays !== null && endCalc ? (
                  <span>
                    Track for <strong className="text-text-primary">{targetDays} Days</strong> from{' '}
                    <strong className="text-text-primary">
                      {new Date(startDate || todayStr).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </strong>{' '}
                    until <strong className="text-text-primary">{endCalc.formatted}</strong>
                  </span>
                ) : (
                  <span>
                    <strong className="text-text-primary">Ongoing Habit:</strong> Tracks indefinitely with no end date starting{' '}
                    {new Date(startDate || todayStr).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover shadow-subtle transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : initialHabit
                  ? 'Save Changes'
                  : 'Create Habit'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
