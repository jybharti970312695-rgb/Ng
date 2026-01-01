import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { IProduct, ICustomer } from '../types';
import { createSearchEngine, searchItems } from '../services/searchService';
import { ShoppingCart, Search, Plus, CreditCard, Save } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

const BillingDashboard: React.FC = () => {
  const { os } = useThemeStore();
  const [productQuery, setProductQuery] = useState('');
  const [cart, setCart] = useState<{product: IProduct, qty: number}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);

  const allProducts = useLiveQuery(() => db.products.toArray());
  const [displayProducts, setDisplayProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    if (!allProducts) return;
    if (!productQuery) {
      setDisplayProducts(allProducts.slice(0, 50)); // Limit initial view
    } else {
      const fuse = createSearchEngine(allProducts, ['name', 'batch'], 'fast');
      setDisplayProducts(searchItems(fuse, productQuery, 'fast').slice(0, 20));
    }
  }, [allProducts, productQuery]);

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

  // Determine styles based on OS
  const cardClass = os === 'windows' 
    ? 'bg-white/70 backdrop-blur-md rounded-lg border border-gray-200' 
    : 'bg-white rounded-[20px] shadow-md border-0';
    
  const buttonClass = os === 'windows'
    ? 'rounded-md'
    : 'rounded-full';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left Panel: Product Selection */}
      <div className={`lg:col-span-2 flex flex-col ${cardClass} p-4 dark:bg-gray-800 dark:border-gray-700 h-full`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Products (Batch, Name)..."
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 dark:text-gray-300">
              <tr>
                <th className="p-3 rounded-tl-lg">Product</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Rate</th>
                <th className="p-3 rounded-tr-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{product.name}</td>
                  <td className="p-3 text-sm text-gray-500 dark:text-gray-400">{product.batch}</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${product.stock < 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-200">₹{product.rate}</td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => addToCart(product)}
                      className={`bg-primary hover:bg-primary/90 text-white px-3 py-1.5 text-sm transition-all shadow-sm ${buttonClass}`}
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

      {/* Right Panel: Invoice/Cart */}
      <div className={`flex flex-col ${cardClass} p-4 dark:bg-gray-800 dark:border-gray-700 h-full`}>
        <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-white">
            <ShoppingCart className="w-5 h-5 text-primary" /> Current Invoice
          </h2>
          
          <div className="bg-blue-50 dark:bg-gray-700/50 p-3 rounded-lg border border-blue-100 dark:border-gray-600">
             <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Customer</div>
             <div className="font-semibold text-gray-800 dark:text-white">
               {selectedCustomer ? selectedCustomer.name : 'Counter Sale (Cash)'}
             </div>
             {selectedCustomer && (
               <div className="text-xs text-gray-500 mt-1">GST: {selectedCustomer.gstin}</div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800 dark:text-white">{item.product.name}</div>
                  <div className="text-xs text-gray-500">{item.product.batch}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm">x{item.qty}</div>
                  <div className="font-bold text-gray-800 dark:text-white">₹{item.product.rate * item.qty}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
            <span className="text-3xl font-bold text-primary">₹{calculateTotal().toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <button className={`flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${buttonClass}`}>
                <Save className="w-4 h-4" /> Draft
             </button>
             <button className={`flex items-center justify-center gap-2 bg-primary text-white py-3 font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-95 transition-all ${buttonClass}`}>
                <CreditCard className="w-4 h-4" /> Checkout
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;