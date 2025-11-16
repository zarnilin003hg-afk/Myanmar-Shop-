

import React, { useState } from 'react';
import type { Transaction, Settings } from '../../types';

interface ReceiptModalProps {
  transaction: Transaction;
  settings: Settings;
  onClose: () => void;
  addToast: (message: string, type: 'info') => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, settings, onClose, addToast }) => {
  const [format, setFormat] = useState<'thermal' | 'a4'>('thermal');
  const items = JSON.parse(transaction.items) as { product_name: string; price: number; quantity: number; subtotal: number }[];

  const handlePrint = () => {
    window.print();
  };

  const formatClasses = {
    thermal: 'max-w-[300px] text-xs font-mono',
    a4: 'max-w-lg text-base',
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-center gap-2 p-1 bg-gray-200 rounded-lg no-print">
        <button
          onClick={() => setFormat('thermal')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${format === 'thermal' ? 'bg-white text-gray-800 shadow' : 'text-gray-600'}`}
        >
          🖨️ Thermal
        </button>
        <button
          onClick={() => setFormat('a4')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${format === 'a4' ? 'bg-white text-gray-800 shadow' : 'text-gray-600'}`}
        >
          📄 A4
        </button>
      </div>

      <div id="printable-receipt" className={`bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-800 transition-all duration-300 mx-auto ${formatClasses[format]} ${format}-format`}>
        <div className="text-center mb-4">
          <div className={`${format === 'thermal' ? 'text-lg' : 'text-2xl'} font-bold`}>{settings.storeName}</div>
          <div className={`${format === 'thermal' ? 'text-base' : 'text-lg'} font-semibold text-gray-700`}>ငွေရှင်းဘောင်ချာ</div>
          <div className={`${format === 'thermal' ? 'text-xs' : 'text-sm'} text-gray-500`}>{new Date(transaction.transaction_date).toLocaleString('my-MM')}</div>
        </div>
        
        <div className="text-xs border-t border-b border-dashed py-2 mb-3">
            <div className="flex justify-between"><span>Transaction ID:</span> <span className="font-semibold">{transaction.transaction_id}</span></div>
            <div className="flex justify-between"><span>ငွေပေးချေမှု:</span> <span className="font-semibold">{transaction.payment_method}</span></div>
        </div>
        
        <div className="mb-3 space-y-1">
          {items.map((item, index) => (
            <div key={index}>
                <div className="flex justify-between font-semibold">
                    <span>{item.product_name}</span>
                    <span>{item.subtotal.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-600 text-right">{item.price.toLocaleString()} × {item.quantity}</div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-dashed pt-2 mb-2 text-xs space-y-1">
          <div className="flex justify-between"><span>ကုန်ပစ္စည်းစုစုပေါင်း:</span><span>{(transaction.total_amount + transaction.discount - transaction.tax).toLocaleString()}</span></div>
          {transaction.discount > 0 && <div className="flex justify-between text-red-600"><span>လျှော့စျေး:</span><span>-{transaction.discount.toLocaleString()}</span></div>}
          <div className="flex justify-between"><span>အခွန် (5%):</span><span>{transaction.tax.toLocaleString()}</span></div>
        </div>
        
        <div className="border-t border-dashed pt-2 mb-3 space-y-1">
          <div className={`flex justify-between font-bold mb-2 ${format === 'thermal' ? 'text-base' : 'text-xl'}`}><span>ပေးချေရမည့်ငွေ:</span><span>{transaction.total_amount.toLocaleString()} ကျပ်</span></div>
          <div className="flex justify-between"><span>ပေးချေသောငွေ:</span><span>{transaction.paid_amount.toLocaleString()} ကျပ်</span></div>
          <div className="flex justify-between font-semibold text-green-600"><span>ပြန်အမ်းငွေ:</span><span>{transaction.change_amount.toLocaleString()} ကျပ်</span></div>
        </div>
        
        <div className="text-center text-xs text-gray-700 pt-3 mt-3 border-t border-dashed">
          <div className="font-bold">{settings.receiptFooter}</div>
          <div className="mt-1">နောက်တစ်ခေါက် ပြန်လာခဲ့ဖို့ ဖိတ်ခေါ်ပါတယ်</div>
        </div>
      </div>
      
      <div className="mt-6 flex gap-3 no-print">
        <button onClick={handlePrint} className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600">🖨️ ပရင့်ထုတ်မည်</button>
        <button onClick={onClose} className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600">✓ ပြီးပါပြီ</button>
      </div>
    </div>
  );
};
