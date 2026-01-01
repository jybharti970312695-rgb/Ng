
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useThemeStore } from './stores/themeStore';
import BillingDashboard from './components/BillingDashboard';
import CustomerManager from './components/CustomerManager';
import { seedDatabase } from './services/db';
import { LayoutDashboard, Users, Moon, Sun, Monitor, Tablet, Wifi, WifiOff, Menu } from 'lucide-react';

const GlobalStyles = () => {
  const { os } = useThemeStore();
  
  return (
    <style>{`
      :root {
        /* CSS Variables for OS Switching */
        --color-primary: ${os === 'android' ? '#2196F3' : '#0078D4'};
        --color-surface: ${os === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)'};
        --color-background: ${os === 'android' ? '#F2F4F8' : '#F0F2F5'};
        --radius: ${os === 'android' ? '16px' : '4px'};
        --font-family: ${os === 'android' ? '"Roboto", sans-serif' : '"Segoe UI", "Inter", sans-serif'};
        --safe-area-bottom: env(safe-area-inset-bottom, 20px);
      }
      
      .dark {
        --color-surface: ${os === 'android' ? '#1E1E1E' : 'rgba(32, 32, 32, 0.9)'};
        --color-background: ${os === 'android' ? '#121212' : '#1A1A1A'};
      }

      body {
        font-family: var(--font-family);
        overscroll-behavior: none;
      }
      
      /* Mobile tap highlights */
      * {
        -webkit-tap-highlight-color: transparent;
      }

      /* Scrollbar Styling */
      .custom-scrollbar::-webkit-scrollbar {
        width: ${os === 'android' ? '0px' : '8px'};
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${os === 'android' ? '#ddd' : '#ccc'};
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #999;
      }
    `}</style>
  );
};

// Desktop Sidebar Link
const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2 text-sm transition-all rounded-md mx-2 mb-1 ${
        isActive 
          ? 'bg-primary text-white shadow-sm font-semibold' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
      <span>{label}</span>
    </Link>
  );
};

// Android Bottom Tab
const BottomTab = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-transform">
      <div className={`p-1.5 rounded-full mb-1 ${isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-primary' : 'text-gray-400'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>{label}</span>
    </Link>
  );
};

const SettingsPanel = () => {
  const { os, setOS, darkMode, toggleDarkMode } = useThemeStore();
  const isWin = os === 'windows';
  
  return (
    <div className={`p-4 ${isWin ? 'mx-2 mb-4 border-t border-gray-200 dark:border-gray-700' : 'bg-surface m-4 rounded-xl shadow-sm'}`}>
      <h3 className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-widest">System</h3>
      <div className="flex gap-4 items-center">
         <button 
           onClick={toggleDarkMode}
           className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-yellow-500 dark:text-yellow-400"
         >
           {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
         </button>
         
         <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button 
              onClick={() => setOS('android')} 
              className={`p-1.5 rounded ${os === 'android' ? 'bg-white shadow text-primary' : 'text-gray-400'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setOS('windows')} 
              className={`p-1.5 rounded ${os === 'windows' ? 'bg-white shadow text-primary' : 'text-gray-400'}`}
            >
              <Monitor className="w-4 h-4" />
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

  const isWin = os === 'windows';

  return (
    <Router>
      <GlobalStyles />
      <div className={`flex h-screen bg-background text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300 ${isWin ? '' : 'flex-col'}`}>
        
        {/* Windows Wallpaper */}
        {isWin && <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black opacity-50 pointer-events-none" />}

        {/* WINDOWS SIDEBAR */}
        {isWin && (
          <aside className="w-60 flex flex-col bg-surface backdrop-blur-md border-r border-gray-200 dark:border-gray-800 z-20 shadow-lg">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                 <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-black">G</div>
                 Gopi<span className="font-light text-gray-800 dark:text-white">Pharma</span>
              </h1>
              <div className="text-[10px] text-gray-400 font-medium mt-1 pl-10">ERP Module v2.0</div>
            </div>
            
            <nav className="flex-1 py-4">
              <SidebarLink to="/" icon={LayoutDashboard} label="Billing Engine" />
              <SidebarLink to="/customers" icon={Users} label="Parties / Ledger" />
            </nav>

            <SettingsPanel />
            
            <div className={`px-4 py-1 text-[10px] flex justify-between items-center ${isOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
               <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
               <span>User: Admin</span>
            </div>
          </aside>
        )}

        {/* ANDROID HEADER */}
        {!isWin && (
          <header className="bg-primary text-white p-4 shadow-md z-20 flex justify-between items-center">
             <div>
               <h1 className="text-lg font-bold">Gopi Pharma</h1>
               <div className="text-xs opacity-80">Field Sales App</div>
             </div>
             <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOnline ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                {isOnline ? 'LIVE' : 'OFFLINE'}
             </div>
          </header>
        )}

        {/* MAIN CONTENT */}
        <main className={`flex-1 overflow-hidden relative z-10 ${isWin ? 'p-2' : 'pb-20'}`}>
           <Routes>
             <Route path="/" element={<BillingDashboard />} />
             <Route path="/customers" element={<CustomerManager />} />
           </Routes>
        </main>

        {/* ANDROID BOTTOM NAV */}
        {!isWin && (
          <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 dark:border-gray-800 h-16 flex z-30 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <BottomTab to="/" icon={LayoutDashboard} label="Billing" />
            <BottomTab to="/customers" icon={Users} label="Parties" />
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
               <Menu className="w-6 h-6" />
               <span className="text-[10px]">Menu</span>
            </div>
          </nav>
        )}

      </div>
    </Router>
  );
};

export default App;
