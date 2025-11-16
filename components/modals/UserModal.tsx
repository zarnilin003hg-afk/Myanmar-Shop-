import React, { useState } from 'react';
import type { User, UserRole } from '../../types';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
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
      const dataToSave: User = { 
        ...user, 
        username: formData.username,
        role: formData.role,
        updated_at: new Date().toISOString()
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
      const newUser: User = {
        __backendId: `temp_${Date.now()}`, // temp id
        id: `user_${Date.now()}`,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        module: 'users',
        type: 'user',
        created_at: new Date().toISOString(),
      };
      onSave(newUser);
    }
  };

  const inputStyle = "w-full px-4 py-2 border rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600";
  const labelStyle = "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300";


  return (
    <div>
        <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{isEdit ? 'အသုံးပြုသူ ပြင်ဆင်ရန်' : 'အသုံးပြုသူအသစ်ထည့်ရန်'}</h3>
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={labelStyle}>အသုံးပြုသူအမည်</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputStyle} />
            </div>
            <div className="mb-4">
              <label className={labelStyle}>စကားဝှက်</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEdit ? 'မပြောင်းလိုပါက လွှတ်ထားပါ' : ''} required={!isEdit} className={inputStyle} />
            </div>
            <div className="mb-6">
              <label className={labelStyle}>ရာထူး</label>
              <select name="role" value={formData.role} onChange={handleChange} className={`${inputStyle} bg-white dark:bg-gray-700`}>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Analyst">Analyst</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600">
                {isEdit ? '✓ သိမ်းဆည်းမည်' : '➕ ထည့်မည်'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                ပယ်ဖျက်မည်
              </button>
            </div>
        </form>
    </div>
  );
};