import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { IProduct, ICustomer } from '../types';
import { createSearchEngine, searchItems } from '../services/searchService';
import { ShoppingCart, Search, CreditCard, Save, Zap, Target } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

const BillingDashboard: React.FC = () => {
  const { os } = useThemeStore();
  const [productQuery, setProductQuery] = useState('');
  const [cart, setCart] = useState<{product: IProduct, qty: number}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [searchMode, setSearchMode] = useState<'fast' | 'accurate'>('fast');

  const allProducts = useLiveQuery(() => db.products.toArray());
  const [displayProducts, setDisplayProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    if (!allProducts) return;
    if (!productQuery) {
      setDisplayProducts(allProducts.slice(0, 50));
    } else {
      const fuse = createSearchEngine(allProducts, ['name', 'batch'], searchMode);
      setDisplayProducts(searchItems(fuse, productQuery, searchMode).slice(0, 20));
    }
  }, [allProducts, productQuery, searchMode]);

  const addToCart = (product: IProduct) => {
    setCart(prev => {
      const existing = prev.find(p => p.product.id === product.id);
      if (existing) {
        return prev.map(p => p.product.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.rate * item.qty), 0);
  };

  // OS Specific Styles
  const isWin = os === 'windows';
  
  const cardClass = isWin
    ? 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-sm rounded-lg' 
    : 'bg-white dark:bg-gray-800 shadow-md rounded-2xl border-0';
    
  const inputClass = isWin
    ? 'rounded-md bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50'
    : 'rounded-full bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 transition-all';

  const buttonPrimary = isWin
    ? 'rounded-md bg-primary hover:bg-primary/90 text-white shadow-sm'
    : 'rounded-xl bg-primary active:scale-95 text-white shadow-md shadow-primary/30 ripple';

  const tableHeaderClass = isWin
    ? 'bg-gray-50/50 dark:bg-gray-700/50 text-xs font-semibold uppercase tracking-wider'
    : 'bg-primary/5 dark:bg-primary/10 text-sm font-bold text-primary';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left Panel: Inventory */}
      <div className={`lg:col-span-2 flex flex-col ${cardClass} p-4 h-full overflow-hidden`}>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isWin ? 'text-gray-400' : 'text-primary'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Search Inventory (Batch, Name)..."
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border outline-none ${inputClass}`}
            />
          </div>
          
          {/* Search Mode Toggle */}
          <div className={`flex p-1 ${isWin ? 'bg-gray-100 dark:bg-gray-700 rounded-md' : 'bg-gray-100 dark:bg-gray-700 rounded-xl'}`}>
            <button
              onClick={() => setSearchMode('fast')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                searchMode === 'fast'
                  ? `bg-white dark:bg-gray-600 shadow-sm ${isWin ? 'rounded-sm text-primary' : 'rounded-lg text-primary'}`
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Zap className="w-4 h-4" /> Fast
            </button>
            <button
              onClick={() => setSearchMode('accurate')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                searchMode === 'accurate'
                  ? `bg-white dark:bg-gray-600 shadow-sm ${isWin ? 'rounded-sm text-primary' : 'rounded-lg text-primary'}`
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Target className="w-4 h-4" /> Accurate
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 backdrop-blur-md z-10 ${tableHeaderClass}`}>
              <tr className="text-gray-500 dark:text-gray-300">
                <th className="p-3 rounded-tl-lg">Product</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Rate</th>
                <th className="p-3 rounded-tr-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{product.name}</td>
                  <td className="p-3 text-sm text-gray-500 dark:text-gray-400">{product.batch}</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock < 50 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-200">₹{product.rate}</td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => addToCart(product)}
                      className={`px-4 py-1.5 text-sm transition-all ${buttonPrimary} ${!isWin ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : ''}`}
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel: Invoice */}
      <div className={`flex flex-col ${cardClass} p-4 h-full`}>
        <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-white">
            <ShoppingCart className="w-6 h-6 text-primary" /> 
            <span>Current Invoice</span>
          </h2>
          
          <div className={`${isWin ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800' : 'bg-blue-50 dark:bg-gray-700'} p-4 rounded-lg border`}>
             <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 font-semibold">Billed To</div>
             <div className="font-semibold text-lg text-gray-800 dark:text-white">
               {selectedCustomer ? selectedCustomer.name : 'Counter Sale (Cash)'}
             </div>
             {selectedCustomer && (
               <div className="text-xs text-gray-500 mt-1 font-mono">GST: {selectedCustomer.gstin}</div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className={`flex justify-between items-center p-3 ${isWin ? 'bg-gray-50/50 hover:bg-white' : 'bg-gray-50 hover:bg-gray-100'} dark:bg-gray-700/50 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600`}>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800 dark:text-white">{item.product.name}</div>
                  <div className="text-xs text-gray-500">{item.product.batch}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">x{item.qty}</div>
                  <div className="font-bold text-gray-800 dark:text-white w-16 text-right">₹{item.product.rate * item.qty}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Total Amount</span>
            <span className="text-4xl font-bold text-primary tracking-tight">₹{calculateTotal().toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <button className={`flex items-center justify-center gap-2 py-3 font-medium transition-colors ${isWin ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 rounded-md' : 'bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600'} dark:text-gray-200`}>
                <Save className="w-4 h-4" /> Draft
             </button>
             <button className={`flex items-center justify-center gap-2 py-3 font-bold transition-all ${buttonPrimary}`}>
                <CreditCard className="w-4 h-4" /> Checkout
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;