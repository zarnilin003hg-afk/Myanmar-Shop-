
import React, { useState } from 'react';
import type { User, UserRole } from '../../types';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: User | Omit<User, '__backendId' | 'id' | 'created_at'>) => void;
}

export const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    role: user?.role || 'Cashier' as UserRole,
  });
  
  const isEdit = user !== null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && user) {
      const dataToSave: User = { ...user, 
        username: formData.username,
        role: formData.role
      };
      // Only include password if it has been changed
      if (formData.password) {
          dataToSave.password = formData.password;
      }
      onSave(dataToSave);
    } else {
      if (!formData.password) {
        // This is a basic validation. In a real app, use a toast or inline error.
        alert('Password is required for a new user.');
        return;
      }
      const newUser: Omit<User, '__backendId' | 'id' | 'created_at'> = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        module: 'users',
        type: 'user',
      };
      onSave(newUser);
    }
  };

  return (
    <div style={{maxWidth: '500px', width: '100%'}}>
        <h3 className="text-2xl font-bold mb-6 text-gray-800">{isEdit ? 'အသုံးပြုသူ ပြင်ဆင်ရန်' : 'အသုံးပြုသူအသစ်ထည့်ရန်'}</h3>
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700">အသုံးပြုသူအမည်</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700">စကားဝှက်</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEdit ? 'မပြောင်းလိုပါက လွှတ်ထားပါ' : ''} required={!isEdit} className="w-full px-4 py-2 border rounded-lg border-gray-300" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">ရာထူး</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg border-gray-300 bg-white">
                  <option value="Admin">Admin</option>
                  <option value="Cashier">Cashier</option>
              </select>
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
  );
};
