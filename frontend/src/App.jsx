import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Matters from './pages/Matters';
import Hearings from './pages/Hearings';
import Documents from './pages/Documents';
import Financials from './pages/Financials';
import AIIntelligence from './pages/AIIntelligence';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.1rem',
        }}
      >
        Loading your chambers workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/matters" element={<Matters />} />
        <Route path="/hearings" element={<Hearings />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/ai-intelligence" element={<AIIntelligence />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
