import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import CommandPalette from './components/common/CommandPalette';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SettingsPage from './pages/SettingsPage';
import DemoPage from './pages/DemoPage';

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
            }}
          />
          {/* Global Command Palette — Ctrl+K / Cmd+K */}
          <CommandPalette />
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/demo"     element={<DemoPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppLayout><ProjectsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <AppLayout><ProjectDetailPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout><SettingsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
