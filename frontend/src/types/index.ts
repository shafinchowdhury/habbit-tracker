export type ThemeMode = 'midnight' | 'fresh' | 'clarity' | 'harvest';

export interface UserSettings {
  id: string;
  user_id: string;
  theme: ThemeMode;
  default_week_span: string;
  reduced_motion: boolean;
  daily_reminder_time: string;
  reminder_enabled: boolean;
  profile_visibility: string;
  habit_visibility_default: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  avatar_url?: string;
  timezone?: string;
  is_active: boolean;
  is_superuser?: boolean;
  settings?: UserSettings;
}

export interface DayBarData {
  day_letter: string;
  day_number: number;
  date: string;
  completion_rate: number;
  completed_count: number;
  total_count: number;
  is_today: boolean;
  is_future: boolean;
}

export interface WeeklyCard {
  week_index: number;
  week_label: string;
  start_date: string;
  end_date: string;
  accent_color: string;
  completion_percentage: number;
  target_threshold: number;
  average_threshold: number;
  days: DayBarData[];
  strongest_habit_label?: string;
  highlight_metric?: string;
}

export interface DomainScore {
  domain: string;
  score: number;
  habits_count: number;
}

export interface SummaryMetrics {
  overall_completion_percentage: number;
  consistency_score: number;
  current_streak_days: number;
  longest_streak_days: number;
  streak_freezes_available: number;
  domain_balance: DomainScore[];
  total_time_invested_hours: number;
  time_invested_formatted: string;
}

export interface CellData {
  status: 'completed' | 'partial' | 'skipped' | 'rest_day' | 'missed' | 'future';
  actual_value?: number;
  target_value?: number;
  unit?: string;
  duration_minutes?: number;
  note?: string;
}

export interface HabitGridRow {
  id: string;
  name: string;
  description?: string;
  default_duration_minutes?: number;
  icon: string;
  category: string;
  color: string;
  target_text: string;
  target_days?: number;
  start_date?: string;
  end_date?: string;
  completion_percentage: number;
  cells: Record<string, CellData>;
}

export interface DayColumnHeader {
  date: string;
  day_letter: string;
  day_number: number;
  week_index: number;
  is_today: boolean;
  is_future: boolean;
}

export interface DashboardResponse {
  user_name: string;
  user_avatar?: string;
  level: number;
  current_xp: number;
  target_xp: number;
  selected_week_span: number;
  start_date: string;
  end_date: string;
  column_headers: DayColumnHeader[];
  weekly_cards: WeeklyCard[];
  summary: SummaryMetrics;
  habit_rows: HabitGridRow[];
  daily_time_invested: Record<string, number>;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  default_duration_minutes?: number;
  icon: string;
  category: string;
  color: string;
  measurement_type: string;
  target_value: number;
  unit: string;
  frequency_type: string;
  frequency_data?: Record<string, any>;
  is_paused: boolean;
  pause_until?: string;
  is_archived: boolean;
  visibility: string;
  start_date?: string;
  end_date?: string;
  target_days?: number;
  order_index: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  target_value: number;
  is_unlocked: boolean;
  progress_value: number;
  unlocked_at?: string;
}

export interface FriendSummary {
  id: string;
  username: string;
  first_name?: string;
  avatar_url?: string;
  level: number;
  total_xp: number;
  current_streak: number;
}

export interface Friendship {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  friend: FriendSummary;
  is_incoming: boolean;
  created_at: string;
}

export interface FriendStreak {
  id: string;
  friend: FriendSummary;
  current_streak: number;
  longest_streak: number;
  user_completed_today: boolean;
  friend_completed_today: boolean;
  is_active_today: boolean;
}

export interface ChallengeParticipant {
  user: FriendSummary;
  completion_percentage: number;
  days_completed: number;
  is_completed: boolean;
}

export interface Challenge {
  id: string;
  creator_id: string;
  creator_name: string;
  title: string;
  description?: string;
  category: string;
  target_metric: string;
  duration_days: number;
  start_date: string;
  end_date?: string;
  max_participants: number;
  visibility: string;
  xp_reward: number;
  is_joined: boolean;
  user_completion_percentage: number;
  participants_count: number;
  leaderboard: ChallengeParticipant[];
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  user: FriendSummary;
  type: string;
  title: string;
  description?: string;
  created_at: string;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  avatar_url?: string;
  timezone?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  total_habits: number;
  active_habits: number;
  total_completions: number;
  level: number;
  current_xp: number;
  current_streak: number;
  longest_streak: number;
  settings?: {
    theme: ThemeMode;
    reminder_enabled: boolean;
    daily_reminder_time: string;
    profile_visibility: string;
  };
}

export interface AdminStats {
  total_users: number;
  total_active_habits: number;
  total_completions: number;
  total_xp: number;
  total_challenges: number;
  active_users_last_7d: number;
}

export interface AdminUserDetail {
  user: AdminUserSummary;
  habits: Habit[];
  recent_activity: {
    id: string;
    date: string;
    status: string;
    duration_minutes?: number;
    note?: string;
    habit_id: string;
  }[];
}
