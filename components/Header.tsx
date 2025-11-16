
import React from 'react';
import type { Tab, Transaction, UserRole } from '../types';

interface HeaderProps {
  storeName: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  tabs: { id: Tab; label: string; icon: string }[];
  transactions: Transaction[];
  userRole: UserRole;
  onLogout: () => void;
}

const StatDisplay: React.FC<{ label: string; value: string }> = React.memo(({ label, value }) => (
  <div className="text-right">
    <div className="text-sm opacity-90">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
));

const TabButton: React.FC<{
  tab: { id: Tab; label: string; icon: string };
  isActive: boolean;
  onClick: () => void;
}> = React.memo(({ tab, isActive, onClick }) => (
  <button
    role="tab"
    aria-selected={isActive}
    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ease-in-out whitespace-nowrap ${
      isActive
        ? 'bg-white/20 ring-2 ring-white/50 shadow-lg'
        : 'hover:bg-white/10'
    }`}
    onClick={onClick}
  >
    {tab.icon} {tab.label}
  </button>
));

export const Header: React.FC<HeaderProps> = ({ storeName, activeTab, setActiveTab, tabs, transactions, userRole, onLogout }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTrans = transactions.filter(t => t.transaction_date.startsWith(today));
  const todaySales = todayTrans.reduce((sum, t) => sum + (t.total_amount || 0), 0);

  return (
    <header className="shadow-md text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl">🏪</div>
          <div>
            <h1 className="text-2xl font-bold">{storeName}</h1>
            <p className="text-sm opacity-90">POS & Inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <StatDisplay label="ယနေ့ရောင်းအား" value={`${todaySales.toLocaleString()} ကျပ်`} />
            <StatDisplay label="ယနေ့အရောင်း" value={todayTrans.length.toString()} />
          </div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20">
               <span className="text-2xl">👤</span>
             </div>
             <div>
                <div className="font-bold">{userRole}</div>
                <button 
                    onClick={onLogout}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity hover:underline"
                >
                    ထွက်မည်
                </button>
             </div>
          </div>
        </div>
      </div>
      <div
        role="tablist"
        aria-label="Main navigation tabs"
        className="px-4 sm:px-6 pb-4 flex gap-3 overflow-x-auto"
      >
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>
    </header>
  );
};
