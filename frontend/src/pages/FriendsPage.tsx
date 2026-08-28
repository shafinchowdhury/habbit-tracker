import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Friendship, FriendStreak, ActivityItem, FriendSummary } from '../types';
import {
  Users,
  Search,
  UserPlus,
  Flame,
  Check,
  X,
  Zap,
  Activity as ActivityIcon,
  Loader2,
} from 'lucide-react';

export const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendStreaks, setFriendStreaks] = useState<FriendStreak[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const fetchFriendsData = async () => {
    setIsLoading(true);
    try {
      const [fList, strks, acts] = await Promise.all([
        apiRequest<Friendship[]>('/friends'),
        apiRequest<FriendStreak[]>('/friends/streaks'),
        apiRequest<ActivityItem[]>('/friends/activity'),
      ]);
      setFriends(fList);
      setFriendStreaks(strks);
      setActivityFeed(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) return;

    setIsSearching(true);
    try {
      const res = await apiRequest<FriendSummary[]>(`/friends/search?q=${searchQuery.trim()}`);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (username: string) => {
    await apiRequest(`/friends/request/${username}`, { method: 'POST' });
    setSearchResults([]);
    setSearchQuery('');
    await fetchFriendsData();
  };

  const handleRespond = async (friendshipId: string, action: 'accept' | 'reject') => {
    await apiRequest(`/friends/respond/${friendshipId}?action=${action}`, { method: 'POST' });
    await fetchFriendsData();
  };

  const acceptedFriends = friends.filter((f) => f.status === 'ACCEPTED');
  const incomingRequests = friends.filter((f) => f.status === 'PENDING' && f.is_incoming);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Friends & Social
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Maintain mutual streaks and cheer on consistency.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || searchQuery.trim().length < 2}
            className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover shadow-subtle disabled:opacity-50"
          >
            Find
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface-elevated border border-border shadow-subtle space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary">
            Search Results
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-xs">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-text-primary block">
                      {user.first_name || user.username}
                    </span>
                    <span className="text-xs text-text-secondary">
                      @{user.username} • Level {user.level}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(user.username)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-accent">
            Pending Friend Requests ({incomingRequests.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-sm text-text-primary block">
                    {req.friend.first_name || req.friend.username}
                  </span>
                  <span className="text-xs text-text-secondary">
                    @{req.friend.username}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(req.id, 'accept')}
                    className="p-1.5 rounded-lg bg-success text-white hover:bg-success/90"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, 'reject')}
                    className="p-1.5 rounded-lg bg-surface border border-border text-danger hover:bg-danger/10"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Social Sections: Friend Streaks + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Friend Streaks & Circle */}
        <div className="lg:col-span-2 space-y-6">
          {/* Friend Streaks */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle">
            <h3 className="font-bold text-base text-text-primary mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" /> Friend Streaks
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Shared streaks maintained by mutual daily habit completion.
            </p>

            {friendStreaks.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                Add friends to start building shared streaks.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friendStreaks.map((strk) => (
                  <div
                    key={strk.id}
                    className="p-4 rounded-xl bg-surface-elevated border border-border flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-text-primary">
                        You + {strk.friend.first_name || strk.friend.username}
                      </span>
                      <span className="text-sm font-bold text-amber-500 flex items-center gap-1">
                        <Flame className="w-4 h-4 fill-amber-500" />
                        {strk.current_streak} Days
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                      <span className="flex items-center gap-1 text-text-secondary">
                        You:{' '}
                        <strong className={strk.user_completed_today ? 'text-success' : 'text-text-tertiary'}>
                          {strk.user_completed_today ? 'Done ✓' : 'Pending ○'}
                        </strong>
                      </span>
                      <span className="flex items-center gap-1 text-text-secondary">
                        {strk.friend.username}:{' '}
                        <strong className={strk.friend_completed_today ? 'text-success' : 'text-text-tertiary'}>
                          {strk.friend_completed_today ? 'Done ✓' : 'Pending ○'}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends Circle List */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle">
            <h3 className="font-bold text-base text-text-primary mb-3">
              Friends Circle ({acceptedFriends.length})
            </h3>
            <div className="divide-y divide-border">
              {acceptedFriends.map((f) => (
                <div
                  key={f.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold">
                      {f.friend.username[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-text-primary block">
                        {f.friend.first_name || f.friend.username}
                      </span>
                      <span className="text-text-secondary">
                        @{f.friend.username} • Level {f.friend.level}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-amber-500 flex items-center gap-1 justify-end">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      {f.friend.current_streak}d streak
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {f.friend.total_xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Social Activity Feed */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle flex flex-col">
          <h3 className="font-bold text-base text-text-primary mb-1 flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-accent" /> Activity Feed
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Recent milestones from your network.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {activityFeed.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-surface-elevated border border-border text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">
                    {act.title}
                  </span>
                </div>
                <span className="text-[10px] text-text-tertiary block">
                  {new Date(act.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
