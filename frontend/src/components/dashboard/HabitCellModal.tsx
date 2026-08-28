import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, Clock } from 'lucide-react';
import { HabitGridRow, CellData } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitGridRow | null;
  date: string;
  cellData: CellData | null;
  onSave: (payload: {
    habit_id: string;
    date: string;
    status: string;
    duration_minutes?: number;
  }) => Promise<void>;
}

export const HabitCellModal: React.FC<Props> = ({
  isOpen,
  onClose,
  habit,
  date,
  cellData,
  onSave,
}) => {
  if (!isOpen || !habit) return null;

  const [durationMinutes, setDurationMinutes] = useState<string>(
    cellData?.duration_minutes !== undefined && cellData.duration_minutes > 0
      ? String(cellData.duration_minutes)
      : habit.default_duration_minutes ? String(habit.default_duration_minutes) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (cellData) {
      setDurationMinutes(
        cellData.duration_minutes !== undefined && cellData.duration_minutes > 0
          ? String(cellData.duration_minutes)
          : habit.default_duration_minutes ? String(habit.default_duration_minutes) : ''
      );
    }
  }, [cellData, habit]);

  const handleSelectStatus = async (status: 'completed' | 'partial' | 'rest_day') => {
    setIsSubmitting(true);
    try {
      await onSave({
        habit_id: habit.id,
        date,
        status,
        duration_minutes: durationMinutes ? parseFloat(durationMinutes) : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    setIsSubmitting(true);
    try {
      await onSave({
        habit_id: habit.id,
        date,
        status: 'uncomplete',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatus = cellData?.status;
  const isCurrentlyFilled = currentStatus && currentStatus !== 'future' && currentStatus !== 'missed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm p-6 rounded-3xl bg-surface-elevated border border-border shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1.5 rounded-xl bg-surface border border-border">{habit.icon}</span>
            <div>
              <h3 className="font-bold text-base text-text-primary">{habit.name}</h3>
              <p className="text-xs text-text-secondary">
                {date} {habit.description ? `• ${habit.description}` : ''}
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

        {/* 3 Prominent Options */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSelectStatus('completed')}
            className={`w-full p-3.5 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all active:scale-[0.98] ${
              currentStatus === 'completed'
                ? 'bg-success text-white border-success shadow-subtle ring-2 ring-success/30'
                : 'bg-surface hover:bg-success/10 border-border text-text-primary hover:border-success/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-success/20 text-success flex items-center justify-center font-bold text-base">
                ✓
              </span>
              <span>Completed</span>
            </div>
            <span className="text-xs font-semibold opacity-70">100% Target</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSelectStatus('partial')}
            className={`w-full p-3.5 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all active:scale-[0.98] ${
              currentStatus === 'partial'
                ? 'bg-warning text-white border-warning shadow-subtle ring-2 ring-warning/30'
                : 'bg-surface hover:bg-warning/10 border-border text-text-primary hover:border-warning/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-warning/20 text-warning flex items-center justify-center font-bold text-base">
                ◐
              </span>
              <span>Partial</span>
            </div>
            <span className="text-xs font-semibold opacity-70">Half Done</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSelectStatus('rest_day')}
            className={`w-full p-3.5 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all active:scale-[0.98] ${
              currentStatus === 'rest_day'
                ? 'bg-accent text-white border-accent shadow-subtle ring-2 ring-accent/30'
                : 'bg-surface hover:bg-accent/10 border-border text-text-primary hover:border-accent/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-bold text-base">
                R
              </span>
              <span>Rest Day</span>
            </div>
            <span className="text-xs font-semibold opacity-70">Streak Safe</span>
          </button>
        </div>

        {/* Optional Time Duration input */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
          <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-accent" /> Time (mins):
          </label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="e.g. 30"
            className="w-24 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary text-right focus:border-accent"
          />
        </div>

        {/* Undo / Clear option */}
        {isCurrentlyFilled && (
          <div className="mt-4 pt-3 border-t border-border flex justify-center">
            <button
              type="button"
              onClick={handleUndo}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger/80 py-1 px-3 rounded-lg hover:bg-danger/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear this day
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
