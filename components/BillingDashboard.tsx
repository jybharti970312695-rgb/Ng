
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { IProduct, ICustomer, ICartItem, IDoctorDetails } from '../types';
import { createSearchEngine, searchItems } from '../services/searchService';
import { calculateNetRate } from '../utils/pricing';
import { printInvoice, connectPrinter } from '../services/printerService';
import { ShoppingCart, Search, CreditCard, Save, Zap, Target, Printer, AlertTriangle, FileWarning, Gift, Plus, Minus, X, ArrowRight, Package } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

const BillingDashboard: React.FC = () => {
  const { os } = useThemeStore();
  const isWin = os === 'windows';
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'inventory' | 'cart'>('inventory');

  // Core State
  const [productQuery, setProductQuery] = useState('');
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [searchMode, setSearchMode] = useState<'fast' | 'accurate'>('fast');
  
  // Compliance State
  const [showH1Modal, setShowH1Modal] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<IDoctorDetails>({ doctorName: '', patientName: '', rxNumber: '' });
  
  // Data
  const allProducts = useLiveQuery(() => db.products.toArray());
  const [displayProducts, setDisplayProducts] = useState<IProduct[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts (Desktop Only)
  useEffect(() => {
    if (!isWin) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        resetBill();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWin, cart, selectedCustomer, doctorDetails]);

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
    // FEFO: Sort by expiry
    results.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
    setDisplayProducts(results);
  }, [allProducts, productQuery, searchMode]);

  const resetBill = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDoctorDetails({ doctorName: '', patientName: '', rxNumber: '' });
    if (searchInputRef.current) searchInputRef.current.focus();
  };

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
    // On mobile, maybe show toast?
  };

  const updateQuantity = (index: number, field: 'billedQty' | 'freeQty', value: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newValue = Math.max(0, value);
      const newBilled = field === 'billedQty' ? newValue : item.billedQty;
      const newFree = field === 'freeQty' ? newValue : item.freeQty;
      
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
    
    // H1 Check
    const hasH1 = cart.some(i => i.product.schedule === 'H1');
    if (hasH1 && (!doctorDetails.doctorName || !doctorDetails.patientName)) {
      setShowH1Modal(true);
      return;
    }
    printInvoice(selectedCustomer, cart, calculateTotal());
  };

  // ---------------- UI COMPONENTS ---------------- //

  const H1ComplianceModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-red-600 text-white p-4 flex items-center gap-3">
           <FileWarning className="w-6 h-6" />
           <div>
             <h3 className="font-bold text-lg">Schedule H1 Warning</h3>
             <p className="text-xs opacity-90">Doctor & Patient details required by Law.</p>
           </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Prescribing Doctor</label>
            <input type="text" className="w-full p-2 border rounded mt-1 bg-gray-50 dark:bg-gray-900 dark:border-gray-700" placeholder="Dr. Name" value={doctorDetails.doctorName} onChange={e => setDoctorDetails({...doctorDetails, doctorName: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
              <input type="text" className="w-full p-2 border rounded mt-1 bg-gray-50 dark:bg-gray-900 dark:border-gray-700" placeholder="Patient Name" value={doctorDetails.patientName} onChange={e => setDoctorDetails({...doctorDetails, patientName: e.target.value})} />
            </div>
            <div className="w-1/3">
              <label className="text-xs font-bold text-gray-500 uppercase">Rx No</label>
              <input type="text" className="w-full p-2 border rounded mt-1 bg-gray-50 dark:bg-gray-900 dark:border-gray-700" placeholder="RX-123" value={doctorDetails.rxNumber} onChange={e => setDoctorDetails({...doctorDetails, rxNumber: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
           <button onClick={() => setShowH1Modal(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
           <button onClick={() => { setShowH1Modal(false); handleCheckout(); }} className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded shadow hover:bg-red-700">Confirm & Print</button>
        </div>
      </div>
    </div>
  );

  // --- DESKTOP VIEW ---
  if (isWin) {
    return (
      <div className="flex h-full gap-2">
        {/* Inventory Grid */}
        <div className="flex-1 flex flex-col bg-surface shadow-sm rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-800">
             <div className="relative flex-1">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 ref={searchInputRef}
                 className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-1 focus:ring-primary" 
                 placeholder="F2 to Search Product / Batch..." 
                 value={productQuery}
                 onChange={e => setProductQuery(e.target.value)}
               />
             </div>
             <button onClick={connectPrinter} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600" title="Connect Printer">
               <Printer className="w-4 h-4" />
             </button>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-gray-900">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                   <th className="p-2 border-b dark:border-gray-700">Product Name</th>
                   <th className="p-2 border-b dark:border-gray-700">Batch</th>
                   <th className="p-2 border-b dark:border-gray-700">Expiry</th>
                   <th className="p-2 border-b dark:border-gray-700 text-right">Stock</th>
                   <th className="p-2 border-b dark:border-gray-700 text-right">PTR</th>
                   <th className="p-2 border-b dark:border-gray-700 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map((p, i) => {
                  const isExpiring = new Date(p.expiry) < new Date(new Date().setMonth(new Date().getMonth() + 3));
                  return (
                    <tr key={i} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-800">
                      <td className="p-2 font-medium text-gray-700 dark:text-gray-200">
                        {p.name}
                        {p.schedule === 'H1' && <span className="ml-2 px-1 py-0.5 bg-red-100 text-red-600 text-[10px] rounded border border-red-200">H1</span>}
                      </td>
                      <td className="p-2 font-mono text-xs text-gray-500">{p.batch}</td>
                      <td className={`p-2 text-xs ${isExpiring ? 'text-red-600 font-bold' : 'text-green-600'}`}>{p.expiry}</td>
                      <td className="p-2 text-right font-mono">{p.stock}</td>
                      <td className="p-2 text-right font-medium">₹{p.rate}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => addToCart(p)} className="px-3 py-1 bg-primary text-white text-xs rounded hover:opacity-90">Add</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="p-1 bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 border-t dark:border-gray-700 flex justify-between px-2">
             <span>Items Loaded: {displayProducts.length}</span>
             <span>Sorted by FEFO (Expiry)</span>
          </div>
        </div>

        {/* Invoice Panel */}
        <div className="w-[40%] flex flex-col bg-surface shadow-sm rounded border border-gray-200 dark:border-gray-700">
           <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-gray-800 dark:text-white"><ShoppingCart className="w-5 h-5 text-primary"/> Current Bill</h2>
              <div className="text-xs text-right">
                <div className="text-gray-500">Invoice No</div>
                <div className="font-mono font-bold">INV-{Math.floor(Math.random()*1000)}</div>
              </div>
           </div>
           
           <div className="flex-1 overflow-auto p-2 space-y-2 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
              {cart.map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                   <div className="flex justify-between mb-2">
                     <span className="font-semibold text-sm">{item.product.name}</span>
                     <button onClick={() => removeFromCart(i)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                   </div>
                   <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="text-[9px] uppercase text-gray-400 font-bold">Qty</label>
                        <input type="number" className="w-full h-8 border rounded px-1 text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-600" value={item.billedQty} onChange={e => updateQuantity(i, 'billedQty', parseInt(e.target.value))} />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] uppercase text-green-500 font-bold">Free</label>
                        <input type="number" className="w-full h-8 border border-green-200 rounded px-1 text-sm text-green-700 bg-green-50 dark:bg-gray-900 dark:border-green-800 dark:text-green-400" value={item.freeQty} onChange={e => updateQuantity(i, 'freeQty', parseInt(e.target.value))} />
                      </div>
                      <div className="flex-1 text-right">
                        <label className="text-[9px] uppercase text-gray-400 font-bold">Total</label>
                        <div className="h-8 flex items-center justify-end font-bold text-gray-800 dark:text-gray-200">₹{(item.product.rate * item.billedQty).toFixed(2)}</div>
                      </div>
                   </div>
                   <div className="text-[10px] text-gray-400 mt-1">Net Rate: ₹{item.netRate}</div>
                </div>
              ))}
              {cart.length === 0 && <div className="text-center py-10 text-gray-400 italic">Press F2 to start billing</div>}
           </div>

           <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-end mb-4">
                 <span className="text-gray-500">Grand Total</span>
                 <span className="text-3xl font-bold text-primary">₹{calculateTotal().toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} className="w-full py-3 bg-primary text-white font-bold rounded shadow hover:bg-blue-600 flex items-center justify-center gap-2">
                <Printer className="w-5 h-5" /> Print Invoice (F10)
              </button>
           </div>
        </div>
        {showH1Modal && <H1ComplianceModal />}
      </div>
    );
  }

  // --- MOBILE VIEW (Android) ---
  return (
    <div className="flex flex-col h-full bg-background">
       {/* Mobile Top Bar */}
       <div className="bg-surface p-4 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
          <button 
             onClick={() => setMobileTab('inventory')}
             className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all whitespace-nowrap ${mobileTab === 'inventory' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
             Inventory
          </button>
          <button 
             onClick={() => setMobileTab('cart')}
             className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${mobileTab === 'cart' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
             Cart <span className="bg-white/20 px-1.5 rounded text-xs">{cart.length}</span>
          </button>
       </div>

       {/* INVENTORY TAB */}
       {mobileTab === 'inventory' && (
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input 
                 className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface shadow-sm text-base border-0 focus:ring-2 focus:ring-primary/20" 
                 placeholder="Search medicines..."
                 value={productQuery}
                 onChange={e => setProductQuery(e.target.value)}
               />
            </div>
            
            <div className="space-y-3 pb-20">
               {displayProducts.map(p => (
                 <div key={p.id} className="bg-surface p-4 rounded-2xl shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform">
                    <div>
                       <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          {p.name}
                          {p.schedule === 'H1' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-md font-bold">H1</span>}
                       </div>
                       <div className="text-xs text-gray-500 mt-1">Batch: {p.batch} | Exp: {p.expiry}</div>
                       <div className="text-xs font-mono text-gray-400 mt-0.5">Stock: {p.stock}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="font-bold text-primary">₹{p.rate}</div>
                       <button 
                         onClick={() => { addToCart(p); setMobileTab('cart'); }}
                         className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary hover:text-white transition-colors"
                       >
                         <Plus className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}

       {/* CART TAB */}
       {mobileTab === 'cart' && (
         <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
               {cart.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                    <Package className="w-16 h-16 mb-4" />
                    <p>Your cart is empty</p>
                 </div>
               ) : (
                 cart.map((item, i) => (
                   <div key={i} className="bg-surface p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <div className="font-bold text-gray-800 dark:text-gray-100">{item.product.name}</div>
                            <div className="text-xs text-gray-400">PTR: ₹{item.product.rate}</div>
                         </div>
                         <button onClick={() => removeFromCart(i)} className="p-1 text-gray-300 hover:text-red-500"><X className="w-5 h-5"/></button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-2 flex items-center justify-between">
                            <button onClick={() => updateQuantity(i, 'billedQty', item.billedQty - 1)} className="p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Minus className="w-4 h-4"/></button>
                            <span className="font-bold">{item.billedQty}</span>
                            <button onClick={() => updateQuantity(i, 'billedQty', item.billedQty + 1)} className="p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Plus className="w-4 h-4"/></button>
                         </div>
                         <div className="w-24 bg-green-50 dark:bg-green-900/20 rounded-xl p-2 flex flex-col items-center justify-center border border-green-100 dark:border-green-800">
                            <span className="text-[9px] uppercase text-green-600 font-bold mb-0.5">Free</span>
                            <input type="number" className="w-full bg-transparent text-center font-bold text-green-700 outline-none p-0" value={item.freeQty} onChange={e => updateQuantity(i, 'freeQty', parseInt(e.target.value))} />
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
            
            <div className="p-4 bg-surface border-t border-gray-200 dark:border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-[calc(80px+env(safe-area-inset-bottom))]">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500">Total Payable</span>
                  <span className="text-2xl font-bold text-primary">₹{calculateTotal().toFixed(2)}</span>
               </div>
               <button 
                 onClick={handleCheckout}
                 className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
               >
                 Checkout <ArrowRight className="w-5 h-5" />
               </button>
            </div>
         </div>
       )}

       {showH1Modal && <H1ComplianceModal />}
    </div>
  );
};

export default BillingDashboard;
