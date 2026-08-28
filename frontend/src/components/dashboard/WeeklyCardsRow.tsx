import React from 'react';
import { WeeklyCard } from '../../types';

interface Props {
  cards: WeeklyCard[];
}

export const WeeklyCardsRow: React.FC<Props> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        return (
          <div
            key={card.week_index}
            className="flex flex-col p-4 rounded-2xl bg-surface border border-border hover:shadow-subtle transition-all"
          >
            {/* Header label */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-text-primary">
                {card.week_label}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${card.accent_color}18`,
                  color: card.accent_color,
                }}
              >
                {Math.round(card.completion_percentage)}%
              </span>
            </div>

            {/* Bar chart container with target and average lines */}
            <div className="relative h-28 w-full flex items-end justify-between gap-1.5 px-1 py-2 my-1 bg-surface-elevated/40 rounded-xl border border-border/40">
              {/* Target Threshold Line (Gold / Orange) */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-amber-500/60 z-10 pointer-events-none"
                style={{ bottom: `${card.target_threshold}%` }}
                title={`Target: ${card.target_threshold}%`}
              />

              {/* Average Threshold Line (Blue) */}
              <div
                className="absolute left-0 right-0 border-b border-blue-400/50 z-10 pointer-events-none"
                style={{ bottom: `${card.average_threshold}%` }}
                title={`Average: ${card.average_threshold}%`}
              />

              {/* 7 Daily Bars */}
              {card.days.map((d, dIdx) => {
                const heightPct = d.is_future ? 10 : Math.max(8, d.completion_rate);
                return (
                  <div
                    key={dIdx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-surface-elevated px-2 py-1 rounded-lg border border-border text-[10px] text-text-primary shadow-subtle z-20 whitespace-nowrap">
                      <span>{d.date}</span>
                      <span className="font-bold">{d.completion_rate}% ({d.completed_count}/{d.total_count})</span>
                    </div>

                    {/* The vertical bar */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        d.is_future ? 'opacity-25' : 'hover:opacity-90'
                      }`}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: card.accent_color,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Standout caption metrics */}
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">
                {card.highlight_metric || `${Math.round(card.completion_percentage)}% | Consistent`}
              </span>
              <span className="text-text-tertiary text-[11px]">
                {card.strongest_habit_label || 'Active'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
