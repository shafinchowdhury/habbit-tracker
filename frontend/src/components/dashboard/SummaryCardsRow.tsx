import React from 'react';
import { SummaryMetrics } from '../../types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  summary: SummaryMetrics;
}

export const SummaryCardsRow: React.FC<Props> = ({ summary }) => {
  // Radar data formatting
  const radarData = summary.domain_balance.map((d) => ({
    subject: d.domain,
    score: d.score,
    fullMark: 100,
  }));

  // Calculations for circular progress stroke
  const circumference = 2 * Math.PI * 38;
  const overallOffset = circumference - (summary.overall_completion_percentage / 100) * circumference;
  const consistencyOffset = circumference - (summary.consistency_score / 100) * circumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Card 1: Overall Completion */}
      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:shadow-subtle transition-all">
        <div className="relative w-24 h-24 my-2 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r="38"
              fill="none"
              stroke="var(--border)"
              strokeWidth="7"
            />
            <circle
              cx="45"
              cy="45"
              r="38"
              fill="none"
              stroke="#14B8A6"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={overallOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-display text-text-primary tabular-nums">
              {Math.round(summary.overall_completion_percentage)}%
            </span>
          </div>
        </div>
        <div className="text-center mt-1">
          <span className="font-semibold text-xs text-text-primary block">
            Overall Completion: {Math.round(summary.overall_completion_percentage)}% 🌱
          </span>
          <span className="text-[11px] text-text-secondary">Tracking period</span>
        </div>
      </div>

      {/* Card 2: Consistency Score */}
      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:shadow-subtle transition-all">
        <div className="relative w-24 h-24 my-2 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r="38"
              fill="none"
              stroke="var(--border)"
              strokeWidth="7"
            />
            <circle
              cx="45"
              cy="45"
              r="38"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={consistencyOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold font-display text-text-primary tabular-nums">
              {summary.consistency_score}/100
            </span>
          </div>
        </div>
        <div className="text-center mt-1">
          <span className="font-semibold text-xs text-text-primary block">
            Consistency Score: {summary.consistency_score}/100 🏆
          </span>
          <span className="text-[11px] text-text-secondary">Adherence & streak metric</span>
        </div>
      </div>

      {/* Card 3: Best Streak */}
      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:shadow-subtle transition-all">
        <div className="relative w-24 h-24 my-2 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-500/80 bg-emerald-500/10 flex flex-col items-center justify-center">
            <span className="text-sm font-bold font-display text-text-primary tabular-nums leading-tight">
              {summary.current_streak_days} Days
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
              Streak
            </span>
          </div>
        </div>
        <div className="text-center mt-1">
          <span className="font-semibold text-xs text-text-primary block">
            Best Streak: {summary.longest_streak_days} Days 🔥
          </span>
          <span className="text-[11px] text-text-secondary">
            {summary.streak_freezes_available} Freezes available
          </span>
        </div>
      </div>

      {/* Card 4: Domain Balance Radar Chart */}
      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:shadow-subtle transition-all">
        <div className="w-full h-24 my-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              />
              <Radar
                name="Domain"
                dataKey="score"
                stroke="#14B8A6"
                fill="#14B8A6"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-1">
          <span className="font-semibold text-xs text-text-primary block">
            Domain Balance 📊
          </span>
          <span className="text-[11px] text-text-secondary">Category distribution</span>
        </div>
      </div>

      {/* Card 5: Time Invested */}
      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:shadow-subtle transition-all">
        <div className="relative w-24 h-24 my-2 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r="38"
              fill="none"
              stroke="var(--border)"
              strokeWidth="7"
            />
            <circle
              cx="45"
              cy="45"
              r="38"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold font-display text-text-primary tabular-nums">
              {summary.time_invested_formatted}
            </span>
          </div>
        </div>
        <div className="text-center mt-1">
          <span className="font-semibold text-xs text-text-primary block">
            Time Invested: {summary.time_invested_formatted} ⏱️
          </span>
          <span className="text-[11px] text-text-secondary">Logged duration habits</span>
        </div>
      </div>
    </div>
  );
};
