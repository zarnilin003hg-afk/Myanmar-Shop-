
import React, { useState, useMemo, useEffect } from 'react';
import type { Product, Supplier, UserRole } from '../../types';
import { StatCard } from '../shared/StatCard';
import { Badge } from '../shared/Badge';

interface InventoryViewProps {
  products: Product[];
  suppliers: Supplier[];
  openModal: (product: Product | null) => void;
  deleteProduct: (product: Product) => void;
  openPriceHistoryModal: (product: Product) => void;
  currentUserRole: UserRole;
}

type SortKey = 'product_name' | 'category' | 'quantity' | 'cost' | 'price';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ products, suppliers, openModal, deleteProduct, openPriceHistoryModal, currentUserRole }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);


  const lowStock = products.filter(p => p.quantity <= p.reorder_level);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const categories = [...new Set(products.map(p => p.category))].length;
  
  const displayProducts = useMemo(() => {
    let filteredItems = [...products];

    if (searchQuery.trim()) {
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(t => t);
        filteredItems = products.filter(p => {
            const searchableString = [
                p.product_name,
                p.product_code,
                p.category,
                p.barcode || ''
            ].join(' ').toLowerCase();

            return searchTerms.every(term => searchableString.includes(term));
        });
    }

    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredItems;
  }, [products, sortConfig, searchQuery]);
  
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return null;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const headers: { label: string; key?: SortKey; sortable: boolean }[] = [
    { label: 'ကုဒ်', sortable: false },
    { label: 'ကုန်ပစ္စည်း', key: 'product_name', sortable: true },
    { label: 'အမျိုးအစား', key: 'category', sortable: true },
    { label: 'ပေးသွင်းသူ', sortable: false },
    { label: 'အရေအတွက်', key: 'quantity', sortable: true },
    { label: 'ဝယ်ဈေး', key: 'cost', sortable: true },
    { label: 'ရောင်းဈေး', key: 'price', sortable: true },
    { label: 'အခြေအနေ', sortable: false },
    { label: 'လုပ်ဆောင်ချက်', sortable: false },
  ];
  
  const handleExportCSV = () => {
    if (displayProducts.length === 0) return;

    const csvHeaders = [
      "Code", "Product Name", "Category", "Supplier", "Quantity", "Unit",
      "Cost (Kyat)", "Price (Kyat)", "Reorder Level", "Status", "Barcode"
    ];

    const escapeCSV = (str: string | number | undefined) => `"${String(str || '').replace(/"/g, '""')}"`;

    const csvRows = displayProducts.map(p => {
        const status = p.quantity <= p.reorder_level ? 'Low Stock' : 'In Stock';
        return [
            escapeCSV(p.product_code),
            escapeCSV(p.product_name),
            escapeCSV(p.category),
            escapeCSV(p.supplier),
            p.quantity,
            escapeCSV(p.unit),
            p.cost,
            p.price,
            p.reorder_level,
            escapeCSV(status),
            escapeCSV(p.barcode)
        ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const exportDate = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `inventory_${exportDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">📦 ကုန်ပစ္စည်းစာရင်း</h2>
            <p className="hidden md:block text-gray-600 dark:text-gray-400">ကုန်ပစ္စည်းများကို ထည့်သွင်း၊ ပြင်ဆင်၊ ဖျက်ပါ</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={products.length === 0}
              className="px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <span className="text-lg">📄</span>
              <span className="hidden md:inline">Export to CSV</span>
            </button>
            {currentUserRole === 'Admin' && (
              <button
                onClick={() => openModal(null)}
                className="px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
              >
                ➕ ကုန်ပစ္စည်းအသစ်
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="စုစုပေါင်းပစ္စည်း" value={products.length.toString()} color="purple" />
          <StatCard title="နည်းနေသော" value={lowStock.length.toString()} color="pink" />
          <StatCard title="စုစုပေါင်းတန်ဖိုး" value={`${totalValue.toLocaleString()}`} unit="ကျပ်" color="blue" />
          <StatCard title="အမျိုးအစား" value={categories.toString()} color="green" />
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 ကုန်ပစ္စည်းရှာရန် (အမည်၊ ကုဒ်၊ အမျိုးအစား၊ ဘားကုဒ်)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full max-w-lg px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-shadow focus:shadow-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Desktop Table */}
        <div className="rounded-xl shadow-md overflow-hidden bg-white dark:bg-gray-800 hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {headers.map(header => (
                      <th key={header.label} className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {header.sortable ? (
                            <button onClick={() => requestSort(header.key!)} className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-white transition-colors">
                                {header.label}
                                <span className="text-xs w-3">{getSortIndicator(header.key!)}</span>
                            </button>
                          ) : (
                            header.label
                          )}
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody className="dark:text-gray-200">
                {displayProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="text-5xl mb-3">📦</div>
                      <div className="text-lg">{searchQuery ? 'ရှာဖွေမှုနှင့် ကိုက်ညီမှုမရှိပါ' : 'ကုန်ပစ္စည်းမရှိသေးပါ'}</div>
                    </td>
                  </tr>
                ) : (
                  displayProducts.map(p => {
                    const supplier = suppliers.find(s => s.supplier_name === p.supplier);
                    return (
                      <tr key={p.__backendId} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.product_code || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">{p.product_name}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.category}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {supplier ? (
                            <div>
                              <div className="font-semibold">{supplier.supplier_name}</div>
                              <div className="text-xs">{supplier.supplier_phone}</div>
                            </div>
                          ) : (p.supplier || '-')}
                        </td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{p.quantity} {p.unit || 'ခု'}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.cost.toLocaleString()} ကျပ်</td>
                        <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">{p.price.toLocaleString()} ကျပ်</td>
                        <td className="px-6 py-4">
                          <Badge color={p.quantity <= p.reorder_level ? 'danger' : 'success'}>
                            {p.quantity <= p.reorder_level ? 'နည်းနေသည်' : 'ပုံမှန်'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                            <button onClick={() => openPriceHistoryModal(p)} className="p-2 rounded text-white mr-2 bg-blue-500 hover:bg-blue-600" title="Price History">📜</button>
                          {currentUserRole === 'Admin' && (
                            <>
                              <button onClick={() => openModal(p)} className="p-2 rounded text-white mr-2 bg-yellow-500 hover:bg-yellow-600" title="Edit">✏️</button>
                              <button onClick={() => deleteProduct(p)} className="p-2 rounded text-white bg-red-500 hover:bg-red-600" title="Delete">🗑️</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {displayProducts.length === 0 ? (
             <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-5xl mb-3">📦</div>
                <div className="text-lg">{searchQuery ? 'ရှာဖွေမှုနှင့် ကိုက်ညီမှုမရှိပါ' : 'ကုန်ပစ္စည်းမရှိသေးပါ'}</div>
              </div>
          ) : (
            displayProducts.map(p => {
              const supplier = suppliers.find(s => s.supplier_name === p.supplier);
              return (
                <div key={p.__backendId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-100">{p.product_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{p.product_code} / {p.category}</div>
                      {supplier && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">🏭 {supplier.supplier_name} ({supplier.supplier_phone})</div>
                      )}
                    </div>
                    <Badge color={p.quantity <= p.reorder_level ? 'danger' : 'success'}>
                      {p.quantity <= p.reorder_level ? 'နည်းနေသည်' : 'ပုံမှန်'}
                    </Badge>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">လက်ကျန်:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{p.quantity} {p.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">ဝယ်ဈေး:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{p.cost.toLocaleString()} ကျပ်</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">ရောင်းဈေး:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{p.price.toLocaleString()} ကျပ်</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openPriceHistoryModal(p)} className="flex-1 py-2 text-sm rounded text-white bg-blue-500 hover:bg-blue-600">📜 History</button>
                    {currentUserRole === 'Admin' && (
                      <>
                        <button onClick={() => openModal(p)} className="flex-1 py-2 text-sm rounded text-white bg-yellow-500 hover:bg-yellow-600">✏️ ပြင်ဆင်</button>
                        <button onClick={() => deleteProduct(p)} className="flex-1 py-2 text-sm rounded text-white bg-red-500 hover:bg-red-600">🗑️ ဖျက်</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};