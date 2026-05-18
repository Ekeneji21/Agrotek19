import { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { DiseaseDetection } from './pages/DiseaseDetection';
import { WeatherIntel } from './pages/WeatherIntel';
import { Alerts } from './pages/Alerts';
import { Advisory } from './pages/Advisory';
import { Consultations } from './pages/Consultations';
import { Marketplace } from './pages/Marketplace';
import { Settings } from './pages/Settings';
import { Finances } from './pages/Finances';
import { FarmPlanner } from './pages/FarmPlanner';
import { Loader2 } from 'lucide-react';
import { AgroChat } from './components/AgroChat';

function AppShell() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (loading) {
    return (
      <div className="auth-loading">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-muted mt-3 text-sm">Loading AgriSense…</p>
      </div>
    );
  }

  if (!user) {
    return authScreen === 'login'
      ? <Login onSwitch={() => setAuthScreen('register')} />
      : <Register onSwitch={() => setAuthScreen('login')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':        return <Dashboard />;
      case 'disease-detection': return <DiseaseDetection />;
      case 'weather-intel':    return <WeatherIntel />;
      case 'alerts':           return <Alerts />;
      case 'advisory':         return <Advisory />;
      case 'consultations':    return <Consultations />;
      case 'marketplace':      return <Marketplace />;
      case 'finances':         return <Finances />;
      case 'planner':          return <FarmPlanner />;
      case 'settings':         return <Settings />;
      default:                 return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="main-content">
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
      <AgroChat />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
