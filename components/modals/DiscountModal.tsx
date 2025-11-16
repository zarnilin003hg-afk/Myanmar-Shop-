
import React, { useState } from 'react';
import type { CartItem, Customer } from '../../types';

interface DiscountModalProps {
  currentDiscount: number;
  cart: CartItem[];
  selectedCustomer: Customer | null;
  onClose: () => void;
  onApply: (discount: number) => void;
  addToast: (message: string, type: 'error' | 'info') => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ currentDiscount, cart, selectedCustomer, onClose, onApply, addToast }) => {
  const [discount, setDiscount] = useState(currentDiscount);
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const points = selectedCustomer?.loyalty_points || 0;
  const maxRedeemableValue = points * 10;
  const redeemableDiscount = Math.min(maxRedeemableValue, subtotal);

  const handleApply = () => {
    if (discount > subtotal) {
      addToast('လျှော့စျေးသည် စုစုပေါင်းထက် မပိုနိုင်ပါ', 'error');
      return;
    }
    onApply(discount);
  };
  
  const handleRedeem = () => {
    setDiscount(redeemableDiscount);
    addToast(`${redeemableDiscount.toLocaleString()} ကျပ် လျှော့စျေးအတွက် အမှတ် ${Math.floor(redeemableDiscount / 10)} ကို သုံးလိုက်ပါပြီ`, 'info');
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">💰 လျှော့စျေး / အမှတ်သုံးရန်</h3>
      
      {selectedCustomer && points > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className='font-bold'>{selectedCustomer.customer_name}</span> တွင် အမှတ် <span className='font-bold'>{points}</span> ရှိပါသည်။
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                (အများဆုံး <span className='font-bold'>{redeemableDiscount.toLocaleString()}</span> ကျပ် လျှော့စျေးရနိုင်သည်)
            </p>
            <button 
                onClick={handleRedeem}
                className="w-full px-4 py-2 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600"
                disabled={redeemableDiscount <= 0}
            >
                🎁 အမှတ်များသုံးရန်
            </button>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">လျှော့စျေးပမာဏ (ကျပ်)</label>
        <input 
          type="number" 
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          min="0" 
          max={subtotal}
          className="w-full px-4 py-3 rounded-lg border-2 text-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={handleApply} className="flex-1 px-6 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600">
          ✓ အတည်ပြုမည်
        </button>
        <button onClick={onClose} className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
          ပယ်ဖျက်မည်
        </button>
      </div>
    </div>
  );
};