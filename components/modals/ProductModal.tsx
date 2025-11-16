
import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Supplier, SupplierProduct } from '../../types';
import { generateProductIcon } from '../../services/geminiService';
import { BarcodeScanner } from '../shared/BarcodeScanner';

interface ProductModalProps {
  product: Product | null;
  suppliers: Supplier[];
  products: Product[];
  onClose: () => void;
  onSave: (product: Product | Omit<Product, '__backendId'>) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const calculateEAN13Checksum = (barcodeWithoutChecksum: string): number => {
    if (barcodeWithoutChecksum.length !== 12) {
        // This should not happen with our generator, but good for safety.
        return 0;
    }
    let sum1 = 0; // odd positions
    let sum2 = 0; // even positions
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcodeWithoutChecksum[i], 10);
        if ((i + 1) % 2 === 1) { // odd position (1st, 3rd, ...)
            sum1 += digit;
        } else { // even position
            sum2 += digit;
        }
    }
    const totalSum = sum1 + (sum2 * 3);
    const checksum = (10 - (totalSum % 10)) % 10;
    return checksum;
};

const generateUniqueBarcode = (existingProducts: Product[]): string => {
  const existingBarcodes = new Set(existingProducts.map(p => p.barcode).filter(Boolean));
  let newBarcode = '';
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 100) { // Add attempt limit to prevent infinite loops
    // GS1 prefix '200'-'299' are for internal use by retailers.
    const prefix = '200'; 
    // Generate 9 random digits to make a 12-digit base
    const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
    const base = prefix + randomPart;
    
    const checksum = calculateEAN13Checksum(base);
    newBarcode = base + checksum.toString();

    if (!existingBarcodes.has(newBarcode)) {
      isUnique = true;
    }
    attempts++;
  }
  return newBarcode;
};


export const ProductModal: React.FC<ProductModalProps> = ({ product, suppliers, products, onClose, onSave, addToast }) => {
  const [formData, setFormData] = useState({
    product_code: product?.product_code || `PRD-${Date.now()}`,
    barcode: product?.barcode || '',
    product_name: product?.product_name || '',
    category: product?.category || '',
    supplier: product?.supplier || '',
    unit: product?.unit || 'ခု',
    cost: product?.cost || 0,
    price: product?.price || 0,
    quantity: product?.quantity || 0,
    reorder_level: product?.reorder_level || 10,
  });
  
  const [icon, setIcon] = useState<string | null>(product?.image_url || null);
  const [isIconLoading, setIsIconLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(product);
  const isScannerSupported = 'BarcodeDetector' in window;
  const isEdit = editingProduct !== null;

  const supplierProducts: SupplierProduct[] = useMemo(() => {
    const selectedSupplier = suppliers.find(s => s.supplier_name === formData.supplier);
    if (selectedSupplier && selectedSupplier.supplier_products) {
      try {
        return JSON.parse(selectedSupplier.supplier_products);
      } catch (e) {
        console.error("Failed to parse supplier products", e);
        return [];
      }
    }
    return [];
  }, [formData.supplier, suppliers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
        const isNumberField = ['cost', 'price', 'quantity', 'reorder_level'].includes(name);
        const newState = { ...prev, [name]: isNumberField ? parseFloat(value) || 0 : value };

        if (name === 'supplier') {
            newState.category = '';
            newState.product_name = '';
            setIcon(null);
        }
        return newState;
    });
  };
  
  const handleGenerateBarcode = () => {
    const newBarcode = generateUniqueBarcode(products);
    setFormData(prev => ({...prev, barcode: newBarcode}));
    addToast(`ဘားကုဒ်အသစ် ${newBarcode} ကို ထုတ်လုပ်လိုက်ပါပြီ`, 'info');
  };

  const handleProductSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (!value) {
        setFormData(prev => ({ ...prev, product_name: '', category: '' }));
        return;
    }
    const [category, productName] = value.split('|');
    setFormData(prev => ({
        ...prev,
        category: category || '',
        product_name: productName || ''
    }));
  };
  
  const handleScan = (scannedBarcode: string) => {
    setIsScanning(false);
    const existingProduct = products.find(p => p.barcode === scannedBarcode);

    if (existingProduct) {
        addToast('ကုန်ပစ္စည်းရှိပြီးဖြစ်ပါသည်၊ အချက်အလက်များဖြည့်လိုက်ပါပြီ', 'info');
        setFormData({
            product_code: existingProduct.product_code,
            barcode: existingProduct.barcode || '',
            product_name: existingProduct.product_name,
            category: existingProduct.category,
            supplier: existingProduct.supplier || '',
            unit: existingProduct.unit,
            cost: existingProduct.cost,
            price: existingProduct.price,
            quantity: existingProduct.quantity,
            reorder_level: existingProduct.reorder_level,
        });
        setIcon(existingProduct.image_url || null);
        setEditingProduct(existingProduct);
    } else {
        setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
        addToast('Barcode scan လုပ်ပြီးပါပြီ!', 'success');
    }
  };

  const handleRegenerateIcon = async () => {
    if (!formData.product_name.trim() || isIconLoading) return;
    setIsIconLoading(true);
    const newIcon = await generateProductIcon(formData.product_name);
    setIcon(newIcon);
    setIsIconLoading(false);
  };

  useEffect(() => {
    if (formData.product_name && (!isEdit || formData.product_name !== editingProduct?.product_name)) {
      const fetchIcon = async () => {
        setIsIconLoading(true);
        const newIcon = await generateProductIcon(formData.product_name);
        setIcon(newIcon);
        setIsIconLoading(false);
      };
      fetchIcon();
    } else if (!formData.product_name) {
      setIcon(null);
    }
  }, [formData.product_name, isEdit, editingProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let barcodeToSave = formData.barcode.trim();

    if (!isEdit && !barcodeToSave) {
        barcodeToSave = generateUniqueBarcode(products);
        addToast(`ဘားကုဒ်အသစ် ${barcodeToSave} ကို ထုတ်လုပ်လိုက်ပါပြီ`, 'info');
    }

    const productDataToSave = {
      ...formData,
      barcode: barcodeToSave,
      image_url: icon || undefined,
    };

    if (isEdit && editingProduct) {
      onSave({ ...editingProduct, ...productDataToSave });
    } else {
      const newProduct: Omit<Product, '__backendId'> = {
        ...productDataToSave,
        id: `prod_${Date.now()}`,
        module: 'inventory',
        type: 'product',
        created_at: new Date().toISOString(),
      };
      onSave(newProduct);
    }
  };


  return (
    <>
      {isScanning && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setIsScanning(false)}
        />
      )}
      <div style={{maxWidth: '600px', width: '100%'}}>
        <h3 className="text-2xl font-bold mb-6 text-gray-800">{isEdit ? 'ကုန်ပစ္စည်းပြင်ဆင်ရန်' : 'ကုန်ပစ္စည်းအသစ်ထည့်ရန်'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">ကုန်ပစ္စည်းကုဒ်</label>
              <input type="text" name="product_code" value={formData.product_code} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Barcode</label>
              <div className="flex items-center gap-2">
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg border-gray-300" placeholder="အလိုအလျောက်ထုတ်လုပ်မည်" />
                <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="p-2 h-full aspect-square rounded-lg bg-gray-200 hover:bg-gray-300 text-xl shrink-0"
                    title="Generate Barcode"
                  >
                    #️⃣
                </button>
                {isScannerSupported && (
                  <button
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="p-2 h-full aspect-square rounded-lg bg-gray-200 hover:bg-gray-300 text-xl shrink-0"
                    title="Scan Barcode"
                  >
                    📷
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">ပေးသွင်းသူ</label>
            <select name="supplier" value={formData.supplier} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg border-gray-300 bg-white">
              <option value="">-- ပေးသွင်းသူရွေးပါ --</option>
              {suppliers.map(s => <option key={s.__backendId} value={s.supplier_name}>{s.supplier_name}</option>)}
            </select>
          </div>
          
          <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700">ကုန်ပစ္စည်း</label>
              <div className="flex items-center gap-3">
                  <select 
                      name="product_selection"
                      value={formData.category && formData.product_name ? `${formData.category}|${formData.product_name}` : ''}
                      onChange={handleProductSelectionChange} 
                      required 
                      disabled={!formData.supplier} 
                      className="flex-1 w-full px-4 py-2 border rounded-lg border-gray-300 bg-white disabled:bg-gray-100"
                  >
                      <option value="">-- ကုန်ပစ္စည်းရွေးပါ --</option>
                      {supplierProducts.map(cat => (
                        <optgroup label={cat.category} key={cat.category}>
                            {cat.products.map(pName => (
                                <option key={pName} value={`${cat.category}|${pName}`}>{pName}</option>
                            ))}
                        </optgroup>
                      ))}
                  </select>
                  <div className="relative w-12 h-12 shrink-0">
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-3xl">
                        {isIconLoading ? <div className="animate-spin text-xl">⚙️</div> : icon || '📦'}
                    </div>
                    <button
                        type="button"
                        onClick={handleRegenerateIcon}
                        disabled={isIconLoading || !formData.product_name}
                        className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-blue-600 transition-transform hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title="Regenerate Icon"
                    >
                        🔄
                    </button>
                  </div>
              </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">အမျိုးအစား</label>
            <input 
              type="text" 
              name="category" 
              value={formData.category}
              readOnly
              required
              placeholder="ကုန်ပစ္စည်းရွေးချယ်ပြီးနောက် အလိုအလျောက်ဖြည့်ပါမည်"
              className="w-full px-4 py-2 border rounded-lg border-gray-300 bg-gray-100" 
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">ယူနစ်</label>
            <input type="text" name="unit" value={formData.unit} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg border-gray-300" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">ဝယ်ဈေး (ကျပ်)</label>
              <input type="number" name="cost" value={formData.cost} onChange={handleChange} required min="0" className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">ရောင်းဈေး (ကျပ်)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">အရေအတွက်</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Reorder Level</label>
              <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleChange} required min="0" className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600">
              {isEdit ? '✓ သိမ်းဆည်းမည်' : '➕ ထည့်မည်'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300">
              ပယ်ဖျက်မည်
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
