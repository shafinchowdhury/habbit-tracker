import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Challenge } from '../types';
import { Swords, Plus, Users, Trophy, Check, Calendar, Loader2, X } from 'lucide-react';

export const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Coding');
  const [durationDays, setDurationDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<Challenge[]>('/challenges');
      setChallenges(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await apiRequest('/challenges', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          duration_days: durationDays,
          xp_reward: durationDays * 20,
        }),
      });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      await fetchChallenges();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    await apiRequest(`/challenges/${challengeId}/join`, { method: 'POST' });
    await fetchChallenges();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Challenges & Sprints
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Compete or cooperate with friends to complete time-boxed habits.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover shadow-subtle transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Challenge
        </button>
      </div>

      {/* Challenges List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-24">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-border text-center space-y-3">
          <div className="text-3xl">⚔️</div>
          <h3 className="font-bold text-base text-text-primary">
            No active challenges
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Create a sprint and invite friends to track habits together.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {challenges.map((challenge) => {
            return (
              <div
                key={challenge.id}
                className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                        {challenge.category} • {challenge.duration_days} Days
                      </span>
                      <h3 className="text-lg font-bold text-text-primary mt-2">
                        {challenge.title}
                      </h3>
                      {challenge.description && (
                        <p className="text-xs text-text-secondary mt-1">
                          {challenge.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-500 block">
                        +{challenge.xp_reward} XP
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        {challenge.participants_count} Joined
                      </span>
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> Leaderboard (Completion %)
                    </h4>
                    <div className="space-y-2">
                      {challenge.leaderboard.map((p, idx) => (
                        <div
                          key={p.user.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-surface-elevated text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-tertiary w-4">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-text-primary">
                              {p.user.first_name || p.user.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary tabular-nums">
                              {p.completion_percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Join / Status Action */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    Created by {challenge.creator_name}
                  </span>
                  {challenge.is_joined ? (
                    <span className="text-xs font-semibold text-success flex items-center gap-1">
                      <Check className="w-4 h-4" /> Joined
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-subtle transition-all"
                    >
                      Join Challenge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Challenge Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md p-6 rounded-2xl bg-surface-elevated border border-border shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="font-bold text-lg text-text-primary">Create Challenge</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary"
                  placeholder="e.g. 30 Day Coding Sprint"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary"
                >
                  <option value="Coding">Coding</option>
                  <option value="Health">Health</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Learning">Learning</option>
                  <option value="Mindfulness">Mindfulness</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Duration (Days)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 14, 30, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationDays(d)}
                      className={`py-2 rounded-xl border text-xs font-semibold ${
                        durationDays === d
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface border-border text-text-secondary'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-subtle"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
