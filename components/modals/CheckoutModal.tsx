
import React, { useState, useMemo } from 'react';
import type { CartItem, Transaction } from '../../types';

interface CheckoutModalProps {
  cart: CartItem[];
  discount: number;
  taxRate: number;
  onClose: () => void;
  onCheckout: (transaction: Omit<Transaction, '__backendId' | 'id' | 'module' | 'type' | 'created_at'>) => void;
}

const paymentMethods = [
  { name: 'ငွေသား', icon: '💵', bg: 'bg-green-100', text: 'text-green-800' },
  { name: 'ကတ်', icon: '💳', bg: 'bg-blue-100', text: 'text-blue-800' },
  { name: 'မိုဘိုင်းငွေ', icon: '📱', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { name: 'ဘဏ်လွှဲ', icon: '🏦', bg: 'bg-indigo-100', text: 'text-indigo-800' },
];

const NumberPadButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="p-4 text-2xl font-bold rounded-lg border-2 bg-white transition-all hover:bg-gray-100 hover:scale-105 active:scale-95">
    {children}
  </button>
);

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ cart, discount, taxRate, onClose, onCheckout }) => {
  const { total, tax } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const afterDiscount = subtotal - discount;
    const taxValue = afterDiscount * taxRate;
    return { total: Math.round(afterDiscount + taxValue), tax: taxValue };
  }, [cart, discount, taxRate]);

  const [paidAmount, setPaidAmount] = useState(total.toString());
  const [paymentMethod, setPaymentMethod] = useState('ငွေသား');

  const parsedPaidAmount = parseInt(paidAmount) || 0;
  const change = Math.max(0, parsedPaidAmount - total);

  const handleNumberPad = (num: string) => {
    if (paidAmount === '0' || paidAmount === total.toString()) {
      setPaidAmount(num);
    } else {
      setPaidAmount(paidAmount + num);
    }
  };

  const handleClear = () => setPaidAmount('0');

  const handleSubmit = () => {
    if (parsedPaidAmount < total) {
      alert('ငွေမလုံလောက်ပါ'); // Replace with a better toast later
      return;
    }
    const transaction: Omit<Transaction, '__backendId' | 'id' | 'module' | 'type' | 'created_at'> = {
      transaction_id: `TXN-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      items: JSON.stringify(cart.map(item => ({
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }))),
      total_amount: total,
      paid_amount: parsedPaidAmount,
      change_amount: change,
      discount: discount,
      tax: tax,
      payment_method: paymentMethod,
      cashier: 'Admin',
    };
    onCheckout(transaction);
  };
  
  return (
    <div style={{maxWidth: '500px', width: '100%'}}>
      <h3 className="text-2xl font-bold mb-6 text-gray-800">💳 ငွေရှင်းရန်</h3>
      
      <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-100 border border-gray-200 text-center">
              <div className="text-base font-semibold text-gray-600">ပေးချေရမည့် စုစုပေါင်း</div>
              <div className="text-4xl font-bold text-gray-800 tracking-tight">{total.toLocaleString()} ကျပ်</div>
          </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-base font-semibold mb-2 text-gray-700">ရရှိသောငွေ (ကျပ်)</label>
        <input 
            type="text" 
            value={paidAmount} 
            onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) { // only allow digits
                    setPaidAmount(val);
                }
            }}
            className="w-full p-3 rounded-lg border-2 text-2xl font-bold text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition" 
        />
      </div>

      <div className="mb-6 p-4 rounded-lg bg-blue-50 flex justify-between items-center">
        <span className="text-lg font-semibold text-blue-800">ပြန်အမ်းငွေ:</span>
        <span className="text-2xl font-bold text-blue-800">{change.toLocaleString()} ကျပ်</span>
      </div>

      <div className="mb-6">
        <div
          role="radiogroup"
          aria-label="Payment Method"
          className="grid grid-cols-2 gap-3"
        >
          {paymentMethods.map(method => (
            <button
              key={method.name}
              role="radio"
              aria-checked={paymentMethod === method.name}
              onClick={() => setPaymentMethod(method.name)}
              className={`p-4 rounded-lg font-bold flex items-center justify-center gap-2 border-2 transition-all ${paymentMethod === method.name ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'} ${method.bg} ${method.text}`}
            >
              {method.icon} {method.name}
            </button>
          ))}
        </div>
      </div>
     
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[ '7', '8', '9', '4', '5', '6', '1', '2', '3'].map(num => <NumberPadButton key={num} onClick={() => handleNumberPad(num)}>{num}</NumberPadButton>)}
        <NumberPadButton onClick={handleClear}>C</NumberPadButton>
        <NumberPadButton onClick={() => handleNumberPad('0')}>0</NumberPadButton>
        <NumberPadButton onClick={() => handleNumberPad('00')}>00</NumberPadButton>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSubmit} className="flex-1 p-4 rounded-lg font-bold text-white text-lg" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>✓ အတည်ပြုမည်</button>
        <button onClick={onClose} className="p-4 rounded-lg font-semibold bg-gray-200 text-gray-700">ပယ်ဖျက်</button>
      </div>
    </div>
  );
};