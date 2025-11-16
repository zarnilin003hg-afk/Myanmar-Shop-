

import React, { useMemo } from 'react';
import type { Transaction, Customer, Product } from '../../types';

interface TransactionDetailModalProps {
  transaction: Transaction;
  customers: Customer[];
  products: Product[];
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, customers, products, onClose }) => {
  const items: { product_name: string; price: number; quantity: number; subtotal: number; product_code: string; }[] = JSON.parse(transaction.items);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const customer = customers.find(c => c.__backendId === transaction.customer_id);

  const { cogs, profit, profitMargin } = useMemo(() => {
    const cogsValue = items.reduce((sum, item) => {
        const product = products.find(p => p.product_code === item.product_code);
        return sum + (product ? product.cost * item.quantity : 0);
    }, 0);
    
    const revenue = subtotal - transaction.discount;
    const profitValue = revenue - cogsValue;
    
    const margin = revenue > 0 ? (profitValue / revenue) * 100 : 0;

    return { cogs: cogsValue, profit: profitValue, profitMargin: margin };
  }, [transaction, products, items, subtotal]);


  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">📊 Transaction အသေးစိတ်</h3>
      
      <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-600 dark:text-gray-400">Transaction ID:</span><div className="font-semibold text-gray-800 dark:text-gray-200">{transaction.transaction_id}</div></div>
          <div><span className="text-gray-600 dark:text-gray-400">ရက်စွဲ/အချိန်:</span><div className="font-semibold text-gray-800 dark:text-gray-200">{new Date(transaction.transaction_date).toLocaleString('my-MM')}</div></div>
          <div><span className="text-gray-600 dark:text-gray-400">ငွေပေးချေမှု:</span><div className="font-semibold text-gray-800 dark:text-gray-200">{transaction.payment_method}</div></div>
          <div><span className="text-gray-600 dark:text-gray-400">Cashier:</span><div className="font-semibold text-gray-800 dark:text-gray-200">{transaction.cashier}</div></div>
          {customer && <div><span className="text-gray-600 dark:text-gray-400">ဝယ်ယူသူ:</span><div className="font-semibold text-gray-800 dark:text-gray-200">{customer.customer_name}</div></div>}
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-bold mb-3 text-gray-800 dark:text-gray-200">ဝယ်ယူသောပစ္စည်းများ:</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">{item.product_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.price.toLocaleString()} × {item.quantity}</div>
              </div>
              <div className="font-bold text-blue-500 dark:text-blue-400">{item.subtotal.toLocaleString()} ကျပ်</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t pt-4 border-gray-200 dark:border-gray-600">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">စုစုပေါင်း:</span><span className="font-semibold text-gray-800 dark:text-gray-200">{subtotal.toLocaleString()} ကျပ်</span></div>
          {transaction.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">လျှော့စျေး:</span><span className="font-semibold text-red-500 dark:text-red-400">-{transaction.discount.toLocaleString()} ကျပ်</span></div>}
          <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">အခွန်:</span><span className="font-semibold text-gray-800 dark:text-gray-200">{transaction.tax.toLocaleString()} ကျပ်</span></div>
          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600"><span className="font-bold text-gray-800 dark:text-gray-100">ကျသင့်ငွေ:</span><span className="text-xl font-bold text-gray-800 dark:text-gray-100">{transaction.total_amount.toLocaleString()} ကျပ်</span></div>
          
          <div className="mt-4 pt-4 border-t border-dashed dark:border-gray-600">
            <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">ရောင်းကုန်ကျစရိတ် (COGS):</span><span className="font-semibold text-gray-800 dark:text-gray-200">{cogs.toLocaleString()} ကျပ်</span></div>
             <div className="flex justify-between text-sm"><span className="font-bold text-gray-800 dark:text-gray-100">စုစုပေါင်းအမြတ်:</span><span className={`font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{profit.toLocaleString()} ကျပ်</span></div>
             <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">အမြတ် ရာခိုင်နှုန်း:</span><span className="font-semibold text-blue-600 dark:text-blue-400">{profitMargin.toFixed(2)}%</span></div>
          </div>
          
           <div className="mt-4 pt-4 border-t dark:border-gray-600">
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">ပေးချေသောငွေ:</span><span className="font-semibold text-gray-800 dark:text-gray-200">{transaction.paid_amount.toLocaleString()} ကျပ်</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">ပြန်အမ်းငွေ:</span><span className="font-semibold text-green-600 dark:text-green-400">{transaction.change_amount.toLocaleString()} ကျပ်</span></div>
           </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button onClick={onClose} className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600">✓ ပိတ်မည်</button>
      </div>
    </div>
  );
};