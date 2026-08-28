import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Habit, CellData } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState(new Date().toISOString().split('T')[0]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayCompletions, setDayCompletions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDayData = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const [hList, comps] = await Promise.all([
        apiRequest<Habit[]>('/habits'),
        apiRequest<any[]>(`/completions/day/${dateStr}`),
      ]);
      setHabits(hList);
      setDayCompletions(comps);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDayData(selectedDayStr);
  }, [selectedDayStr]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const compMap = new Map(dayCompletions.map((c) => [c.habit_id, c]));

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary">
          Habit Calendar
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Inspect past consistency, detailed daily logs, and completion history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Calendar Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text-primary">{monthName}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-border bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-border bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-text-secondary mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="h-20 rounded-xl bg-surface-elevated/20 opacity-30" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDayStr === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10 ring-2 ring-accent/30 shadow-subtle'
                      : isToday
                      ? 'border-accent/40 bg-surface-elevated text-text-primary font-bold'
                      : 'border-border bg-surface-elevated/60 hover:bg-surface-elevated text-text-primary'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'text-accent font-bold' : ''}`}>
                    {dayNum}
                  </span>
                  <div className="flex gap-1 items-center justify-end">
                    <span className="w-2 h-2 rounded-full bg-success/80" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Date Day Breakdown */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                Day Breakdown
              </span>
              <h3 className="text-lg font-bold text-text-primary mt-0.5">
                {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-success/15 text-success">
              {dayCompletions.filter((c) => c.status === 'completed').length} / {habits.length} Done
            </span>
          </div>

          {/* Habit Activity List for Day */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {habits.map((habit) => {
              const comp = compMap.get(habit.id);
              const isDone = comp && (comp.status === 'completed' || comp.status === 'partial');

              return (
                <div
                  key={habit.id}
                  className="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDone
                          ? 'bg-success text-white'
                          : 'border border-border text-text-tertiary'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : '○'}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-text-primary truncate block">
                        {habit.icon} {habit.name}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {comp ? `${comp.actual_value} / ${comp.target_value} ${habit.unit}` : `Target: ${habit.target_value} ${habit.unit}`}
                      </span>
                    </div>
                  </div>

                  {comp?.duration_minutes ? (
                    <span className="text-xs font-semibold text-accent shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {comp.duration_minutes}m
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
