
import React, { useState } from 'react';
import type { Settings, User, UserRole } from '../../types';

interface SettingsViewProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  // New props for user management
  users: User[];
  currentUser: User;
  openUserModal: (user: User | null) => void;
  deleteUser: (user: User) => void;
  currentUserRole: UserRole;
}

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl shadow-md p-6 bg-white">
        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-3">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingsInput: React.FC<{
  label: string;
  name: keyof Settings;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
        <input
            id={name}
            name={name}
            type="text"
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition"
        />
    </div>
);


export const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, setSettings, taxRate, setTaxRate, addToast,
    users, currentUser, openUserModal, deleteUser, currentUserRole
}) => {

    const [localSettings, setLocalSettings] = useState(settings);
    const [localTaxRate, setLocalTaxRate] = useState(taxRate);

    if (currentUserRole !== 'Admin') {
        return (
            <div className="h-full flex items-center justify-center text-center text-gray-500 p-6">
                <div>
                    <div className="text-6xl mb-4">🚫</div>
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p>You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }
    
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            setLocalTaxRate(val / 100);
        }
    };
    
    const handleSave = () => {
        setSettings(localSettings);
        setTaxRate(localTaxRate);
        addToast('ချိန်ညှိချက်များ သိမ်းဆည်းပြီးပါပြီ', 'success');
    };


  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">⚙️ ချိန်ညှိချက်များ</h2>
          <p className="text-gray-600">စနစ်တစ်ခုလုံးအတွက် အထွေထွေချိန်ညှိချက်များကို စီမံခန့်ခွဲပါ</p>
        </div>
        
        <div className="space-y-6">
            <SettingsCard title="🏪 ဆိုင်အချက်အလက်">
                <SettingsInput label="ဆိုင်အမည်" name="storeName" value={localSettings.storeName} onChange={handleSettingsChange} />
                <SettingsInput label="လိပ်စာ" name="storeAddress" value={localSettings.storeAddress} onChange={handleSettingsChange} />
                <SettingsInput label="ဖုန်းနံပါတ်" name="storePhone" value={localSettings.storePhone} onChange={handleSettingsChange} />
            </SettingsCard>

            <SettingsCard title="💰 ဘဏ္ဍာရေး">
                <div>
                    <label htmlFor="tax-rate-input" className="block text-sm font-semibold mb-2 text-gray-700">အခွန် (%)</label>
                    <input
                        id="tax-rate-input"
                        type="number"
                        value={(localTaxRate * 100).toFixed(0)}
                        onChange={handleTaxChange}
                        className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </SettingsCard>
            
            <SettingsCard title="🧾 ဘောင်ချာ">
                <SettingsInput label="ဘောင်ချာအောက်ခြေစာသား" name="receiptFooter" value={localSettings.receiptFooter} onChange={handleSettingsChange} />
            </SettingsCard>

            <SettingsCard title="👥 အသုံးပြုသူ စီမံခန့်ခွဲမှု">
                <button
                    onClick={() => openUserModal(null)}
                    className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors mb-4"
                >
                    ➕ အသုံးပြုသူအသစ်ထည့်ရန်
                </button>
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.__backendId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div>
                                <div className="font-semibold text-gray-800">{user.username}</div>
                                <div className="text-sm text-gray-500">{user.role}</div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => openUserModal(user)}
                                    className="p-2 rounded text-white bg-yellow-500 hover:bg-yellow-600"
                                >
                                    ✏️
                                </button>
                                <button 
                                    onClick={() => deleteUser(user)} 
                                    disabled={user.__backendId === currentUser.__backendId}
                                    className="p-2 rounded text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    title={user.__backendId === currentUser.__backendId ? 'ကိုယ့်အကောင့်ကို ဖျက်၍မရပါ' : 'Delete'}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </SettingsCard>
        </div>
        
        <div className="mt-8">
            <button
              onClick={handleSave}
              className="w-full px-6 py-4 rounded-lg font-bold text-white text-lg shadow-lg transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
            >
              ✓ ပြောင်းလဲမှုများ သိမ်းဆည်းမည်
            </button>
        </div>

      </div>
    </div>
  );
};