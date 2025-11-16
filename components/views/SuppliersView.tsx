
import React from 'react';
import type { Supplier, SupplierProduct, Product, UserRole } from '../../types';
import { StatCard } from '../shared/StatCard';
import { Badge } from '../shared/Badge';

interface SuppliersViewProps {
  suppliers: Supplier[];
  products: Product[];
  openModal: (supplier: Supplier | null) => void;
  deleteSupplier: (supplier: Supplier) => void;
  currentUserRole: UserRole;
}

const SupplierCard: React.FC<{ supplier: Supplier; productCount: number; openModal: (s: Supplier) => void; deleteSupplier: (s: Supplier) => void; currentUserRole: UserRole }> = ({ supplier, productCount, openModal, deleteSupplier, currentUserRole }) => {
  const supplierProducts: SupplierProduct[] = supplier.supplier_products ? JSON.parse(supplier.supplier_products) : [];
  
  return (
    <div className="rounded-xl shadow-md overflow-hidden bg-white flex flex-col">
      <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
        <div className="text-4xl mb-3">🏭</div>
        <h3 className="text-xl font-bold mb-1">{supplier.supplier_name}</h3>
        <div className="text-sm opacity-90">{supplier.supplier_phone}</div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-4">
            <div className="text-sm font-semibold mb-2 text-gray-600">ဆက်သွယ်ရန်</div>
            <div className="text-sm mb-1 text-gray-800 truncate">📧 {supplier.supplier_email || '-'}</div>
            <div className="text-sm text-gray-800">📍 {supplier.supplier_address || '-'}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm font-semibold mb-2 text-gray-600">ရောင်းချနိုင်သော ကုန်ပစ္စည်းအမျိုးအစား ({supplierProducts.length})</div>
            <div className="flex flex-wrap gap-2">
              {supplierProducts.slice(0, 3).map(p => <Badge key={p.category} color="info">{p.category}</Badge>)}
              {supplierProducts.length > 3 && <Badge color="info">+{supplierProducts.length - 3}</Badge>}
            </div>
          </div>
          
          <div className="mb-4 p-3 rounded-lg bg-gray-50">
            <div className="text-sm text-gray-600">ပေးသွင်းထားသော ကုန်ပစ္စည်း</div>
            <div className="text-2xl font-bold text-green-600">{productCount} ပစ္စည်း</div>
          </div>
        </div>
        
        {currentUserRole === 'Admin' && (
          <div className="flex gap-2">
            <button onClick={() => openModal(supplier)} className="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-yellow-500 hover:bg-yellow-600">✏️ ပြင်ဆင်</button>
            <button onClick={() => deleteSupplier(supplier)} className="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600">🗑️ ဖျက်</button>
          </div>
        )}
      </div>
    </div>
  );
};

export const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, products, openModal, deleteSupplier, currentUserRole }) => {
    const allCategories = new Set<string>();
    suppliers.forEach(s => {
      if (s.supplier_products) {
        try {
          const prods: SupplierProduct[] = JSON.parse(s.supplier_products);
          prods.forEach(p => allCategories.add(p.category));
        } catch(e) { console.error("Could not parse supplier products", e)}
      }
    });

    const suppliedProducts = products.filter(p => p.supplier && suppliers.some(s => s.supplier_name === p.supplier));

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">🏭 ကုန်ပစ္စည်းပေးသွင်းသူများ စီမံခန့်ခွဲမှု</h2>
            <p className="text-gray-600">သင့်လုပ်ငန်းအတွက် ကုန်ပစ္စည်းပေးသွင်းသူများနှင့် ၎င်းတို့၏ ကုန်ပစ္စည်းများ</p>
          </div>
          {currentUserRole === 'Admin' && (
            <button
              onClick={() => openModal(null)}
              className="px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              ➕ ပေးသွင်းသူအသစ်
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="စုစုပေါင်းပေးသွင်းသူ" value={suppliers.length.toString()} color="plain" valueColor="text-gray-800" />
          <StatCard title="ကုန်ပစ္စည်းအမျိုးအစား" value={allCategories.size.toString()} color="plain" valueColor="text-yellow-600" />
          <StatCard title="ပေးသွင်းသောပစ္စည်း" value={suppliedProducts.length.toString()} color="plain" valueColor="text-green-600" />
        </div>

        {suppliers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">🏭</div>
            <div className="text-xl font-semibold mb-2">ပေးသွင်းသူမရှိသေးပါ</div>
            <div className="text-sm">ပေးသွင်းသူအသစ်ထည့်ပြီး ၎င်းတို့၏ ကုန်ပစ္စည်းများကို စီမံပါ</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(s => {
              const productCount = products.filter(p => p.supplier === s.supplier_name).length;
              return <SupplierCard key={s.__backendId} supplier={s} productCount={productCount} openModal={openModal} deleteSupplier={deleteSupplier} currentUserRole={currentUserRole} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
