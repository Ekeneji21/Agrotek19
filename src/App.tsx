import { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
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
import { Onboarding } from './components/Onboarding';

function AppShell() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profile, setProfile] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('agrisense_profile') || 'null'); } catch { return null; }
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && !profile) setShowOnboarding(true);
  }, [user, profile]);

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
      case 'dashboard':        return <Dashboard profile={profile} setActiveTab={setActiveTab} />;
      case 'disease-detection': return <DiseaseDetection setActiveTab={setActiveTab} />;
      case 'weather-intel':    return <WeatherIntel />;
      case 'alerts':           return <Alerts />;
      case 'advisory':         return <Advisory />;
      case 'consultations':    return <Consultations />;
      case 'marketplace':      return <Marketplace />;
      case 'finances':         return <Finances />;
      case 'planner':          return <FarmPlanner />;
      case 'settings':         return <Settings />;
      default:                 return <Dashboard profile={profile} setActiveTab={setActiveTab} />;
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
        <div className="dashboard-content page-enter">
          {renderContent()}
        </div>
      </main>
      <AgroChat />
      {showOnboarding && (
        <Onboarding onDone={(p) => { setProfile(p); setShowOnboarding(false); }} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
