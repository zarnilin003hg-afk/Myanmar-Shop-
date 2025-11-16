
import type { Tab } from './types';

interface TabConfig {
  id: Tab;
  label: string;
  icon: string;
}

export const TABS: TabConfig[] = [
  { id: 'pos', label: 'အမြန်ရောင်းချရေး (POS)', icon: '🛒' },
  { id: 'inventory', label: 'ကုန်ပစ္စည်းစာရင်း', icon: '📦' },
  { id: 'customers', label: 'ဝယ်ယူသူများ', icon: '👥' },
  { id: 'transactions', label: 'အရောင်းမှတ်တမ်း', icon: '📊' },
  { id: 'reports', label: 'အစီရင်ခံစာ', icon: '📈' },
  { id: 'finance', label: 'ဘဏ္ဍာရေး', icon: '💰' },
  { id: 'suppliers', label: 'ကုန်ပစ္စည်းပေးသွင်းသူများ', icon: '🏭' },
  { id: 'settings', label: 'ချိန်ညှိချက်များ', icon: '⚙️' },
];