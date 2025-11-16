
import React from 'react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, addToCart }) => {
  const isLowStock = product.quantity <= product.reorder_level;

  return (
    <div
      className="rounded-xl shadow-md p-3 sm:p-4 cursor-pointer bg-white transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg flex flex-col"
      onClick={() => addToCart(product)}
    >
      <div className="text-3xl sm:text-4xl mb-3 text-center">{product.image_url || '📦'}</div>
      <div className="flex-grow">
        <div className="font-bold mb-1 text-gray-800 truncate">{product.product_name}</div>
        <div className="text-xs sm:text-sm mb-2 text-gray-500">{product.category}</div>
      </div>
      <div className="flex justify-between items-center mt-auto">
        <div className="text-lg sm:text-xl font-bold text-blue-500">{product.price.toLocaleString()} ကျပ်</div>
        <div
          className={`text-xs sm:text-sm px-2 py-1 rounded ${
            isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
        >
          {product.quantity} {product.unit || 'ခု'}
        </div>
      </div>
    </div>
  );
});
