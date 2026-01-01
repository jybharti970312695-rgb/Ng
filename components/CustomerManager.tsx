import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { CustomerType, ICustomer } from '../types';
import { parseCustomerFile } from '../services/excelService';
import { Upload, Search, User, Briefcase, Plus, Trash2, Smartphone, MapPin } from 'lucide-react';
import { createSearchEngine, searchItems } from '../services/searchService';

const CustomerManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CustomerType>('retail');
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [searchMode, setSearchMode] = useState<'fast' | 'accurate'>('fast');

  // Fetch all customers of active type
  const allCustomers = useLiveQuery(
    () => db.customers.where('type').equals(activeTab).toArray(),
    [activeTab]
  );

  const [displayCustomers, setDisplayCustomers] = useState<ICustomer[]>([]);

  // Search Effect
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
        await db.customers.bulkAdd(newCustomers);
        alert(`Successfully imported ${newCustomers.length} contacts.`);
      } catch (error) {
        console.error(error);
        alert("Failed to import Excel file. Ensure columns match: Name, GSTIN, Mobile.");
      } finally {
        setImporting(false);
      }
    }
  };

  const handleDelete = async (id?: number) => {
    if (id && confirm('Are you sure you want to delete this contact?')) {
      await db.customers.delete(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/50 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Contacts
        </h2>
        
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded cursor-pointer hover:opacity-90 transition-opacity shadow-md">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">{importing ? 'Importing...' : 'Import Excel'}</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={importing} />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('wholesale')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            activeTab === 'wholesale' 
              ? 'bg-white dark:bg-gray-700 shadow text-primary font-semibold' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Wholesale
        </button>
        <button
          onClick={() => setActiveTab('retail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            activeTab === 'retail' 
              ? 'bg-white dark:bg-gray-700 shadow text-primary font-semibold' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <User className="w-4 h-4" /> Retail
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select 
          className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value as 'fast' | 'accurate')}
        >
          <option value="fast">Fast (Fuzzy)</option>
          <option value="accurate">Accurate (Strict)</option>
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {displayCustomers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No contacts found. Try importing from Excel.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayCustomers.map((customer) => (
              <div 
                key={customer.id} 
                className="group relative p-4 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{customer.name}</h3>
                    {customer.gstin && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                        {customer.gstin}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Smartphone className="w-3.5 h-3.5" />
                    {customer.mobile}
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{customer.address}</span>
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