import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { AdminUserSummary, AdminStats, AdminUserDetail, Habit } from '../types';
import {
  Shield,
  ShieldCheck,
  Users,
  CheckSquare,
  Trophy,
  Zap,
  Flame,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  Mail,
  User as UserIcon,
  X,
  Loader2,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'active'>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        apiRequest<AdminUserSummary[]>('/admin/users'),
        apiRequest<AdminStats>('/admin/stats'),
      ]);
      setUsers(usersRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleInspectUser = async (userId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await apiRequest<AdminUserDetail>(`/admin/users/${userId}`);
      setSelectedUserDetail(detail);
    } catch (err) {
      console.error('Failed to load user detail', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.first_name && u.first_name.toLowerCase().includes(query)) ||
      u.id.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (roleFilter === 'admin') return u.is_superuser;
    if (roleFilter === 'active') return u.active_habits > 0;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold shadow-subtle border border-rose-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-text-primary">
                Admin Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-500 border border-rose-500/30">
                Superuser
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Inspect user registrations, habits, activity logs, and system metrics.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-text-secondary hover:text-text-primary transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-accent" /> Total Users
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-text-primary">
                {stats.total_users}
              </span>
              <span className="text-[10px] text-success font-semibold">Registered</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> Active Habits
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-text-primary">
                {stats.total_active_habits}
              </span>
              <span className="text-[10px] text-text-secondary">Tracking</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Completions
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-text-primary">
                {stats.total_completions}
              </span>
              <span className="text-[10px] text-amber-500 font-semibold">Total Logs</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-purple-500" /> Platform XP
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-text-primary">
                {stats.total_xp.toLocaleString()}
              </span>
              <span className="text-[10px] text-purple-500 font-semibold">XP Earned</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" /> Active 7-Days
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-text-primary">
                {stats.active_users_last_7d}
              </span>
              <span className="text-[10px] text-text-secondary">Engaged</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, email, ID..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-elevated border border-border text-xs text-text-primary focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === 'all'
                ? 'bg-accent text-white shadow-subtle'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === 'admin'
                ? 'bg-rose-500 text-white shadow-subtle'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`}
          >
            Admins ({users.filter((u) => u.is_superuser).length})
          </button>
          <button
            onClick={() => setRoleFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === 'active'
                ? 'bg-emerald-500 text-white shadow-subtle'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`}
          >
            With Habits ({users.filter((u) => u.active_habits > 0).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-subtle">
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            No users found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/60 text-text-secondary font-semibold">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Level & XP</th>
                  <th className="px-4 py-3">Habits</th>
                  <th className="px-4 py-3">Streaks</th>
                  <th className="px-4 py-3">Completions</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-elevated/40 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.username}
                            className="w-9 h-9 rounded-xl object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                            {u.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text-primary">
                              {u.first_name || u.username}
                            </span>
                            <span className="text-[11px] text-text-tertiary">
                              @{u.username}
                            </span>
                          </div>
                          <span className="text-[11px] text-text-secondary block">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {u.is_superuser ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-500/15 text-rose-500 border border-rose-500/30">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-surface-elevated text-text-secondary border border-border">
                          <UserIcon className="w-3 h-3" /> Member
                        </span>
                      )}
                    </td>

                    {/* Level & XP */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-accent">Lvl {u.level}</span>
                        <span className="text-text-tertiary">•</span>
                        <span className="text-text-secondary">{u.current_xp.toLocaleString()} XP</span>
                      </div>
                    </td>

                    {/* Habits */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-text-primary">
                        {u.active_habits}{' '}
                        <span className="text-[10px] text-text-tertiary font-normal">
                          / {u.total_habits} Total
                        </span>
                      </div>
                    </td>

                    {/* Streaks */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{u.current_streak}d</span>
                        <span className="text-[10px] text-text-tertiary font-normal">
                          (Best: {u.longest_streak}d)
                        </span>
                      </div>
                    </td>

                    {/* Completions */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-text-primary">
                        {u.total_completions}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3.5 text-text-secondary">
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleInspectUser(u.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-accent font-semibold transition-all hover:border-accent/40"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl p-6 rounded-3xl bg-surface-elevated border border-border shadow-elevated max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                {selectedUserDetail.user.avatar_url ? (
                  <img
                    src={selectedUserDetail.user.avatar_url}
                    alt={selectedUserDetail.user.username}
                    className="w-12 h-12 rounded-2xl object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center text-xl font-bold font-display shadow-subtle">
                    {selectedUserDetail.user.username[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-primary">
                      {selectedUserDetail.user.first_name || selectedUserDetail.user.username}
                    </h3>
                    {selectedUserDetail.user.is_superuser && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary flex items-center gap-2">
                    <span>@{selectedUserDetail.user.username}</span>
                    <span>•</span>
                    <span>{selectedUserDetail.user.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2 my-4">
              <div className="p-3 rounded-xl bg-surface border border-border text-center">
                <span className="text-[10px] text-text-secondary uppercase">Level & XP</span>
                <p className="font-bold text-sm text-accent mt-0.5">
                  Lvl {selectedUserDetail.user.level} ({selectedUserDetail.user.current_xp} XP)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border text-center">
                <span className="text-[10px] text-text-secondary uppercase">Streak</span>
                <p className="font-bold text-sm text-amber-500 mt-0.5">
                  🔥 {selectedUserDetail.user.current_streak}d
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border text-center">
                <span className="text-[10px] text-text-secondary uppercase">Completions</span>
                <p className="font-bold text-sm text-text-primary mt-0.5">
                  {selectedUserDetail.user.total_completions}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border text-center">
                <span className="text-[10px] text-text-secondary uppercase">Theme</span>
                <p className="font-bold text-sm text-text-primary capitalize mt-0.5">
                  {selectedUserDetail.user.settings?.theme || 'clarity'}
                </p>
              </div>
            </div>

            {/* Habits List */}
            <div className="space-y-3 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-accent" /> Active & Archived Habits ({selectedUserDetail.habits.length})
              </h4>
              {selectedUserDetail.habits.length === 0 ? (
                <p className="text-xs text-text-secondary italic">This user hasn't created any habits yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedUserDetail.habits.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl bg-surface border border-border flex items-start justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl p-1.5 rounded-lg bg-surface-elevated">{h.icon}</span>
                        <div>
                          <p className="font-semibold text-xs text-text-primary">{h.name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-0.5">
                            <span>{h.category}</span>
                            {h.target_days && (
                              <span className="text-emerald-500 font-semibold">• {h.target_days}d Goal</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-500">
                        🔥 {h.current_streak}d
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {selectedUserDetail.recent_activity.length > 0 && (
              <div className="space-y-2 mt-5 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent" /> Recent Activity Logs
                </h4>
                <div className="divide-y divide-border/60 max-h-40 overflow-y-auto rounded-xl bg-surface border border-border">
                  {selectedUserDetail.recent_activity.map((act) => (
                    <div key={act.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/15 text-success">
                          {act.status}
                        </span>
                        <span className="text-text-secondary font-medium">{act.date}</span>
                        {act.note && <span className="text-text-tertiary italic">"{act.note}"</span>}
                      </div>
                      {act.duration_minutes ? (
                        <span className="text-[11px] text-accent font-semibold">{act.duration_minutes}m</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 mt-5 border-t border-border">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
