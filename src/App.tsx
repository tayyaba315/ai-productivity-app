import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import { ThemeProvider } from './app/context/ThemeContext';
import Layout from './app/components/Layout';

// Public Pages
import LandingPage from './app/pages/LandingPage';
import LoginPage from './app/pages/LoginPage';
import SignUpPage from './app/pages/SignUpPage';

// Protected Pages
import DashboardPage from './app/pages/DashboardPage';
import JobFinderPage from './app/pages/JobFinderPage';
import AvailabilityManagerPage from './app/pages/AvailabilityManagerPage';
import CalendarPage from './app/pages/CalendarPage';
import DailyNewsPage from './app/pages/DailyNewsPage';
import SmartEmailPage from './app/pages/SmartEmailPage';
import ClassroomPendingWorkPage from './app/pages/ClassroomPendingWorkPage';
import SettingsPage from './app/pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/job-finder" element={<ProtectedRoute><JobFinderPage /></ProtectedRoute>} />
      <Route path="/availability" element={<ProtectedRoute><AvailabilityManagerPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><DailyNewsPage /></ProtectedRoute>} />
      <Route path="/email" element={<ProtectedRoute><SmartEmailPage /></ProtectedRoute>} />
      <Route path="/classroom" element={<ProtectedRoute><ClassroomPendingWorkPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}