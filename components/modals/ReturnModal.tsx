
import React, { useState, useMemo } from 'react';
import type { Transaction } from '../../types';

interface ReturnModalProps {
  transaction: Transaction;
  onClose: () => void;
  onProcessReturn: (
    originalTransaction: Transaction,
    itemsToReturn: { product_code: string; name: string; quantity: number; price: number }[],
    reason: string,
    restock: boolean
  ) => void;
  addToast: (message: string, type: 'error' | 'info') => void;
}

type OriginalItem = {
  product_code: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export const ReturnModal: React.FC<ReturnModalProps> = ({ transaction, onClose, onProcessReturn, addToast }) => {
  const originalItems = useMemo(() => {
    try {
      return JSON.parse(transaction.items) as OriginalItem[];
    } catch (e) {
      console.error("Failed to parse transaction items:", e);
      return [];
    }
  }, [transaction.items]);
  
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>(
    originalItems.reduce((acc, item) => ({ ...acc, [item.product_code]: 0 }), {})
  );
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(true);

  const handleQuantityChange = (product_code: string, newQuantity: number) => {
    const originalItem = originalItems.find(item => item.product_code === product_code);
    if (!originalItem) return;
    
    // Clamp quantity between 0 and original purchased quantity
    const clampedQuantity = Math.max(0, Math.min(newQuantity, originalItem.quantity));

    setReturnQuantities(prev => ({
      ...prev,
      [product_code]: clampedQuantity,
    }));
  };
  
  const totalRefundAmount = useMemo(() => {
    return originalItems.reduce((sum, item) => {
        const returnQty = returnQuantities[item.product_code] || 0;
        return sum + (returnQty * item.price);
    }, 0);
  }, [returnQuantities, originalItems]);

  const handleSubmit = () => {
    const itemsToReturn = originalItems
        .map(item => ({
            product_code: item.product_code,
            name: item.product_name,
            quantity: returnQuantities[item.product_code] || 0,
            price: item.price
        }))
        .filter(item => item.quantity > 0);

    if (itemsToReturn.length === 0) {
        addToast('ပြန်သွင်းရန် ပစ္စည်းရွေးပါ', 'error');
        return;
    }
    
    onProcessReturn(transaction, itemsToReturn, reason, restock);
  };

  return (
    <div style={{ maxWidth: '600px', width: '100%' }}>
      <h3 className="text-2xl font-bold mb-4 text-gray-800">↩️ ပစ္စည်းပြန်သွင်းခြင်း</h3>
      <p className="text-sm text-gray-500 mb-6">မူရင်း Transaction ID: {transaction.transaction_id}</p>
      
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">ပြန်သွင်းမည့် ပစ္စည်းများ</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
          {originalItems.map(item => (
            <div key={item.product_code} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
              <div>
                <div className="font-semibold text-gray-800">{item.product_name}</div>
                <div className="text-sm text-gray-500">မူလဝယ်ယူ: {item.quantity} ခု (တစ်ခုလျှင် {item.price.toLocaleString()} ကျပ်)</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={item.quantity}
                  value={returnQuantities[item.product_code] || 0}
                  onChange={(e) => handleQuantityChange(item.product_code, parseInt(e.target.value) || 0)}
                  className="w-20 p-2 border border-gray-300 rounded-lg text-center"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
        <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-blue-800">ပြန်အမ်းငွေ စုစုပေါင်း:</span>
            <span className="font-bold text-2xl text-blue-800">{totalRefundAmount.toLocaleString()} ကျပ်</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">အကြောင်းအရင်း (Optional)</label>
        <input 
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ဥပမာ: ပစ္စည်းမှားယွင်း"
          className="w-full px-4 py-2 border rounded-lg border-gray-300"
        />
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 cursor-pointer">
          <input
            type="checkbox"
            checked={restock}
            onChange={(e) => setRestock(e.target.checked)}
            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="font-semibold text-gray-700">ပစ္စည်းကို လက်ကျန်စာရင်းသို့ ပြန်ထည့်မည်</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSubmit} className="flex-1 px-6 py-3 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600">
          ✓ ပြန်သွင်းခြင်း အတည်ပြုမည်
        </button>
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300">
          ပယ်ဖျက်မည်
        </button>
      </div>
    </div>
  );
};
