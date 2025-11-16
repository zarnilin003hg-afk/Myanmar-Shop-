
import React from 'react';
import type { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  addToCart: (product: Product) => void;
  selectedCategory: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, addToCart, selectedCategory }) => {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
        <div>
          <div className="text-6xl mb-4">📦</div>
          <div className="text-xl font-semibold mb-2">ကုန်ပစ္စည်းမရှိပါ</div>
          <div className="text-sm">
            {selectedCategory === 'all' ? 'ကုန်ပစ္စည်းစာရင်းသို့သွားပြီး ထည့်သွင်းပါ' : 'ဤအမျိုးအစားတွင် ကုန်ပစ္စည်းမရှိပါ'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <ProductCard key={p.__backendId} product={p} addToCart={addToCart} />
        ))}
      </div>
    </div>
  );
};