import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';
import { apiRequest } from '../lib/api';
import {
  Flame,
  User,
  Mail,
  Lock,
  ArrowRight,
  Check,
  Palette,
  Sparkles,
  Target,
  Loader2,
  Clock,
  Calendar,
  Infinity as InfinityIcon,
  FileText,
} from 'lucide-react';

const GOAL_OPTIONS = [
  'Coding',
  'Health',
  'Fitness',
  'Learning',
  'Productivity',
  'Mindfulness',
  'Reading',
  'Sleep',
];

const HABIT_SUGGESTIONS: { name: string; icon: string; category: string; duration: number }[] = [
  { name: 'Code for 1 hour', icon: '💻', category: 'Coding', duration: 60 },
  { name: 'Drink 2.5L Water', icon: '💧', category: 'Health', duration: 15 },
  { name: 'Read 20 Pages', icon: '📚', category: 'Learning', duration: 30 },
  { name: '30 Min Workout', icon: '🏃', category: 'Fitness', duration: 30 },
  { name: 'Meditation & Breath', icon: '🧘', category: 'Mindfulness', duration: 15 },
  { name: '8 Hours Sleep', icon: '😴', category: 'Health', duration: 480 },
];

const PRESET_ICONS = ['🎯', '💻', '💧', '🏃', '🏋️', '📚', '🧘', '😴', '🥑', '⚡', '🎨', '📝', '🌿', '🚴', '🧠', '☕'];

const PERIOD_PRESETS: { label: string; days: number | null }[] = [
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '21 Days', days: 21 },
  { label: '30 Days', days: 30 },
  { label: '60 Days', days: 60 },
  { label: '90 Days', days: 90 },
  { label: '100 Days', days: 100 },
  { label: 'Ongoing', days: null },
];

const THEME_OPTIONS: { id: ThemeMode; name: string; subtitle: string; bgHex: string; accentHex: string }[] = [
  { id: 'clarity', name: 'Clarity', subtitle: 'White & Blue', bgHex: '#FFFFFF', accentHex: '#2563EB' },
  { id: 'midnight', name: 'Midnight', subtitle: 'Black & Purple', bgHex: '#0B0B10', accentHex: '#8B5CF6' },
  { id: 'fresh', name: 'Fresh', subtitle: 'Green & White', bgHex: '#FFFFFF', accentHex: '#16A34A' },
  { id: 'harvest', name: 'Harvest', subtitle: 'Green & Gold', bgHex: '#FCFBF3', accentHex: '#65A30D' },
];

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Multi-step form
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Coding', 'Health']);
  const [experience, setExperience] = useState('Intermediate');
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>(['Streaks', 'Personal progress']);

  // Habit creation state
  const [firstHabitName, setFirstHabitName] = useState('Code for 1 hour');
  const [habitIcon, setHabitIcon] = useState('💻');
  const [habitCategory, setHabitCategory] = useState('Coding');
  const [habitDurationMinutes, setHabitDurationMinutes] = useState('30');
  const [habitTargetDays, setHabitTargetDays] = useState<number | null>(30);
  const [habitDescription, setHabitDescription] = useState('Daily focus & development session');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleGoal = (g: string) => {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleMotivation = (m: string) => {
    setSelectedMotivations((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSelectSuggestion = (s: typeof HABIT_SUGGESTIONS[0]) => {
    setFirstHabitName(s.name);
    setHabitIcon(s.icon);
    setHabitCategory(s.category);
    setHabitDurationMinutes(String(s.duration));
  };

  const handleFinish = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // 1. Register user
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim().toLowerCase(),
          first_name: firstName.trim() || undefined,
          password,
        }),
      });

      login(res.access_token, res.user);

      // 2. Update theme
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({ theme }),
      });

      // 3. Create first habit if provided
      if (firstHabitName.trim()) {
        const startD = new Date();
        const endD = habitTargetDays ? new Date(startD.getTime() + habitTargetDays * 24 * 60 * 60 * 1000) : null;

        await apiRequest('/habits', {
          method: 'POST',
          body: JSON.stringify({
            name: firstHabitName.trim(),
            description: habitDescription.trim() || undefined,
            default_duration_minutes: habitDurationMinutes ? parseInt(habitDurationMinutes, 10) : 30,
            icon: habitIcon,
            category: habitCategory,
            color: '#2563EB',
            measurement_type: 'boolean',
            target_value: 1.0,
            unit: 'times',
            frequency_type: 'daily',
            start_date: startD.toISOString(),
            end_date: endD ? endD.toISOString() : null,
            target_days: habitTargetDays,
          }),
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setStep(1); // revert back to account step to fix
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-surface border border-border shadow-elevated space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-subtle">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <span className="font-bold text-base font-display text-text-primary">
              HabitQuest Setup
            </span>
          </div>
          <span className="text-xs font-semibold text-text-secondary">
            Step {step} of 4
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Account Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-display text-text-primary">
                Create Your Account
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Your private dashboard is waiting.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
                  placeholder="shafin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
                placeholder="Shafin Chowdhury"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!username.trim() || !email.trim() || !password.trim()}
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover shadow-card transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Goals & Experience */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold font-display text-text-primary">
                What do you want to improve?
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Select your focus categories.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GOAL_OPTIONS.map((g) => {
                const isSelected = selectedGoals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGoal(g)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-accent ring-2 ring-accent/20'
                        : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                Habit Tracking Experience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setExperience(exp)}
                    className={`py-2 rounded-xl border text-xs font-semibold ${
                      experience === exp
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-elevated border-border text-text-secondary'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover shadow-subtle"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Choose Your Theme (Step 3.5 from spec) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" /> Choose Your Theme
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Pick your preferred appearance. You can change this anytime in Settings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-accent ring-2 ring-accent/30 bg-surface-elevated shadow-subtle'
                        : 'border-border bg-surface-elevated/40 hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: opt.accentHex }}
                      />
                      <div>
                        <span className="font-semibold text-xs text-text-primary block">
                          {opt.name}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {opt.subtitle}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-accent" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover shadow-subtle"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: First Habit & Launch */}
        {step === 4 && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" /> Create Your First Habit
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Set a daily routine to begin your streak and build consistency.
              </p>
            </div>

            {/* Quick Inspiration Chips */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1.5">
                Quick Suggestions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HABIT_SUGGESTIONS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      firstHabitName === s.name
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Habit Name */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Habit Name
              </label>
              <input
                type="text"
                required
                value={firstHabitName}
                onChange={(e) => setFirstHabitName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
                placeholder="e.g. Code for 1 hour"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-accent" /> Description / Target Note
              </label>
              <input
                type="text"
                value={habitDescription}
                onChange={(e) => setHabitDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-border text-xs text-text-primary focus:border-accent"
                placeholder="e.g. 2.5L throughout the day"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ICONS.slice(0, 10).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setHabitIcon(emoji)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                      habitIcon === emoji
                        ? 'bg-accent/20 border-2 border-accent scale-105'
                        : 'bg-surface-elevated border border-border hover:bg-surface'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Duration */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent" /> Daily Time (Minutes)
              </label>
              <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setHabitDurationMinutes(String(mins))}
                    className={`py-1.5 rounded-lg border text-xs font-semibold ${
                      habitDurationMinutes === String(mins)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-elevated border-border text-text-secondary'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Tracking Duration */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent" /> Tracking Period
                </span>
                <span className="text-[10px] text-accent">
                  {habitTargetDays ? `${habitTargetDays} Days Goal` : 'Ongoing'}
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PERIOD_PRESETS.slice(0, 8).map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setHabitTargetDays(p.days)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold truncate ${
                      habitTargetDays === p.days
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-surface-elevated border-border text-text-secondary'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isLoading || !firstHabitName.trim()}
                onClick={handleFinish}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover shadow-card transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Launch HabitQuest Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-accent hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
