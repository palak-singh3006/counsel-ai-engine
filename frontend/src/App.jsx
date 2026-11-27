import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import AppLayout from './layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Matters from './pages/Matters';
import Hearings from './pages/Hearings';
import Documents from './pages/Documents';
import Financials from './pages/Financials';
import AIIntelligence from './pages/AIIntelligence';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </ToastProvider>
  );
}
