
import React, { useState, useMemo, useEffect } from 'react';
import type { Customer, UserRole } from '../../types';
import { StatCard } from '../shared/StatCard';

interface CustomersViewProps {
  customers: Customer[];
  openModal: (customer: Customer | null) => void;
  deleteCustomer: (customer: Customer) => void;
  currentUserRole: UserRole;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, openModal, deleteCustomer, currentUserRole }) => {
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


  const newThisMonth = customers.filter(c => {
    const created = new Date(c.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const totalPurchases = customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
        return customers;
    }

    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(t => t);

    return customers.filter(c => {
        const searchableString = [
            c.customer_name,
            c.customer_phone,
            c.customer_email || ''
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableString.includes(term));
    });

  }, [customers, searchQuery]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800">👥 ဝယ်ယူသူများ</h2>
            <p className="hidden md:block text-gray-600">သင့်ဝယ်ယူသူများ၏ အချက်အလက်နှင့် သမိုင်း</p>
          </div>
          {currentUserRole === 'Admin' && (
            <button
              onClick={() => openModal(null)}
              className="px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
            >
              ➕ ဝယ်ယူသူအသစ်
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="စုစုပေါင်းဝယ်ယူသူ" value={customers.length.toString()} color="plain" titleColor="text-gray-600" valueColor="text-gray-800"/>
          <StatCard title="ဒီလအသစ်" value={newThisMonth.toString()} color="plain" titleColor="text-gray-600" valueColor="text-blue-500"/>
          <StatCard title="စုစုပေါင်းဝယ်ယူမှု" value={`${totalPurchases.toLocaleString()}`} unit="ကျပ်" color="plain" titleColor="text-gray-600" valueColor="text-green-500"/>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 ဝယ်ယူသူရှာရန် (အမည်၊ ဖုန်း၊ အီးမေးလ်)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full max-w-lg px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-shadow focus:shadow-lg"
          />
        </div>

        {/* Desktop Table */}
        <div className="rounded-xl shadow-md overflow-hidden bg-white hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['အမည်', 'ဖုန်း', 'အီးမေးလ်', 'စုစုပေါင်းဝယ်ယူမှု', 'အမှတ်များ', 'နောက်ဆုံးဝယ်ယူ', currentUserRole === 'Admin' && 'လုပ်ဆောင်ချက်']
                    .filter(Boolean)
                    .map(h => (
                    <th key={h as string} className="px-6 py-3 text-left text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={currentUserRole === 'Admin' ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-5xl mb-3">👥</div>
                      <div className="text-lg">{searchQuery ? 'ရှာဖွေမှုနှင့် ကိုက်ညီမှုမရှိပါ' : 'ဝယ်ယူသူမရှိသေးပါ'}</div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => (
                    <tr key={c.__backendId} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-800">{c.customer_name}</td>
                      <td className="px-6 py-4 text-gray-600">{c.customer_phone}</td>
                      <td className="px-6 py-4 text-gray-600">{c.customer_email || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">{(c.total_purchases || 0).toLocaleString()} ကျပ်</td>
                      <td className="px-6 py-4 font-bold text-blue-600">{c.loyalty_points || 0}</td>
                      <td className="px-6 py-4 text-gray-600">{c.last_purchase ? new Date(c.last_purchase).toLocaleDateString('my-MM') : '-'}</td>
                      {currentUserRole === 'Admin' && (
                        <td className="px-6 py-4">
                          <button onClick={() => openModal(c)} className="p-2 rounded text-white mr-2 bg-yellow-500 hover:bg-yellow-600">✏️</button>
                          <button onClick={() => deleteCustomer(c)} className="p-2 rounded text-white bg-red-500 hover:bg-red-600">🗑️</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredCustomers.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500 bg-white rounded-lg shadow">
                <div className="text-5xl mb-3">👥</div>
                <div className="text-lg">{searchQuery ? 'ရှာဖွေမှုနှင့် ကိုက်ညီမှုမရှိပါ' : 'ဝယ်ယူသူမရှိသေးပါ'}</div>
              </div>
          ) : (
            filteredCustomers.map(c => (
              <div key={c.__backendId} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-800">{c.customer_name}</div>
                    <div className="text-sm text-gray-500">{c.customer_phone}</div>
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">စုစုပေါင်းဝယ်ယူမှု:</span>
                    <span className="font-semibold text-green-600">{(c.total_purchases || 0).toLocaleString()} ကျပ်</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">အမှတ်:</span>
                    <span className="font-bold text-blue-600">{c.loyalty_points || 0}</span>
                  </div>
                </div>
                {currentUserRole === 'Admin' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openModal(c)} className="flex-1 py-2 text-sm rounded text-white bg-yellow-500 hover:bg-yellow-600">✏️ ပြင်ဆင်</button>
                    <button onClick={() => deleteCustomer(c)} className="flex-1 py-2 text-sm rounded text-white bg-red-500 hover:bg-red-600">🗑️ ဖျက်</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
