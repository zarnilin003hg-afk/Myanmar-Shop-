
import React, { useState } from 'react';
import type { Settings, User, UserRole } from '../../types';

interface SettingsViewProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  users: User[];
  currentUser: User;
  openUserModal: (user: User | null) => void;
  deleteUser: (user: User) => void;
  currentUserRole: UserRole;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl shadow-md p-6 bg-white dark:bg-gray-800">
        <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200 border-b dark:border-gray-600 pb-3">{title}</h3>
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
        <label htmlFor={name} className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{label}</label>
        <input
            id={name}
            name={name}
            type="text"
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 border rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition"
        />
    </div>
);

const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void; }> = ({ theme, setTheme }) => {
    const isDark = theme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Theme</label>
            <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <span className="sr-only">Toggle Theme</span>
                <span className={`absolute left-1 transition-transform ${isDark ? 'translate-x-8' : 'translate-x-0'}`}>
                    {isDark ? '🌙' : '☀️'}
                </span>
                <span
                    className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform ${isDark ? 'translate-x-9' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
};


export const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, setSettings, taxRate, setTaxRate, addToast,
    users, currentUser, openUserModal, deleteUser, currentUserRole,
    theme, setTheme
}) => {

    const [localSettings, setLocalSettings] = useState(settings);
    const [localTaxRate, setLocalTaxRate] = useState(taxRate);

    if (currentUserRole !== 'Admin' && currentUserRole !== 'Manager') {
        return (
            <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 p-6">
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
    <div className="h-full overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">⚙️ ချိန်ညှိချက်များ</h2>
          <p className="text-gray-600 dark:text-gray-400">စနစ်တစ်ခုလုံးအတွက် အထွေထွေချိန်ညှိချက်များကို စီမံခန့်ခွဲပါ</p>
        </div>
        
        <div className="space-y-6">
            <SettingsCard title="🖥️ Display">
                <ThemeToggle theme={theme} setTheme={setTheme} />
            </SettingsCard>
            <SettingsCard title="🏪 ဆိုင်အချက်အလက်">
                <SettingsInput label="ဆိုင်အမည်" name="storeName" value={localSettings.storeName} onChange={handleSettingsChange} />
                <SettingsInput label="လိပ်စာ" name="storeAddress" value={localSettings.storeAddress} onChange={handleSettingsChange} />
                <SettingsInput label="ဖုန်းနံပါတ်" name="storePhone" value={localSettings.storePhone} onChange={handleSettingsChange} />
            </SettingsCard>

            <SettingsCard title="💰 ဘဏ္ဍာရေး">
                <div>
                    <label htmlFor="tax-rate-input" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">အခွန် (%)</label>
                    <input
                        id="tax-rate-input"
                        type="number"
                        value={(localTaxRate * 100).toFixed(0)}
                        onChange={handleTaxChange}
                        className="w-full px-4 py-2 border rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </SettingsCard>
            
            <SettingsCard title="🧾 ဘောင်ချာ">
                <SettingsInput label="ဘောင်ချာအောက်ခြေစာသား" name="receiptFooter" value={localSettings.receiptFooter} onChange={handleSettingsChange} />
            </SettingsCard>

            {currentUserRole === 'Admin' && (
              <SettingsCard title="👥 အသုံးပြုသူ စီမံခန့်ခွဲမှု">
                  <button
                      onClick={() => openUserModal(null)}
                      className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors mb-4"
                  >
                      ➕ အသုံးပြုသူအသစ်ထည့်ရန်
                  </button>
                  <div className="space-y-2">
                      {users.map(user => (
                          <div key={user.__backendId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                              <div>
                                  <div className="font-semibold text-gray-800 dark:text-gray-100">{user.username}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.role}</div>
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
            )}
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