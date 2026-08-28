import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Trophy, Zap, Flame, Shield, Lock, CheckCircle2, Award, Loader2 } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGamification = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/gamification/overview');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGamification();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const { level, streaks, achievements, recent_xp } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary">
          Achievements & Gamification
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Level up through consistency, unlock milestones, and protect your streaks.
        </p>
      </div>

      {/* Top Banner: Level Progress Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center text-2xl font-bold font-display shadow-subtle">
              {level.current_level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">
                  Level {level.current_level}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent">
                  {level.title}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {level.level_current_xp} / {level.level_target_xp} XP to next level
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-xs text-text-secondary block">Total Earned</span>
              <span className="text-xl font-bold font-display text-text-primary tabular-nums">
                {level.total_xp.toLocaleString()} XP
              </span>
            </div>
            <div className="pl-4 border-l border-border">
              <span className="text-xs text-text-secondary block">Streak Freezes</span>
              <span className="text-xl font-bold text-accent tabular-nums flex items-center gap-1">
                <Shield className="w-4 h-4 fill-accent/20" /> {streaks.freezes_available}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-surface-elevated border border-border overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${level.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Milestone Badges
          </h3>
          <span className="text-xs font-semibold text-text-secondary">
            {achievements.filter((a: any) => a.is_unlocked).length} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach: any) => {
            const isUnlocked = ach.is_unlocked;
            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? 'bg-surface border-border shadow-subtle'
                    : 'bg-surface/50 border-border/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2.5 rounded-xl bg-surface-elevated border border-border">
                        {ach.icon}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                          {ach.title}
                          {!isUnlocked && <Lock className="w-3 h-3 text-text-tertiary" />}
                        </h4>
                        <span className="text-[11px] text-text-secondary capitalize">
                          {ach.tier} Tier • +{ach.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {ach.description}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
                  {isUnlocked ? (
                    <span className="text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-text-tertiary font-medium">
                      Progress: {ach.progress_value} / {ach.target_value}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-accent">
                    +{ach.xp_reward} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent XP Activity Ledger */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle">
        <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" /> Recent XP Transactions
        </h3>

        <div className="divide-y divide-border">
          {recent_xp.map((tx: any) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-text-primary block">
                  {tx.description || tx.source}
                </span>
                <span className="text-[11px] text-text-tertiary">
                  {new Date(tx.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span className="font-bold text-accent">+{tx.amount} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
