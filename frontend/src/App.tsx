import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ThemeSwitcherModal } from './components/layout/ThemeSwitcherModal';
import { HabitFormModal } from './components/habits/HabitFormModal';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { HabitsPage } from './pages/HabitsPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { Loader2 } from 'lucide-react';
import { apiRequest } from './lib/api';

const ProtectedLayout: React.FC<{ children: (props: any) => React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [selectedWeekSpan, setSelectedWeekSpan] = useState(5);
  const [userStats, setUserStats] = useState({ level: 1, xp: 0 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleCreateHabitQuick = async (habitData: any) => {
    await apiRequest('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-row selection:bg-accent selection:text-white">
      {/* Sidebar */}
      <Sidebar onOpenThemeModal={() => setIsThemeModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenAddHabit={() => setIsAddHabitOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          selectedWeekSpan={selectedWeekSpan}
          onChangeWeekSpan={setSelectedWeekSpan}
          level={userStats.level}
          xp={userStats.xp}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children({
            selectedWeekSpan,
            isAddHabitOpen,
            onCloseAddHabit: () => setIsAddHabitOpen(false),
            onUpdateStats: (lvl: number, xp: number) => setUserStats({ level: lvl, xp }),
          })}
        </main>
      </div>

      {/* Theme Switcher Modal */}
      <ThemeSwitcherModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Global Add Habit Modal */}
      <HabitFormModal
        isOpen={isAddHabitOpen}
        onClose={() => setIsAddHabitOpen(false)}
        onSubmit={handleCreateHabitQuick}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Dashboard & Pages */}
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  {(props) => <DashboardPage {...props} />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/habits"
              element={
                <ProtectedLayout>
                  {() => <HabitsPage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedLayout>
                  {() => <CalendarPage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedLayout>
                  {() => <AnalyticsPage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedLayout>
                  {() => <AchievementsPage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/challenges"
              element={
                <ProtectedLayout>
                  {() => <ChallengesPage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedLayout>
                  {() => <FriendsPage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedLayout>
                  {() => <ProfilePage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  {() => <SettingsPage />}
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedLayout>
                  {() => <AdminPage />}
                </ProtectedLayout>
              }
            />

            {/* Catchall */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
