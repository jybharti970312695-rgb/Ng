import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useThemeStore } from './stores/themeStore';
import BillingDashboard from './components/BillingDashboard';
import CustomerManager from './components/CustomerManager';
import { seedDatabase } from './services/db';
import { LayoutDashboard, Users, Moon, Sun, Monitor, Tablet } from 'lucide-react';

const GlobalStyles = () => {
  const { os } = useThemeStore();
  
  return (
    <style>{`
      :root {
        --color-primary: ${os === 'android' ? '#2196F3' : '#0078D4'};
        --color-surface: ${os === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'};
        --color-background: ${os === 'android' ? '#F5F5F5' : '#F0F2F5'};
        --radius: ${os === 'android' ? '20px' : '8px'};
      }
      .dark {
        --color-surface: ${os === 'android' ? '#1E1E1E' : 'rgba(32, 32, 32, 0.8)'};
        --color-background: #121212;
      }
    `}</style>
  );
};

const NavBarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { os } = useThemeStore();
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 transition-all ${
        isActive 
          ? 'bg-primary/10 text-primary font-bold' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${os === 'android' ? 'rounded-full mx-2' : 'rounded-md mx-2 border-l-4 border-transparent ' + (isActive ? '!border-primary' : '')}`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
      <span>{label}</span>
    </Link>
  );
};

const SettingsPanel = () => {
  const { os, setOS, darkMode, toggleDarkMode } = useThemeStore();
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-4 mx-2">
      <h3 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-wider">Appearance</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Theme Engine</span>
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded p-1">
             <button 
                onClick={() => setOS('android')}
                className={`p-2 rounded ${os === 'android' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-400'}`}
             >
                <Tablet className="w-4 h-4" />
             </button>
             <button 
                onClick={() => setOS('windows')}
                className={`p-2 rounded ${os === 'windows' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-400'}`}
             >
                <Monitor className="w-4 h-4" />
             </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
          <button 
            onClick={toggleDarkMode}
            className="p-2 bg-gray-100 dark:bg-gray-900 rounded text-gray-600 dark:text-yellow-400"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const { detectOS, os } = useThemeStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    detectOS();
    seedDatabase();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <GlobalStyles />
      <div className="flex h-screen bg-background text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
        
        {/* Sidebar */}
        <aside className={`w-64 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-surface z-20 ${os === 'windows' ? 'backdrop-blur-xl bg-opacity-80' : ''}`}>
          <div className="p-6">
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">Gopi<span className="text-gray-800 dark:text-white">Pharma</span></h1>
            <div className="text-xs text-gray-400 font-medium">Wholesale Billing v2.0</div>
          </div>
          
          <nav className="flex-1 space-y-1">
            <NavBarLink to="/" icon={LayoutDashboard} label="Billing Dashboard" />
            <NavBarLink to="/customers" icon={Users} label="Customer Manager" />
          </nav>

          <SettingsPanel />
          
          {/* Status Bar */}
          <div className={`p-3 text-xs text-center font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
             {isOnline ? '● System Online' : '○ Offline Mode'}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
           {/* Windows Mica Effect Background Layer */}
           {os === 'windows' && (
             <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/0 dark:from-blue-900/10 pointer-events-none" />
           )}
           
           <div className="relative h-full p-6 overflow-y-auto">
             <Routes>
               <Route path="/" element={<BillingDashboard />} />
               <Route path="/customers" element={<CustomerManager />} />
             </Routes>
           </div>
        </main>

      </div>
    </Router>
  );
};

export default App;