import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Trophy,
  Swords,
  Users,
  User,
  Settings,
  Palette,
  LogOut,
  Flame,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onOpenThemeModal: () => void;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/habits', label: 'My Habits', icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/achievements', label: 'Achievements', icon: Trophy },
  { path: '/challenges', label: 'Challenges', icon: Swords },
  { path: '/friends', label: 'Friends', icon: Users },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<Props> = ({ onOpenThemeModal }) => {
  const { user, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-surface shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent text-white shadow-subtle group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-text-primary tracking-tight">
              HabitQuest
            </span>
            <span className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Analytics & Habits
            </span>
          </div>
        </NavLink>

        {/* Quick theme cycle button */}
        <button
          onClick={cycleTheme}
          title={`Active Theme: ${theme.toUpperCase()} (Click to Cycle)`}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border transition-all"
        >
          <Palette className="w-4 h-4 text-accent" />
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-surface-elevated text-accent font-semibold border border-border shadow-subtle'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Admin Portal */}
        {(user?.is_superuser || user?.username === 'shafin') && (
          <div className="pt-2 mt-2 border-t border-border/60">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-500 font-semibold border border-rose-500/30 shadow-subtle'
                    : 'text-rose-500 hover:bg-rose-500/10'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Admin Portal</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded">
                Admin
              </span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Bottom User Level & Action Panel */}
      <div className="p-4 border-t border-border bg-surface-elevated/40 space-y-3">
        {/* Level Card */}
        <div className="p-3 rounded-xl bg-surface-elevated border border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-accent" /> Level Tracker
            </span>
            <span className="text-xs font-bold text-accent">Active</span>
          </div>
          <p className="text-[12px] text-text-secondary truncate">
            {user?.first_name || user?.username || 'Track consistency'}
          </p>
        </div>

        {/* Theme Picker Trigger & Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenThemeModal}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border bg-surface-elevated text-xs font-medium text-text-primary hover:bg-surface transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-accent" />
            <span className="capitalize">{theme} Theme</span>
          </button>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl border border-border bg-surface-elevated text-text-secondary hover:text-danger hover:bg-surface transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
