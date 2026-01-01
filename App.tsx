import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useThemeStore } from './stores/themeStore';
import BillingDashboard from './components/BillingDashboard';
import CustomerManager from './components/CustomerManager';
import { seedDatabase } from './services/db';
import { LayoutDashboard, Users, Moon, Sun, Monitor, Tablet, Wifi, WifiOff } from 'lucide-react';

const GlobalStyles = () => {
  const { os } = useThemeStore();
  
  return (
    <style>{`
      :root {
        /* CSS Variables for OS Switching */
        --color-primary: ${os === 'android' ? '#2196F3' : '#0078D4'};
        --color-surface: ${os === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'};
        --color-background: ${os === 'android' ? '#F2F4F8' : '#F3F3F3'};
        --radius: ${os === 'android' ? '16px' : '6px'};
        --font-family: ${os === 'android' ? '"Roboto", sans-serif' : '"Inter", "Segoe UI", sans-serif'};
      }
      
      .dark {
        --color-surface: ${os === 'android' ? '#1E1E1E' : 'rgba(32, 32, 32, 0.85)'};
        --color-background: ${os === 'android' ? '#121212' : '#202020'};
      }

      body {
        font-family: var(--font-family);
      }

      /* Scrollbar Styling */
      .custom-scrollbar::-webkit-scrollbar {
        width: ${os === 'android' ? '4px' : '10px'};
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${os === 'android' ? '#ddd' : '#bbb'};
        border-radius: ${os === 'android' ? '10px' : '5px'};
        border: ${os === 'android' ? 'none' : '2px solid transparent'};
        background-clip: content-box;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: ${os === 'android' ? '#bbb' : '#999'};
      }
    `}</style>
  );
};

const NavBarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { os } = useThemeStore();
  const isWin = os === 'windows';
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 transition-all ${
        isActive 
          ? `text-primary font-bold ${isWin ? 'bg-white/80 shadow-sm' : 'bg-primary/10'}` 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
      } ${isWin ? 'rounded mx-2 mb-1 border-l-4 border-transparent ' + (isActive ? '!border-primary' : '') : 'rounded-xl mx-2 mb-2'}`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'fill-current opacity-20' : ''}`} />
      <span>{label}</span>
    </Link>
  );
};

const SettingsPanel = () => {
  const { os, setOS, darkMode, toggleDarkMode } = useThemeStore();
  const isWin = os === 'windows';
  
  return (
    <div className={`p-4 mx-2 mb-4 ${isWin ? 'bg-white/50 border border-gray-200 rounded' : 'bg-white rounded-2xl shadow-sm'} dark:bg-gray-800/50 dark:border-gray-700`}>
      <h3 className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-widest">System Settings</h3>
      <div className="space-y-4">
        
        {/* OS Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OS Mode</span>
          <div className={`flex p-1 ${isWin ? 'bg-gray-200/50 rounded' : 'bg-gray-100 rounded-lg'} dark:bg-gray-900`}>
             <button 
                onClick={() => setOS('android')}
                title="Android Mode"
                className={`p-1.5 transition-all ${os === 'android' ? 'bg-white shadow text-primary rounded-md' : 'text-gray-400 hover:text-gray-600'}`}
             >
                <Tablet className="w-4 h-4" />
             </button>
             <button 
                onClick={() => setOS('windows')}
                title="Windows Mode"
                className={`p-1.5 transition-all ${os === 'windows' ? 'bg-white shadow text-primary rounded-sm' : 'text-gray-400 hover:text-gray-600'}`}
             >
                <Monitor className="w-4 h-4" />
             </button>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
          <button 
            onClick={toggleDarkMode}
            className={`p-2 transition-colors ${isWin ? 'rounded hover:bg-gray-200 dark:hover:bg-gray-700' : 'rounded-full bg-gray-100 dark:bg-gray-900'} text-gray-600 dark:text-yellow-400`}
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
    // Only auto-detect if user hasn't set preference (could be persisted in localstorage in real app)
    // For now we run it once
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

  const isWin = os === 'windows';

  return (
    <Router>
      <GlobalStyles />
      <div className="flex h-screen bg-background text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
        
        {/* Background Wallpaper for Windows Mode */}
        {isWin && (
           <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-100 via-white to-gray-100 dark:from-slate-900 dark:via-gray-900 dark:to-black opacity-100 pointer-events-none" />
        )}
        
        {/* Sidebar */}
        <aside className={`w-64 flex flex-col border-r border-gray-200 dark:border-gray-800 z-20 transition-all ${isWin ? 'bg-white/80 backdrop-blur-md' : 'bg-surface shadow-xl'}`}>
          <div className="p-6">
            <h1 className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
               Gopi<span className="text-gray-800 dark:text-white font-light">Pharma</span>
            </h1>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-1">Distributor Billing v2.0</div>
          </div>
          
          <nav className="flex-1 space-y-2 py-4">
            <NavBarLink to="/" icon={LayoutDashboard} label="Billing Dashboard" />
            <NavBarLink to="/customers" icon={Users} label="Customer Manager" />
          </nav>

          <SettingsPanel />
          
          {/* Status Bar */}
          <div className={`px-4 py-2 text-xs font-medium flex items-center justify-between ${isOnline ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50'}`}>
             <span className="flex items-center gap-1.5">
               {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
               {isOnline ? 'Online' : 'Offline'}
             </span>
             <span className="opacity-50">v2.0.1</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative z-10">
           <div className="relative h-full p-4 md:p-6 overflow-y-auto">
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