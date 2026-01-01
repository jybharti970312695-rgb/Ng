
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { IProduct, ICustomer, ICartItem, IDoctorDetails } from '../types';
import { createSearchEngine, searchItems } from '../services/searchService';
import { calculateNetRate } from '../utils/pricing';
import { printInvoice } from '../services/printerService';
import { ShoppingCart, Search, CreditCard, Save, Zap, Target, Printer, AlertTriangle, FileWarning, Gift } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

const BillingDashboard: React.FC = () => {
  const { os } = useThemeStore();
  const isWin = os === 'windows';
  
  // State
  const [productQuery, setProductQuery] = useState('');
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [searchMode, setSearchMode] = useState<'fast' | 'accurate'>('fast');
  
  // Compliance State
  const [showH1Modal, setShowH1Modal] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<IDoctorDetails>({ doctorName: '', patientName: '', rxNumber: '' });
  
  // Search Logic
  const allProducts = useLiveQuery(() => db.products.toArray());
  const [displayProducts, setDisplayProducts] = useState<IProduct[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts (F2, F10)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setCart([]);
        setSelectedCustomer(null);
        setDoctorDetails({ doctorName: '', patientName: '', rxNumber: '' });
        searchInputRef.current?.focus();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, doctorDetails]);

  // FEFO Sorting & Search
  useEffect(() => {
    if (!allProducts) return;
    let results = [];
    
    if (!productQuery) {
      results = allProducts.slice(0, 50);
    } else {
      const fuse = createSearchEngine(allProducts, ['name', 'batch'], searchMode);
      results = searchItems(fuse, productQuery, searchMode).slice(0, 20);
    }

    // FEFO Logic: Sort by Expiry Date Ascending
    results.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
    setDisplayProducts(results);
  }, [allProducts, productQuery, searchMode]);

  const addToCart = (product: IProduct) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(p => p.product.id === product.id);
      if (existingIndex > -1) {
        const newCart = [...prev];
        const item = newCart[existingIndex];
        const newQty = item.billedQty + 1;
        newCart[existingIndex] = {
          ...item,
          billedQty: newQty,
          netRate: calculateNetRate(product.rate, newQty, item.freeQty)
        };
        return newCart;
      }
      return [...prev, { product, billedQty: 1, freeQty: 0, netRate: calculateNetRate(product.rate, 1, 0) }];
    });
  };

  const updateQuantity = (index: number, field: 'billedQty' | 'freeQty', value: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newValue = Math.max(0, value);
      
      const newBilled = field === 'billedQty' ? newValue : item.billedQty;
      const newFree = field === 'freeQty' ? newValue : item.freeQty;

      // Logic: If billed is 0, remove? No, let user explicitly remove or handle 0.
      newCart[index] = {
        ...item,
        billedQty: newBilled,
        freeQty: newFree,
        netRate: calculateNetRate(item.product.rate, newBilled, newFree)
      };
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.rate * item.billedQty), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty");
    
    // Check Compliance
    const hasH1Drugs = cart.some(i => i.product.schedule === 'H1');
    if (hasH1Drugs && (!doctorDetails.doctorName || !doctorDetails.patientName)) {
      setShowH1Modal(true);
      return;
    }

    printInvoice(selectedCustomer, cart, calculateTotal());
  };

  // Styles
  const cardClass = isWin
    ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-sm rounded-md' 
    : 'bg-white dark:bg-gray-800 shadow-md rounded-2xl border-0';
  
  const thClass = isWin 
    ? 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
    : 'px-3 py-3 text-left text-xs font-bold text-primary bg-primary/5';

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden gap-4">
      
      {/* Top Bar - Shortcuts Info */}
      {isWin && (
        <div className="flex gap-4 text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-900 p-1 rounded border border-gray-200 dark:border-gray-700 mx-1">
          <span>[F2] New Bill</span>
          <span>[F10] Save & Print</span>
          <span>[Del] Remove Item</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden px-1">
        
        {/* Left: Product Selection (Inventory) */}
        <div className={`lg:col-span-7 flex flex-col ${cardClass} overflow-hidden`}>
           <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input
                 ref={searchInputRef}
                 type="text"
                 placeholder="Search Product / Batch (FEFO Auto-Sort)..."
                 value={productQuery}
                 onChange={(e) => setProductQuery(e.target.value)}
                 className={`w-full pl-9 pr-3 py-2 text-sm outline-none ${isWin ? 'rounded-sm border border-gray-300 focus:border-primary' : 'rounded-xl bg-gray-100'}`}
               />
             </div>
             <button
                onClick={() => setSearchMode(prev => prev === 'fast' ? 'accurate' : 'fast')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium flex items-center gap-1"
             >
                {searchMode === 'fast' ? <Zap className="w-3 h-3 text-amber-500" /> : <Target className="w-3 h-3 text-blue-500" />}
                {searchMode === 'fast' ? 'Fast' : 'Exact'}
             </button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
             <table className="w-full text-sm">
               <thead className="sticky top-0 z-10">
                 <tr>
                   <th className={thClass}>Product</th>
                   <th className={thClass}>Batch / Exp</th>
                   <th className={thClass}>Stock</th>
                   <th className={thClass}>PTR</th>
                   <th className={thClass}>Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                 {displayProducts.map(p => {
                    const isExpiring = new Date(p.expiry) < new Date(new Date().setMonth(new Date().getMonth() + 3));
                    const isH1 = p.schedule === 'H1';
                    
                    return (
                      <tr key={p.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 group">
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                             {p.name}
                             {isH1 && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded border border-red-200">H1</span>}
                          </div>
                          <div className="text-[10px] text-gray-500">{p.manufacturer}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-gray-600 dark:text-gray-400">{p.batch}</div>
                          <div className={`text-[10px] ${isExpiring ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                             Exp: {p.expiry}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono">{p.stock}</td>
                        <td className="px-3 py-2">₹{p.rate}</td>
                        <td className="px-3 py-2 text-right">
                          <button 
                            onClick={() => addToCart(p)}
                            className={`px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90 transition-opacity ${isWin ? 'opacity-0 group-hover:opacity-100' : ''}`}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    );
                 })}
               </tbody>
             </table>
           </div>
        </div>

        {/* Right: Invoice (Billing) */}
        <div className={`lg:col-span-5 flex flex-col ${cardClass} overflow-hidden`}>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm">Sale Invoice</span>
             </div>
             <div className="text-right">
                <div className="text-xs text-gray-500">Invoice Date</div>
                <div className="font-mono text-sm font-bold">{new Date().toLocaleDateString()}</div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {cart.map((item, idx) => (
              <div key={idx} className={`p-2 rounded border ${isWin ? 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600' : 'border-transparent bg-gray-50 shadow-sm'} flex flex-col gap-2`}>
                <div className="flex justify-between items-start">
                   <div>
                      <div className="font-semibold text-sm flex items-center gap-1">
                        {item.product.name}
                        {item.product.schedule === 'H1' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      </div>
                      <div className="text-xs text-gray-500">Batch: {item.product.batch} | PTR: ₹{item.product.rate}</div>
                   </div>
                   <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600"><TrashIcon /></button>
                </div>
                
                {/* Scheme & Qty Inputs */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded">
                   <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Bill Qty</label>
                      <input 
                        type="number" 
                        value={item.billedQty}
                        onChange={(e) => updateQuantity(idx, 'billedQty', parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 text-sm h-7"
                      />
                   </div>
                   <div className="flex-1 relative">
                      <label className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Gift className="w-3 h-3" /> Free</label>
                      <input 
                        type="number" 
                        value={item.freeQty}
                        onChange={(e) => updateQuantity(idx, 'freeQty', parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 text-sm h-7 text-green-600"
                      />
                   </div>
                   <div className="flex-1 text-right">
                      <div className="text-[10px] text-gray-500 uppercase">Amount</div>
                      <div className="font-bold text-sm">₹{(item.product.rate * item.billedQty).toFixed(2)}</div>
                   </div>
                </div>
                <div className="text-[10px] text-gray-400 text-right">
                   Net Rate: ₹{item.netRate} / unit
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Press F2 for New Bill</p>
              </div>
            )}
          </div>

          {/* Footer Totals */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-end mb-3">
               <div>
                  <div className="text-xs text-gray-500">Taxable Amount</div>
                  <div className="font-semibold">₹{calculateTotal().toFixed(2)}</div>
               </div>
               <div className="text-right">
                  <div className="text-xs text-gray-500">Net Payable</div>
                  <div className="text-2xl font-bold text-primary">₹{(calculateTotal() * 1.12).toFixed(2)}</div>
                  <div className="text-[10px] text-gray-400">Inc. GST (Est. 12%)</div>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 rounded text-gray-700 text-sm hover:bg-gray-50">
                  <Save className="w-4 h-4" /> Draft
                </button>
                <button 
                  onClick={handleCheckout}
                  className="flex items-center justify-center gap-2 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 font-medium shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Checkout (F10)
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Schedule H1 Compliance Modal */}
      {showH1Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl border-l-4 border-red-500 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 flex items-start gap-3">
               <FileWarning className="w-6 h-6 text-red-600" />
               <div>
                 <h3 className="font-bold text-red-700 dark:text-red-400">Schedule H1 Compliance</h3>
                 <p className="text-xs text-red-600/80">Schedule H1 drugs detected. Doctor & Patient details are mandatory by law.</p>
               </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Prescribing Doctor</label>
                <input 
                  type="text" 
                  value={doctorDetails.doctorName}
                  onChange={e => setDoctorDetails({...doctorDetails, doctorName: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500/20 outline-none"
                  placeholder="Dr. Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Patient Name</label>
                  <input 
                    type="text" 
                    value={doctorDetails.patientName}
                    onChange={e => setDoctorDetails({...doctorDetails, patientName: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500/20 outline-none"
                    placeholder="Patient Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Rx Number</label>
                  <input 
                    type="text" 
                    value={doctorDetails.rxNumber}
                    onChange={e => setDoctorDetails({...doctorDetails, rxNumber: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500/20 outline-none"
                    placeholder="Rx12345"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
               <button 
                 onClick={() => setShowH1Modal(false)}
                 className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded"
               >
                 Cancel
               </button>
               <button 
                 disabled={!doctorDetails.doctorName || !doctorDetails.patientName}
                 onClick={() => {
                    setShowH1Modal(false);
                    handleCheckout(); // Retry checkout
                 }}
                 className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium shadow-sm"
               >
                 Confirm & Print
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

export default BillingDashboard;
