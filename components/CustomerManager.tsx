import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { CustomerType, ICustomer } from '../types';
import { parseCustomerFile } from '../services/excelService';
import { Upload, Search, User, Briefcase, Trash2, Smartphone, MapPin, Loader2 } from 'lucide-react';
import { createSearchEngine, searchItems } from '../services/searchService';
import { useThemeStore } from '../stores/themeStore';

const CustomerManager: React.FC = () => {
  const { os } = useThemeStore();
  const [activeTab, setActiveTab] = useState<CustomerType>('retail');
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [searchMode, setSearchMode] = useState<'fast' | 'accurate'>('fast');

  const allCustomers = useLiveQuery(
    () => db.customers.where('type').equals(activeTab).toArray(),
    [activeTab]
  );

  const [displayCustomers, setDisplayCustomers] = useState<ICustomer[]>([]);

  useEffect(() => {
    if (!allCustomers) return;
    if (!searchQuery) {
      setDisplayCustomers(allCustomers);
      return;
    }
    const fuse = createSearchEngine(allCustomers, ['name', 'gstin', 'mobile'], searchMode);
    const results = searchItems(fuse, searchQuery, searchMode);
    setDisplayCustomers(results);
  }, [allCustomers, searchQuery, searchMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImporting(true);
      try {
        const newCustomers = await parseCustomerFile(e.target.files[0], activeTab);
        if (newCustomers.length > 0) {
          await db.customers.bulkAdd(newCustomers);
          // Small delay to allow DB to update before alert
          setTimeout(() => alert(`Successfully imported ${newCustomers.length} contacts.`), 100);
        } else {
          alert("No valid contacts found. Please check Excel headers.");
        }
      } catch (error) {
        console.error(error);
        alert("Import failed. Ensure file is valid Excel (.xlsx).");
      } finally {
        setImporting(false);
        e.target.value = ''; // Reset input
      }
    }
  };

  const handleDelete = async (id?: number) => {
    if (id && confirm('Delete this contact?')) {
      await db.customers.delete(id);
    }
  };

  const isWin = os === 'windows';

  const containerClass = isWin
    ? 'bg-white/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg'
    : 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0';

  const tabClass = (isActive: boolean) => {
    if (isWin) {
      return isActive 
        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary font-semibold border-b-2 border-primary rounded-t' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400';
    }
    return isActive
      ? 'bg-primary text-white shadow-lg shadow-primary/30 font-bold rounded-xl'
      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl';
  };

  return (
    <div className={`flex flex-col h-full ${containerClass} p-4 transition-all duration-300`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            <span>Contacts Manager</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Manage Wholesale & Retail Parties</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white cursor-pointer hover:bg-primary/90 transition-all ${isWin ? 'rounded-md shadow-sm' : 'rounded-xl shadow-lg shadow-primary/30 w-full md:w-auto'}`}>
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="text-sm font-medium">{importing ? 'Processing...' : 'Import Excel'}</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={importing} />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 mb-4 p-1 w-fit ${isWin ? 'bg-gray-100/50 dark:bg-gray-900/50 rounded-lg' : ''}`}>
        <button
          onClick={() => setActiveTab('wholesale')}
          className={`flex items-center gap-2 px-6 py-2.5 transition-all ${tabClass(activeTab === 'wholesale')}`}
        >
          <Briefcase className="w-4 h-4" /> Wholesale
        </button>
        <button
          onClick={() => setActiveTab('retail')}
          className={`flex items-center gap-2 px-6 py-2.5 transition-all ${tabClass(activeTab === 'retail')}`}
        >
          <User className="w-4 h-4" /> Retail
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isWin ? 'text-gray-400' : 'text-primary'}`} />
          <input
            type="text"
            placeholder="Search by Name, GST or Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 outline-none ${isWin ? 'rounded-md border border-gray-200 bg-white/50 focus:border-primary' : 'rounded-xl bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20'} dark:bg-gray-800 dark:border-gray-700`}
          />
        </div>
        <select 
          className={`px-4 py-2 outline-none ${isWin ? 'rounded-md border border-gray-200 bg-white dark:bg-gray-800' : 'rounded-xl bg-gray-100 border-transparent'} dark:border-gray-700 text-sm`}
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value as 'fast' | 'accurate')}
        >
          <option value="fast">Fast Search</option>
          <option value="accurate">Accurate Search</option>
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {displayCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <User className="w-12 h-12 mb-3 opacity-20" />
            <p>No contacts found. Try importing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCustomers.map((customer) => (
              <div 
                key={customer.id} 
                className={`group relative p-4 transition-all ${isWin ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded hover:shadow-md' : 'bg-white dark:bg-gray-700 rounded-2xl shadow-sm hover:shadow-lg'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white truncate pr-2">{customer.name}</h3>
                    {customer.gstin && (
                      <span className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded mt-1 inline-block">
                        {customer.gstin}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                    <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                    {customer.mobile}
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate max-w-[200px]">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManager;