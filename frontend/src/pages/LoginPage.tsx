import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Flame, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('demo@habitquest.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email_or_username: emailOrUsername.trim(),
          password,
        }),
      });

      login(res.access_token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmailOrUsername('demo@habitquest.app');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-surface border border-border shadow-elevated space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center mx-auto shadow-subtle">
            <Flame className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Welcome to HabitQuest
          </h1>
          <p className="text-xs text-text-secondary">
            Sign in to access your analytics dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
              Email or Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover shadow-card transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Sign In</span>
          </button>
        </form>

        {/* Demo Quick Fill Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 text-accent text-xs font-semibold hover:bg-accent/10 transition-colors"
          >
            ✨ Quick Fill Demo Credentials (demo@habitquest.app)
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-accent hover:underline">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
