import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Flame, Clock, Award, TrendingUp, Loader2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest(`/analytics?time_range=${timeRange}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Time Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Habit Analytics
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Deep-dive metrics on your consistency, trends, and category distribution.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-surface border border-border shadow-subtle self-start sm:self-auto">
          {(['7d', '30d', '90d', '1y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                timeRange === r
                  ? 'bg-accent text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Summary Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Overall Adherence</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold font-display text-text-primary tabular-nums">
            {data.overall_completion_rate}%
          </span>
          <span className="block text-[11px] text-emerald-600 font-medium mt-1">
            High consistency period
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Consistency Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold font-display text-text-primary tabular-nums">
            {data.consistency_score}/100
          </span>
          <span className="block text-[11px] text-amber-600 font-medium mt-1">
            Deterministic index
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Total Habits Done</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-bold font-display text-text-primary tabular-nums">
            {data.total_habits_completed}
          </span>
          <span className="block text-[11px] text-text-secondary mt-1">
            Logged check-ins
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Time Invested</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-bold font-display text-text-primary tabular-nums">
            {data.total_time_invested_hours}h
          </span>
          <span className="block text-[11px] text-text-secondary mt-1">
            Accumulated focus
          </span>
        </div>
      </div>

      {/* Main Charts: Trendline + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border shadow-subtle">
          <div className="mb-4">
            <h3 className="font-bold text-base text-text-primary">
              Completion Rate Trend ({timeRange.toUpperCase()})
            </h3>
            <p className="text-xs text-text-secondary">
              Daily percentage of completed scheduled habits.
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completion_rate"
                  name="Completion"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-text-primary">
              Category Distribution
            </h3>
            <p className="text-xs text-text-secondary mb-2">
              Habit density across health, coding, and learning.
            </p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_breakdown}
                  dataKey="habit_count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {data.category_breakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
            {data.category_breakdown.map((cat: any) => (
              <span
                key={cat.category}
                className="text-[11px] px-2 py-0.5 rounded-full border border-border font-medium flex items-center gap-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.category} ({cat.habit_count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Habit Consistency Rankings */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle">
        <div className="mb-4">
          <h3 className="font-bold text-base text-text-primary">
            Habit Consistency Leaderboard
          </h3>
          <p className="text-xs text-text-secondary">
            Ranked by completion rate and active streak integrity.
          </p>
        </div>

        <div className="space-y-2.5">
          {data.best_habits.map((item: any, idx: number) => (
            <div
              key={item.habit_id}
              className="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-text-secondary w-4">
                  #{idx + 1}
                </span>
                <span className="text-xl">{item.icon}</span>
                <div>
                  <span className="font-semibold text-sm text-text-primary block">
                    {item.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {item.category} • {item.total_completions} completions
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="font-bold text-sm text-amber-500 flex items-center gap-1 justify-end">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    {item.current_streak}d
                  </span>
                  <span className="text-[10px] text-text-secondary">Streak</span>
                </div>
                <div className="w-16">
                  <span className="font-bold text-sm text-text-primary tabular-nums">
                    {item.completion_rate}%
                  </span>
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mt-1 border border-border/50">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${item.completion_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
