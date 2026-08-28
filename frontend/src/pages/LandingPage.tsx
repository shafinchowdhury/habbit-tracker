import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';
import {
  Flame,
  BarChart3,
  Trophy,
  Swords,
  ShieldCheck,
  CheckCircle2,
  Palette,
  ArrowRight,
  Zap,
  Sparkles,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { theme, setTheme, cycleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-accent selection:text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-subtle">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-text-primary">
            HabitQuest
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick theme cycle */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-elevated text-xs font-semibold hover:border-accent/40 transition-colors shadow-subtle"
            title="Cycle preview theme"
          >
            <Palette className="w-3.5 h-3.5 text-accent" />
            <span className="capitalize hidden sm:inline">{theme} Theme</span>
          </button>

          <Link
            to="/login"
            className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl border border-transparent hover:border-border hover:bg-surface transition-colors"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover shadow-subtle transition-all active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 sm:px-12 pt-16 pb-20 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Analytics-First Habit Tracking
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-text-primary max-w-4xl mx-auto leading-tight">
          Build better habits. <br />
          <span className="text-accent">Turn consistency into progress.</span>
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Track your habits, build streaks, challenge friends, and inspect analytical insights across 4 stunning visual themes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent-hover shadow-card transition-all active:scale-95"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-border bg-surface hover:bg-surface-elevated text-text-primary font-bold text-sm transition-colors shadow-subtle flex items-center justify-center"
          >
            Sign In
          </Link>
        </div>

        {/* Interactive Live Hero Dashboard Mockup */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border shadow-elevated text-left space-y-5">
            {/* Mockup Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger/70" />
                <div className="w-3 h-3 rounded-full bg-warning/70" />
                <div className="w-3 h-3 rounded-full bg-success/70" />
                <span className="text-xs text-text-tertiary ml-2">HabitQuest Analytics Dashboard</span>
              </div>
              <div className="flex gap-1">
                {(['clarity', 'midnight', 'fresh', 'harvest'] as ThemeMode[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                      theme === t ? 'bg-accent text-white' : 'bg-surface-elevated text-text-secondary border border-border'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Mockup Weekly Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((w, idx) => (
                <div key={w} className="p-2.5 rounded-xl bg-surface-elevated border border-border text-xs">
                  <div className="flex justify-between font-bold mb-1 text-[11px]">
                    <span>{w}</span>
                    <span className="text-accent">{85 + idx * 2}%</span>
                  </div>
                  <div className="flex gap-1 items-end h-8 pt-1">
                    {[60, 80, 100, 70, 90, 85, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-accent/80 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Mockup 5 Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <span className="font-bold text-base text-text-primary">91%</span>
                <span className="block text-[10px] text-text-secondary">Overall Completion</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <span className="font-bold text-base text-amber-500">94/100</span>
                <span className="block text-[10px] text-text-secondary">Consistency</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <span className="font-bold text-base text-text-primary">14 Days</span>
                <span className="block text-[10px] text-text-secondary">Best Streak 🔥</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <span className="font-bold text-base text-emerald-500">Balanced</span>
                <span className="block text-[10px] text-text-secondary">Domain Radar 📊</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <span className="font-bold text-base text-indigo-500">18.5h</span>
                <span className="block text-[10px] text-text-secondary">Time Invested ⏱️</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Value Highlights */}
      <section className="py-16 px-6 sm:px-12 bg-surface/50 border-y border-border">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold font-display text-text-primary">
              Engineered for Real Consistency
            </h2>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              Not a childish game. A clean, analytical habit dashboard that keeps you accountable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-text-primary">Analytics-First Grid</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Dynamic weekly cards with daily completion bars, threshold target lines, and multi-week custom tracking spans.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 fill-amber-500" />
              </div>
              <h3 className="font-bold text-base text-text-primary">Streaks & Freezes</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Frequency-aware streaks that respect rest days, weekday schedules, and streak freeze protections.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
                <Swords className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-text-primary">Challenges & Friends</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Participate in time-boxed habit sprints, maintain mutual friend streaks, and climb fair percentage leaderboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Section */}
      <section className="py-16 px-6 sm:px-12 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-success/15 text-success flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold font-display text-text-primary">
          Your habits belong to you.
        </h2>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
          Every database query enforces strict server-side authorization. You decide what stays private and what you share with friends.
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 px-6 sm:px-12 text-center text-xs text-text-secondary flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2026 HabitQuest. Production-Ready Habit Analytics.</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-text-primary">Sign In</Link>
          <Link to="/register" className="hover:text-text-primary">Register</Link>
        </div>
      </footer>
    </div>
  );
};
