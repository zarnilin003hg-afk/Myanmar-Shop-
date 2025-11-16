
import React, { useState, useEffect } from 'react';
import type { Supplier, SupplierProduct } from '../../types';
import { generateProductSuggestions } from '../../services/geminiService';

interface SupplierModalProps {
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (supplier: Supplier | Omit<Supplier, '__backendId'>) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const inputStyle = "w-full px-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors";
const labelStyle = "text-sm font-semibold mb-3 block text-gray-700 dark:text-gray-200";

export const SupplierModal: React.FC<SupplierModalProps> = ({ supplier, onClose, onSave, addToast }) => {
  const [formData, setFormData] = useState({
    supplier_name: supplier?.supplier_name || '',
    supplier_phone: supplier?.supplier_phone || '',
    supplier_email: supplier?.supplier_email || '',
    supplier_address: supplier?.supplier_address || '',
  });
  const [products, setProducts] = useState<SupplierProduct[]>(
    supplier && supplier.supplier_products ? JSON.parse(supplier.supplier_products) : [{ category: '', products: [] }]
  );
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const [categoryQuery, setCategoryQuery] = useState('');

  const isEdit = supplier !== null;

  useEffect(() => {
    const fetchSuggestions = async () => {
        if (categoryQuery.trim() === '' || activeSuggestionIndex === null) {
            setSuggestions([]);
            return;
        }
        setLoadingSuggestions(true);
        setSuggestions([]);
        
        const contextCategories = products
            .map(p => p.category)
            .filter((cat, index) => index !== activeSuggestionIndex && cat.trim() !== '');

        const newSuggestions = await generateProductSuggestions(categoryQuery, contextCategories);
        
        if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions);
            addToast(`'${categoryQuery}' အတွက် အကြံပြုချက်များ ရပါပြီ။`, 'info');
        }
        setLoadingSuggestions(false);
    };

    const debounceTimeout = setTimeout(() => {
        fetchSuggestions();
    }, 800);

    return () => clearTimeout(debounceTimeout);
  }, [categoryQuery, activeSuggestionIndex, addToast, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProductChange = (index: number, field: 'category' | 'products', value: string) => {
    const newProducts = [...products];
    if (field === 'products') {
      newProducts[index][field] = value.split(',').map(p => p.trim());
    } else {
      newProducts[index][field] = value;
      setActiveSuggestionIndex(index);
      setCategoryQuery(value);
    }
    setProducts(newProducts);
  };
  
  const handleSelectSuggestion = (index: number, suggestion: string) => {
    setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        const target = newProducts[index];
        const currentProductNames = new Set(target.products.filter(p => p));
        
        if (!currentProductNames.has(suggestion)) {
            target.products = [...Array.from(currentProductNames), suggestion];
        }
        
        return newProducts;
    });
  };

  const addProductField = () => {
    setProducts([...products, { category: '', products: [] }]);
  };

  const removeProductField = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validProducts = products.filter(p => p.category.trim() && p.products.some(name => name.trim()));
    if (validProducts.length === 0) {
        addToast('အနည်းဆုံး ကုန်ပစ္စည်းအမျိုးအစား ၁ ခု ထည့်သွင်းပါ', 'error');
        return;
    }
    
    if (isEdit && supplier) {
      onSave({ ...supplier, ...formData, supplier_products: JSON.stringify(validProducts) });
    } else {
      const newSupplier: Omit<Supplier, '__backendId'> = {
        ...formData,
        id: `supp_${Date.now()}`,
        module: 'suppliers',
        type: 'supplier',
        created_at: new Date().toISOString(),
        supplier_products: JSON.stringify(validProducts),
      };
      onSave(newSupplier);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{isEdit ? '🏭 ပေးသွင်းသူပြင်ဆင်ရန်' : '🏭 ပေးသွင်းသူအသစ်ထည့်ရန်'}</h3>
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="mb-4">
          <input type="text" name="supplier_name" value={formData.supplier_name} onChange={handleChange} required placeholder="ပေးသွင်းသူအမည် *" className={inputStyle} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input type="tel" name="supplier_phone" value={formData.supplier_phone} onChange={handleChange} required placeholder="ဖုန်းနံပါတ် *" className={inputStyle} />
          <input type="email" name="supplier_email" value={formData.supplier_email} onChange={handleChange} placeholder="အီးမေးလ်" className={inputStyle} />
        </div>
        <div className="mb-4">
          <textarea name="supplier_address" value={formData.supplier_address} onChange={handleChange} placeholder="လိပ်စာ" rows={2} className={inputStyle}></textarea>
        </div>
        
        {/* Products List */}
        <div className="mb-4">
          <label className={labelStyle}>📦 ရောင်းချနိုင်သော ကုန်ပစ္စည်းအမျိုးအစားများ</label>
          <div className="space-y-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 max-h-60 overflow-y-auto">
            {products.map((p, i) => (
              <div key={i} className="flex gap-2 items-start p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="flex-1 space-y-2 relative">
                  <input 
                    type="text" 
                    value={p.category} 
                    onFocus={() => {
                        setActiveSuggestionIndex(i);
                        setCategoryQuery(products[i].category);
                    }}
                    onChange={e => handleProductChange(i, 'category', e.target.value)} 
                    placeholder="အမျိုးအစား (ဥပမာ: အသီးအနှံများ)" 
                    className={`${inputStyle} font-semibold`} 
                  />
                  <textarea 
                    value={p.products.join(', ')}
                    onFocus={() => {
                        setActiveSuggestionIndex(i);
                        setCategoryQuery(products[i].category);
                    }}
                    onChange={e => handleProductChange(i, 'products', e.target.value)} 
                    rows={2} 
                    placeholder="ကုန်ပစ္စည်းများ (ကော်မာခြားပါ)&#10;ဥပမာ: မာမွန်းသီး, ဒူးရီးယန်းသီး, ပန်းသီး" 
                    className={`${inputStyle} text-sm`}
                   />
                  {activeSuggestionIndex === i && (loadingSuggestions || suggestions.length > 0) && (
                    <div className="absolute top-full z-10 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {loadingSuggestions ? (
                            <div className="p-2 text-sm text-gray-500 dark:text-gray-400 text-center">🧠 AI အကြံပြုချက်များ ရှာဖွေနေသည်...</div>
                        ) : (
                            suggestions.map(s => (
                                <div 
                                    key={s}
                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                                    onClick={() => handleSelectSuggestion(i, s)}
                                >
                                    ➕ {s}
                                </div>
                            ))
                        )}
                    </div>
                  )}
                </div>
                {products.length > 1 && <button type="button" onClick={() => removeProductField(i)} className="px-3 py-2 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600">✕</button>}
              </div>
            ))}
          </div>
          <button type="button" onClick={addProductField} className="w-full mt-3 px-4 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600">➕ အမျိုးအစားအသစ်ထည့်ရန်</button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button type="submit" className="flex-1 px-6 py-3 rounded-lg font-bold text-white text-lg" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            {isEdit ? '✓ သိမ်းဆည်းမည်' : '➕ ထည့်သွင်းမည်'}
          </button>
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            ပယ်ဖျက်မည်
          </button>
        </div>
      </form>
    </div>
  );
};