
import React from 'react';
import type { CartItem, Customer } from '../../types';

interface CartProps {
  cart: CartItem[];
  customers: Customer[];
  discount: number;
  taxRate: number;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  updateCartQuantity: (productCode: string, newQuantity: number) => void;
  removeFromCart: (productCode: string) => void;
  openCheckout: () => void;
  openDiscount: () => void;
  openClearCart: () => void;
  closeCart?: () => void; // Optional for mobile view
}

const QuantityControl: React.FC<{
  item: CartItem;
  updateCartQuantity: (productCode: string, newQuantity: number) => void;
}> = ({ item, updateCartQuantity }) => (
  <div className="flex items-center gap-2">
    <button
      className="w-8 h-8 rounded-md border-2 border-gray-300 bg-white cursor-pointer font-bold transition-colors hover:bg-blue-500 hover:text-white hover:border-blue-500"
      onClick={() => updateCartQuantity(item.product_code, item.quantity - 1)}
    >
      −
    </button>
    <span className="font-semibold px-2 w-8 text-center">{item.quantity}</span>
    <button
      className="w-8 h-8 rounded-md border-2 border-gray-300 bg-white cursor-pointer font-bold transition-colors hover:bg-blue-500 hover:text-white hover:border-blue-500"
      onClick={() => updateCartQuantity(item.product_code, item.quantity + 1)}
    >
      +
    </button>
  </div>
);

export const Cart: React.FC<CartProps> = ({
  cart,
  customers,
  discount,
  taxRate,
  selectedCustomerId,
  setSelectedCustomerId,
  updateCartQuantity,
  removeFromCart,
  openCheckout,
  openDiscount,
  openClearCart,
  closeCart
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * taxRate;
  const total = Math.round(afterDiscount + tax);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedCustomer = customers.find(c => c.__backendId === selectedCustomerId);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-800">🛒 ဝယ်ယူမည့်စာရင်း</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={openClearCart}
              disabled={cart.length === 0}
              className="px-3 py-1 rounded-lg text-sm font-semibold bg-red-100 text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ ရှင်းလင်း
            </button>
            {closeCart && (
              <button onClick={closeCart} className="md:hidden text-2xl font-bold text-gray-600 hover:text-gray-900">
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">{totalItems} ပစ္စည်း</div>
      </div>
      
      <div className="p-4 border-b border-gray-200 bg-white">
        <label htmlFor="customer-select" className="text-sm font-semibold text-gray-700 block mb-2">👤 ဝယ်ယူသူ ရွေးရန်</label>
        <select
            id="customer-select"
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
        >
            <option value="">-- ဝယ်ယူသူမပါ --</option>
            {customers.map(c => (
                <option key={c.__backendId} value={c.__backendId}>{c.customer_name} - {c.customer_phone}</option>
            ))}
        </select>
        {selectedCustomer && (
            <div className="mt-2 text-sm p-2 bg-blue-50 text-blue-700 rounded-md">
                <span className='font-bold'>{selectedCustomer.customer_name}</span> တွင် အမှတ် <span className='font-bold'>{selectedCustomer.loyalty_points || 0}</span> ရှိသည်
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🛒</div>
            <div>စာရင်းအလွတ်</div>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.__backendId} className="bg-white border border-gray-200 rounded-lg p-3 mb-2 transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{item.product_name}</div>
                  <div className="text-sm text-gray-600">{item.price.toLocaleString()} ကျပ် × {item.quantity} {item.unit || 'ခု'}</div>
                </div>
                <button onClick={() => removeFromCart(item.product_code)} className="text-red-500 hover:text-red-700 text-xl">
                  🗑️
                </button>
              </div>
              <div className="flex justify-between items-center">
                <QuantityControl item={item} updateCartQuantity={updateCartQuantity} />
                <div className="font-bold text-blue-500">{(item.price * item.quantity).toLocaleString()} ကျပ်</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">စုစုပေါင်း:</span>
            <span className="font-semibold text-gray-800">{subtotal.toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">လျှော့စျေး:</span>
            <span className="font-semibold text-red-500">{discount.toLocaleString()} ကျပ်</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">အခွန် ({(taxRate * 100).toFixed(0)}%):</span>
            <span className="font-semibold text-gray-800">{Math.round(tax).toLocaleString()} ကျပ်</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-800">စုစုပေါင်း:</span>
              <span className="text-2xl font-bold text-blue-500">{total.toLocaleString()} ကျပ်</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={openDiscount}
            disabled={cart.length === 0}
            className="w-full px-4 py-2 rounded-lg font-semibold bg-yellow-200 text-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💰 လျှော့စျေး/အမှတ်သုံးရန်
          </button>
          <button
            onClick={openCheckout}
            disabled={cart.length === 0}
            className="w-full px-4 py-3 rounded-lg font-bold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            ✓ ငွေရှင်းမည် ({total.toLocaleString()} ကျပ်)
          </button>
        </div>
      </div>
    </div>
  );
};
