import React, { useState } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { DiseaseDetection } from './pages/DiseaseDetection';
import { MyFarms } from './pages/MyFarms';
import { WeatherIntel } from './pages/WeatherIntel';
import { Alerts } from './pages/Alerts';
import { Advisory } from './pages/Advisory';
import { Marketplace } from './pages/Marketplace';
import { Settings } from './pages/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'my-farms': return <MyFarms />;
      case 'disease-detection': return <DiseaseDetection />;
      case 'weather-intel': return <WeatherIntel />;
      case 'alerts': return <Alerts />;
      case 'advisory': return <Advisory />;
      case 'marketplace': return <Marketplace />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
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
    </div>
  );
}

export default App;
