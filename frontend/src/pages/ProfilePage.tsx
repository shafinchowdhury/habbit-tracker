import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  Zap,
  Flame,
  Trophy,
  Edit3,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');

  useEffect(() => {
    apiRequest('/gamification/overview')
      .then((res) => setStats(res))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiRequest<any>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: firstName,
          timezone,
        }),
      });
      updateUser(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Profile Banner */}
      <div className="p-8 rounded-3xl bg-surface border border-border shadow-card relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-2xl bg-accent/20 border-2 border-accent flex items-center justify-center text-4xl text-accent font-bold font-display shrink-0">
          {user?.username ? user.username[0].toUpperCase() : 'U'}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold font-display text-text-primary">
                {user?.first_name ? `${user.first_name} (@${user.username})` : `@${user?.username}`}
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                {user?.email} • Timezone: {user?.timezone || 'UTC'}
              </p>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl border border-border bg-surface-elevated text-xs font-semibold text-text-primary hover:bg-surface transition-colors self-center sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" /> {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Quick Stat Pills */}
          <div className="flex flex-wrap gap-2.5 mt-4 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
              <Zap className="w-3.5 h-3.5" /> Level {stats?.level?.current_level || 1}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-500" /> {stats?.streaks?.current_streak || 0}d Streak
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
              <Trophy className="w-3.5 h-3.5" /> {stats?.achievements?.filter((a: any) => a.is_unlocked).length || 0} Achievements
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle animate-in fade-in duration-150">
          <h3 className="font-bold text-base text-text-primary mb-4">Edit Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary"
                placeholder="Shafin Chowdhury"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary"
                placeholder="America/New_York"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold border border-border rounded-xl text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-accent text-white rounded-xl hover:bg-accent-hover"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Key Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border text-center">
          <span className="text-xs text-text-secondary block mb-1">Longest Streak</span>
          <span className="text-2xl font-bold font-display text-text-primary">
            {stats?.streaks?.longest_streak || 0} Days
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-surface border border-border text-center">
          <span className="text-xs text-text-secondary block mb-1">Total XP Earned</span>
          <span className="text-2xl font-bold font-display text-accent">
            {stats?.level?.total_xp?.toLocaleString() || 0} XP
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-surface border border-border text-center">
          <span className="text-xs text-text-secondary block mb-1">Streak Protection</span>
          <span className="text-2xl font-bold font-display text-text-primary">
            {stats?.streaks?.freezes_available || 0} Freezes
          </span>
        </div>
      </div>
    </div>
  );
};
