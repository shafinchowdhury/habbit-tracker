import React, { useState } from 'react';
import {
  HabitGridRow,
  DayColumnHeader,
  CellData,
  WeeklyCard,
} from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  Calendar as CalendarIcon,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { HabitCellModal } from './HabitCellModal';

interface Props {
  habitRows: HabitGridRow[];
  columnHeaders: DayColumnHeader[];
  weeklyCards: WeeklyCard[];
  dailyTimeInvested: Record<string, number>;
  currentMonthYear: string;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onClearAllTicks?: () => Promise<void> | void;
  isClearingTicks?: boolean;
  onToggleCell: (payload: {
    habit_id: string;
    date: string;
    status: string;
    actual_value?: number;
    duration_minutes?: number;
    note?: string;
  }) => Promise<void>;
}

export const MainHabitGrid: React.FC<Props> = ({
  habitRows,
  columnHeaders,
  weeklyCards,
  dailyTimeInvested,
  currentMonthYear,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
  onClearAllTicks,
  isClearingTicks = false,
  onToggleCell,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    habit: HabitGridRow;
    date: string;
    cellData: CellData;
  } | null>(null);

  // Group columns by week
  const weekGroups: { card: WeeklyCard; headers: DayColumnHeader[] }[] = [];
  weeklyCards.forEach((wCard) => {
    const headers = columnHeaders.filter((h) => h.week_index === wCard.week_index);
    if (headers.length > 0) {
      weekGroups.push({ card: wCard, headers });
    }
  });

  const handleCellClick = (habit: HabitGridRow, date: string, cellData: CellData) => {
    setSelectedCell({ habit, date, cellData });
  };

  return (
    <div className="w-full rounded-2xl bg-surface border border-border overflow-hidden shadow-subtle">
      {/* Grid Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border bg-surface-elevated/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/15 text-accent">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-text-primary">
              Habit Tracker
            </h2>
            <span className="text-xs text-text-secondary">
              Click any cell to log or modify
            </span>
          </div>
        </div>

        {/* Month Navigation & Testing Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onClearAllTicks && (
            <button
              onClick={onClearAllTicks}
              disabled={isClearingTicks}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Clear all completed checkmarks across all habits (Testing Only)"
            >
              {isClearingTicks ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>Clear All Ticks (Test)</span>
            </button>
          )}

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          <button
            onClick={onNavigatePrev}
            className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
            title="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-semibold text-sm text-text-primary px-3 py-1 rounded-lg bg-surface border border-border min-w-[130px] text-center">
            {currentMonthYear}
          </span>

          <button
            onClick={onNavigateNext}
            className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
            title="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateToday}
            className="px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10 rounded-lg border border-accent/30 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Table Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[700px]">
          {/* Table Header Tier 1: Week Labels */}
          <thead>
            <tr className="border-b border-border text-xs">
              <th className="sticky left-0 z-20 bg-surface px-4 py-2 font-semibold text-text-secondary w-64 border-r border-border">
                Habits
              </th>
              {weekGroups.map((wg) => (
                <th
                  key={wg.card.week_index}
                  colSpan={wg.headers.length}
                  className="px-2 py-2 text-center font-bold text-xs border-r border-border last:border-r-0"
                  style={{
                    backgroundColor: `${wg.card.accent_color}14`,
                    color: wg.card.accent_color,
                  }}
                >
                  {wg.card.week_label}
                </th>
              ))}
            </tr>

            {/* Table Header Tier 2: Weekdays (S S M T W T F) */}
            <tr className="border-b border-border text-[11px]">
              <th className="sticky left-0 z-20 bg-surface px-4 py-1 text-text-tertiary font-medium border-r border-border">
                Description & Duration
              </th>
              {weekGroups.map((wg) =>
                wg.headers.map((h) => (
                  <th
                    key={h.date}
                    className={`py-1 text-center font-semibold w-8 ${
                      h.is_today
                        ? 'text-accent font-bold bg-accent/10'
                        : 'text-text-secondary'
                    }`}
                    style={{
                      backgroundColor: h.is_today
                        ? undefined
                        : `${wg.card.accent_color}08`,
                    }}
                  >
                    {h.day_letter}
                  </th>
                ))
              )}
            </tr>

            {/* Table Header Tier 3: Day Numbers (1 2 3... 31) */}
            <tr className="border-b border-border text-[11px]">
              <th className="sticky left-0 z-20 bg-surface px-4 py-1 text-text-tertiary font-medium border-r border-border">
                Completion %
              </th>
              {weekGroups.map((wg) =>
                wg.headers.map((h) => (
                  <th
                    key={h.date}
                    className={`py-1 text-center font-medium ${
                      h.is_today
                        ? 'text-accent font-bold bg-accent/15 rounded-t'
                        : 'text-text-tertiary'
                    }`}
                    style={{
                      backgroundColor: h.is_today
                        ? undefined
                        : `${wg.card.accent_color}08`,
                    }}
                  >
                    {h.day_number}
                  </th>
                ))
              )}
            </tr>
          </thead>

          {/* Table Body: Habit Rows */}
          <tbody>
            {habitRows.map((habit, rIdx) => {
              return (
                <tr
                  key={habit.id}
                  className="border-b border-border hover:bg-surface-elevated/40 transition-colors group"
                >
                  {/* Left Column: Habit metadata */}
                  <td className="sticky left-0 z-10 bg-surface group-hover:bg-surface-elevated px-4 py-3 border-r border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{habit.icon}</span>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-text-primary truncate block">
                            {habit.name}
                          </span>
                          <span className="text-[11px] text-text-secondary truncate flex items-center gap-1.5">
                            <span className="truncate">{habit.target_text}</span>
                            {habit.target_days ? (
                              <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                                {habit.target_days}d
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-text-primary px-1.5 py-0.5 rounded bg-surface-elevated border border-border tabular-nums shrink-0">
                        {Math.round(habit.completion_percentage)}%
                      </span>
                    </div>
                  </td>

                  {/* Daily Habit Cells */}
                  {weekGroups.map((wg) =>
                    wg.headers.map((h) => {
                      const cell = habit.cells[h.date] || { status: 'missed' };
                      const isCompleted = cell.status === 'completed';
                      const isPartial = cell.status === 'partial';
                      const isRest = cell.status === 'rest_day';
                      const isFuture = cell.status === 'future';

                      return (
                        <td
                          key={h.date}
                          className="p-1 text-center align-middle"
                          style={{
                            backgroundColor: h.is_today ? 'rgba(37, 99, 235, 0.04)' : undefined,
                          }}
                        >
                          <button
                            onClick={() => handleCellClick(habit, h.date, cell)}
                            disabled={isFuture}
                            title={`${habit.name} • ${h.date} • Status: ${cell.status}`}
                            className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center transition-all ${
                              isFuture
                                ? 'opacity-20 cursor-not-allowed border border-border/60 bg-transparent'
                                : isCompleted
                                ? 'shadow-subtle hover:scale-105 active:scale-95 text-white'
                                : isPartial
                                ? 'border-2 border-warning bg-warning/20 text-warning hover:scale-105'
                                : isRest
                                ? 'border border-dashed border-text-tertiary/60 text-text-tertiary bg-transparent text-[10px]'
                                : 'border border-border bg-surface hover:border-text-secondary hover:bg-surface-elevated'
                            }`}
                            style={{
                              backgroundColor: isCompleted ? wg.card.accent_color : undefined,
                              borderColor:
                                !isCompleted && !isPartial && !isRest
                                  ? `${wg.card.accent_color}50`
                                  : undefined,
                            }}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            {isPartial && <span className="text-xs font-bold leading-none">◐</span>}
                            {isRest && <span className="text-[9px]">R</span>}
                          </button>
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}

            {/* Bottom Summary Row: Time Invested */}
            <tr className="bg-surface-elevated/70 font-semibold text-xs text-text-primary">
              <td className="sticky left-0 z-10 bg-surface-elevated px-4 py-3 border-r border-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span>Time Invested</span>
              </td>
              {weekGroups.map((wg) =>
                wg.headers.map((h) => {
                  const hours = dailyTimeInvested[h.date] || 0;
                  return (
                    <td
                      key={h.date}
                      className="py-3 text-center text-[10px] text-text-secondary tabular-nums"
                      style={{
                        backgroundColor: h.is_today ? 'rgba(37, 99, 235, 0.08)' : undefined,
                      }}
                    >
                      {hours > 0 ? `${hours}h` : '—'}
                    </td>
                  );
                })
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Habit Cell Interactive Modal */}
      {selectedCell && (
        <HabitCellModal
          isOpen={true}
          onClose={() => setSelectedCell(null)}
          habit={selectedCell.habit}
          date={selectedCell.date}
          cellData={selectedCell.cellData}
          onSave={onToggleCell}
        />
      )}
    </div>
  );
};
