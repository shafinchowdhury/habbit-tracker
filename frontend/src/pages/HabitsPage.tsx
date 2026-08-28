import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Habit } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  Flame,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { HabitFormModal } from '../components/habits/HabitFormModal';

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchHabits = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<Habit[]>('/habits?include_archived=true');
      setHabits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreateOrUpdate = async (habitData: any) => {
    if (editingHabit) {
      await apiRequest(`/habits/${editingHabit.id}`, {
        method: 'PUT',
        body: JSON.stringify(habitData),
      });
    } else {
      await apiRequest('/habits', {
        method: 'POST',
        body: JSON.stringify(habitData),
      });
    }
    setEditingHabit(null);
    await fetchHabits();
  };

  const handleToggleArchive = async (habit: Habit) => {
    await apiRequest(`/habits/${habit.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_archived: !habit.is_archived }),
    });
    await fetchHabits();
  };

  const handleDelete = async (habitId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this habit and all its history?')) {
      return;
    }
    await apiRequest(`/habits/${habitId}`, { method: 'DELETE' });
    await fetchHabits();
  };

  const handleClearAllHabits = async () => {
    if (
      !window.confirm(
        '⚠️ CLEAR ALL HABITS: Are you sure you want to delete ALL active habits? This action cannot be undone.'
      )
    ) {
      return;
    }
    setIsClearing(true);
    try {
      await apiRequest('/habits/clear-all', { method: 'DELETE' });
      await fetchHabits();
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAllArchives = async () => {
    if (
      !window.confirm(
        '⚠️ CLEAR ALL ARCHIVES: Are you sure you want to permanently delete ALL archived habits?'
      )
    ) {
      return;
    }
    setIsClearing(true);
    try {
      await apiRequest('/habits/clear-archives', { method: 'DELETE' });
      await fetchHabits();
    } finally {
      setIsClearing(false);
    }
  };

  const activeHabits = habits.filter((h) => !h.is_archived);
  const archivedHabits = habits.filter((h) => h.is_archived);
  const filteredHabits = filter === 'archived' ? archivedHabits : activeHabits;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            My Habits
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your daily targets and active routines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {filter === 'active' && activeHabits.length > 0 && (
            <button
              onClick={handleClearAllHabits}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Habits
            </button>
          )}

          {filter === 'archived' && archivedHabits.length > 0 && (
            <button
              onClick={handleClearAllArchives}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Archives
            </button>
          )}

          <button
            onClick={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover shadow-subtle transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Habit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
            filter === 'active'
              ? 'bg-surface-elevated text-accent border border-border shadow-subtle'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          Active Habits ({activeHabits.length})
        </button>

        <button
          onClick={() => setFilter('archived')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
            filter === 'archived'
              ? 'bg-surface-elevated text-accent border border-border shadow-subtle'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          Archived ({archivedHabits.length})
        </button>
      </div>

      {/* Habit Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-border text-center space-y-3">
          <div className="text-3xl">🌱</div>
          <h3 className="font-bold text-base text-text-primary">
            No {filter} habits found
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {filter === 'active'
              ? 'Add a habit to start building consistency.'
              : 'You have no archived habits.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => (
            <div
              key={habit.id}
              className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between hover:shadow-card transition-all group"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-surface-elevated border border-border">
                      {habit.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-text-primary">
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {habit.default_duration_minutes ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10">
                            <Clock className="w-3 h-3" /> {habit.default_duration_minutes} mins
                          </span>
                        ) : null}
                        {habit.target_days ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">
                            <Calendar className="w-3 h-3" /> {habit.target_days} Days Goal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-tertiary px-2 py-0.5 rounded-full bg-surface-elevated">
                            ♾️ Ongoing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingHabit(habit);
                        setIsModalOpen(true);
                      }}
                      title="Edit Habit"
                      className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(habit)}
                      title={habit.is_archived ? 'Restore' : 'Archive'}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                    >
                      {habit.is_archived ? (
                        <ArchiveRestore className="w-4 h-4 text-success" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      title="Delete Habit"
                      className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-surface-elevated transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description shown on dashboard */}
                {habit.description && (
                  <p className="text-xs text-text-secondary line-clamp-2 my-2 bg-surface-elevated/60 p-2.5 rounded-xl border border-border/50">
                    {habit.description}
                  </p>
                )}
              </div>

              {/* Card Footer: Streak */}
              <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs mt-2">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {habit.current_streak} Day Streak
                </span>
                <span className="text-text-secondary">
                  Best: <strong className="text-text-primary">{habit.longest_streak}d</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <HabitFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        initialHabit={editingHabit}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
};
