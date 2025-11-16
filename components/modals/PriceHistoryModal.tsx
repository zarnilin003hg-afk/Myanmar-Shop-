
import React, { useMemo } from 'react';
import type { Product } from '../../types';

interface PriceHistoryModalProps {
  product: Product;
  onClose: () => void;
}

type PriceHistoryEntry = {
    date: string;
    old_price: number;
    new_price: number;
};

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ product, onClose }) => {
  const history = useMemo((): PriceHistoryEntry[] => {
    if (!product.price_history) {
      return [];
    }
    try {
      return JSON.parse(product.price_history);
    } catch (e) {
      console.error("Failed to parse price history:", e);
      return [];
    }
  }, [product.price_history]);

  return (
    <div>
      <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">📜 ဈေးနှုန်းမှတ်တမ်း</h3>
      <p className="text-base text-gray-600 dark:text-gray-400 mb-6 truncate">{product.product_name}</p>
      
      {history.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">🤷</div>
          <div>ဤကုန်ပစ္စည်းအတွက် ဈေးနှုန်းပြောင်းလဲမှု မှတ်တမ်းမရှိပါ</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {history.map((entry, index) => {
              const price_diff = entry.new_price - entry.old_price;
              const isIncrease = price_diff > 0;
            return (
              <div key={index} className="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {entry.old_price.toLocaleString()} ကျပ် <span className="text-gray-400 dark:text-gray-500 mx-1">→</span> {entry.new_price.toLocaleString()} ကျပ်
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.date).toLocaleDateString('en-CA')}
                  </div>
                </div>
                <div className={`font-bold text-lg ${isIncrease ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {isIncrease ? '▲' : '▼'} {Math.abs(price_diff).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <button 
            onClick={onClose} 
            className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600"
        >
          ✓ ပိတ်မည်
        </button>
      </div>
    </div>
  );
};