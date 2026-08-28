import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { DashboardResponse, HabitGridRow, CellData } from '../types';
import { WeeklyCardsRow } from '../components/dashboard/WeeklyCardsRow';
import { SummaryCardsRow } from '../components/dashboard/SummaryCardsRow';
import { MainHabitGrid } from '../components/dashboard/MainHabitGrid';
import { HabitFormModal } from '../components/habits/HabitFormModal';
import { Loader2, Plus, Sparkles } from 'lucide-react';

interface Props {
  selectedWeekSpan: number;
  isAddHabitOpen: boolean;
  onCloseAddHabit: () => void;
  onUpdateStats: (level: number, xp: number) => void;
}

export const DashboardPage: React.FC<Props> = ({
  selectedWeekSpan,
  isAddHabitOpen,
  onCloseAddHabit,
  onUpdateStats,
}) => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [focusDate, setFocusDate] = useState<Date>(new Date());

  const fetchDashboard = async (targetDate?: Date) => {
    setIsLoading(true);
    try {
      const d = targetDate || focusDate;
      const dateStr = d.toISOString().split('T')[0];
      const res = await apiRequest<DashboardResponse>(
        `/dashboard?week_span=${selectedWeekSpan}&target_date=${dateStr}`
      );
      setData(res);
      onUpdateStats(res.level, res.current_xp);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedWeekSpan, focusDate]);

  const handleNavigatePrev = () => {
    const newDate = new Date(focusDate);
    newDate.setDate(newDate.getDate() - selectedWeekSpan * 7);
    setFocusDate(newDate);
  };

  const handleNavigateNext = () => {
    const newDate = new Date(focusDate);
    newDate.setDate(newDate.getDate() + selectedWeekSpan * 7);
    setFocusDate(newDate);
  };

  const handleNavigateToday = () => {
    setFocusDate(new Date());
  };

  const handleToggleCell = async (payload: {
    habit_id: string;
    date: string;
    status: string;
    actual_value?: number;
    duration_minutes?: number;
    note?: string;
  }) => {
    await apiRequest('/completions/toggle', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // Refresh dashboard data seamlessly
    await fetchDashboard();
  };

  const handleCreateHabit = async (habitData: any) => {
    await apiRequest('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
    await fetchDashboard();
  };

  const [isClearingTicks, setIsClearingTicks] = useState<boolean>(false);

  const handleClearAllTicks = async () => {
    if (
      !window.confirm(
        '⚠️ Clear all ticks: Are you sure you want to clear all habit completion checkmarks/ticks? (Testing Only)'
      )
    ) {
      return;
    }
    setIsClearingTicks(true);
    try {
      await apiRequest('/completions/clear-all', {
        method: 'DELETE',
      });
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to clear ticks', err);
    } finally {
      setIsClearingTicks(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="text-sm font-medium text-text-secondary">
          Loading your analytics dashboard...
        </span>
      </div>
    );
  }

  if (!data) return null;

  const currentMonthYear = focusDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP: Dynamic Weekly Performance Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Weekly Performance ({selectedWeekSpan} {selectedWeekSpan === 1 ? 'Week' : 'Weeks'})
          </h2>
        </div>
        <WeeklyCardsRow cards={data.weekly_cards} />
      </section>

      {/* 2. MIDDLE: 5 Summary Analytics Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Summary Metrics
          </h2>
        </div>
        <SummaryCardsRow summary={data.summary} />
      </section>

      {/* 3. BOTTOM: Main Habit Tracking Grid */}
      <section>
        {data.habit_rows.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface border border-border text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto text-xl">
              🌱
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Start Building Your Routine
              </h3>
              <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
                You don't have any active habits yet. Add your first habit to begin tracking consistency.
              </p>
            </div>
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover shadow-subtle transition-all"
            >
              <Plus className="w-4 h-4" /> Create Your First Habit
            </button>
          </div>
        ) : (
          <MainHabitGrid
            habitRows={data.habit_rows}
            columnHeaders={data.column_headers}
            weeklyCards={data.weekly_cards}
            dailyTimeInvested={data.daily_time_invested}
            currentMonthYear={currentMonthYear}
            onNavigatePrev={handleNavigatePrev}
            onNavigateNext={handleNavigateNext}
            onNavigateToday={handleNavigateToday}
            onClearAllTicks={handleClearAllTicks}
            isClearingTicks={isClearingTicks}
            onToggleCell={handleToggleCell}
          />
        )}
      </section>

      {/* Habit Creation Modal */}
      <HabitFormModal
        isOpen={isAddHabitOpen}
        onClose={onCloseAddHabit}
        onSubmit={handleCreateHabit}
      />
    </div>
  );
};
