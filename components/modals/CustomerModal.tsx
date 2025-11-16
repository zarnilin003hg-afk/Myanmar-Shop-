
import React, { useState } from 'react';
import type { Customer } from '../../types';

interface CustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer | Omit<Customer, '__backendId'>) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customer_name: customer?.customer_name || '',
    customer_phone: customer?.customer_phone || '',
    customer_email: customer?.customer_email || '',
    customer_address: customer?.customer_address || '',
  });
  
  const isEdit = customer !== null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && customer) {
      onSave({ ...customer, ...formData });
    } else {
      const newCustomer: Omit<Customer, '__backendId'> = {
        ...formData,
        id: `cust_${Date.now()}`,
        module: 'customers',
        type: 'customer',
        created_at: new Date().toISOString(),
        total_purchases: 0,
      };
      onSave(newCustomer);
    }
  };

  return (
    <div>
        <h3 className="text-2xl font-bold mb-6 text-gray-800">{isEdit ? 'ဝယ်ယူသူပြင်ဆင်ရန်' : 'ဝယ်ယူသူအသစ်ထည့်ရန်'}</h3>
        <form onSubmit={handleSubmit}>
            {isEdit && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-green-50 text-center border border-green-200">
                        <div className="text-sm font-semibold text-green-800 mb-1">
                            💰 စုစုပေါင်းဝယ်ယူမှု
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                            {(customer?.total_purchases || 0).toLocaleString()} ကျပ်
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 text-center border border-blue-200">
                        <div className="text-sm font-semibold text-blue-800 mb-1">
                            🌟 လက်ရှိအမှတ်များ
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                            {customer?.loyalty_points || 0}
                        </div>
                    </div>
                </div>
            )}
            <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">အမည်</label>
            <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">ဖုန်းနံပါတ်</label>
                <input type="tel" name="customer_phone" value={formData.customer_phone} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">အီးမေးလ်</label>
                <input type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            </div>
            <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700">လိပ်စာ</label>
            <textarea name="customer_address" value={formData.customer_address} onChange={handleChange} rows={2} className="w-full px-4 py-2 border rounded-lg border-gray-300"></textarea>
            </div>
            <div className="flex gap-3">
            <button type="submit" className="flex-1 px-6 py-3 rounded-lg font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                {isEdit ? '✓ သိမ်းဆည်းမည်' : '➕ ထည့်မည်'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300">
                ပယ်ဖျက်မည်
            </button>
            </div>
        </form>
    </div>
  );
};
