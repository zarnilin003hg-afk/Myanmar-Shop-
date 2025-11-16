
import React, { useState, useMemo, useEffect } from 'react';
import type { Product, CartItem, Customer } from '../../types';
import { ProductGrid } from '../pos/ProductGrid';
import { Cart } from '../pos/Cart';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  cart: CartItem[];
  discount: number;
  taxRate: number;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  addToCart: (product: Product) => void;
  updateCartQuantity: (productCode: string, newQuantity: number) => void;
  removeFromCart: (productCode: string) => void;
  openCheckout: () => void;
  openDiscount: () => void;
  openClearCart: () => void;
  openBarcodeScanner: () => void;
}

export const PosView: React.FC<PosViewProps> = (props) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartVisible, setIsCartVisible] = useState(false);
  const isScannerSupported = 'BarcodeDetector' in window;

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  const categories = ['all', ...new Set(props.products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    return props.products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesSearch =
          p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.product_code && p.product_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
        return p.quantity > 0 && matchesCategory && matchesSearch;
    });
  }, [props.products, selectedCategory, searchQuery]);


  const { total, totalItems } = useMemo(() => {
    const subtotal = props.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const afterDiscount = subtotal - props.discount;
    const tax = afterDiscount * props.taxRate;
    const totalValue = Math.round(afterDiscount + tax);
    const itemsCount = props.cart.reduce((sum, item) => sum + item.quantity, 0);
    return { total: totalValue, totalItems: itemsCount };
  }, [props.cart, props.discount, props.taxRate]);


  return (
    <div className="h-full flex md:flex-row flex-col">
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="🔍 ကုန်ပစ္စည်းရှာရန်..."
              className="flex-1 w-full px-4 py-2 rounded-lg border-2 border-gray-300 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="button"
              onClick={props.openBarcodeScanner}
              aria-label="Scan Barcode"
              className="p-3 h-full aspect-square rounded-lg bg-blue-500 text-white text-2xl hover:bg-blue-600 transition-colors shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={isScannerSupported ? "Scan Barcode" : "ဘားကုဒ်စကင်နာကို ဤဘရောက်စာတွင် အသုံးမပြုနိုင်ပါ"}
              disabled={!isScannerSupported}
            >
              📷
            </button>
          </div>
          <div
            role="group"
            aria-label="Product category filters"
            className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map(cat => (
              <button
                key={cat}
                aria-pressed={selectedCategory === cat}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? '📋 အားလုံး' : `📦 ${cat}`}
              </button>
            ))}
          </div>
        </div>
        <ProductGrid products={filteredProducts} addToCart={props.addToCart} selectedCategory={selectedCategory} />
      </div>

      {/* Desktop Cart */}
      <div className="w-96 hidden md:flex flex-col border-l bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <Cart {...props} />
      </div>

      {/* Mobile Cart FAB */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <button 
          onClick={() => setIsCartVisible(true)}
          className="bg-blue-600 text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-3 transform transition-transform hover:scale-105"
        >
          <span className="text-2xl">🛒</span>
          <span className="font-bold bg-white text-blue-600 rounded-full w-7 h-7 flex items-center justify-center">{totalItems}</span>
          <div className="w-px h-6 bg-white/50"></div>
          <span className="font-bold">{total.toLocaleString()} ကျပ်</span>
        </button>
      </div>

      {/* Mobile Cart Panel */}
      {isCartVisible && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 animate-[fadeIn_0.3s_ease-out]" 
          onClick={() => setIsCartVisible(false)}
        >
           <div 
             className="fixed inset-y-0 right-0 w-full max-w-sm bg-gray-50 dark:bg-gray-900 shadow-xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
             onClick={(e) => e.stopPropagation()}
           >
             <Cart {...props} closeCart={() => setIsCartVisible(false)} />
           </div>
        </div>
      )}
    </div>
  );
};