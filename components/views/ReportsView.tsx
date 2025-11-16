
import React from 'react';
import type { Transaction, Product } from '../../types';
import { StatCard } from '../shared/StatCard';

interface ReportsViewProps {
  transactions: Transaction[];
  products: Product[];
}

const SalesChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const salesByDay = last7Days.map(date => {
    const dayTrans = transactions.filter(t => t.transaction_date.startsWith(date));
    return dayTrans.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  });

  const maxSale = Math.max(...salesByDay, 1);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (transactions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div>
          <div className="text-4xl mb-2">📊</div>
          <div>ဒေတာမရှိသေးပါ</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 flex items-end justify-around gap-2">
      {salesByDay.map((sale, index) => {
        const height = `${(sale / maxSale) * 100}%`;
        const dayName = dayNames[new Date(last7Days[index]).getUTCDay()];
        return (
          <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="text-xs font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {sale.toLocaleString()}
            </div>
            <div
              className="w-full bg-blue-400 rounded-t hover:bg-blue-500 transition-colors"
              style={{ height: height }}
              title={`${last7Days[index]}: ${sale.toLocaleString()} ကျပ်`}
            />
            <span className="text-xs text-gray-600">{dayName}</span>
          </div>
        );
      })}
    </div>
  );
};

const TopProducts: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

  // Only consider 'sale' transactions for top products
  transactions.filter(t => t.type === 'sale').forEach(t => {
    const items: { product_code: string; product_name: string; quantity: number; subtotal: number }[] = JSON.parse(t.items);
    items.forEach(item => {
      const existing = productSales.get(item.product_code) || { name: item.product_name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.subtotal;
      productSales.set(item.product_code, existing);
    });
  });

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (topProducts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🏆</div>
        <div>ဒေတာမရှိသေးပါ</div>
      </div>
    );
  }
  
  const icons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  return (
    <div className="space-y-3">
      {topProducts.map((product, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <div className="text-2xl">{icons[index]}</div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800">{product.name}</div>
            <div className="text-sm text-gray-600">{product.quantity} ခု ရောင်းချပြီး</div>
          </div>
          <div className="font-bold text-green-600">{product.revenue.toLocaleString()} ကျပ်</div>
        </div>
      ))}
    </div>
  );
};

const PaymentMethodsChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const paymentMethods: Record<string, { count: number, amount: number }> = {};
    transactions.forEach(t => {
      // Exclude returns from payment method summary
      if (t.type === 'return') return;
      
      const method = t.payment_method || 'အခြား';
      if (!paymentMethods[method]) paymentMethods[method] = { count: 0, amount: 0 };
      paymentMethods[method].count++;
      paymentMethods[method].amount += t.total_amount;
    });

    if (Object.keys(paymentMethods).length === 0) {
        return (
            <div className="col-span-full text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💳</div>
                <div>ဒေတာမရှိသေးပါ</div>
            </div>
        );
    }
    
    const icons: Record<string, string> = { 'ငွေသား': '💵', 'ကတ်': '💳', 'မိုဘိုင်းငွေ': '📱', 'ဘဏ်လွှဲ': '🏦' };
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(paymentMethods).map(([method, data]) => (
                <div key={method} className="rounded-lg shadow p-4 bg-white text-center transition-shadow hover:shadow-lg">
                    <div className="text-3xl mb-2">{icons[method] || '💰'}</div>
                    <div className="font-semibold mb-1 text-gray-800">{method}</div>
                    <div className="text-sm mb-1 text-gray-600">{data.count} ကြိမ်</div>
                    <div className="font-bold text-blue-600">{data.amount.toLocaleString()} ကျပ်</div>
                </div>
            ))}
        </div>
    );
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, products }) => {
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  
  let totalCost = 0;
  transactions.forEach(t => {
    const items: { product_code: string; quantity: number }[] = JSON.parse(t.items);
    const transactionCogs = items.reduce((sum, item) => {
        const product = products.find(p => p.product_code === item.product_code);
        return sum + (product ? (product.cost || 0) * item.quantity : 0);
    }, 0);
    
    if (t.type === 'return') {
        // When items are returned and restocked, the cost of goods is effectively credited back.
        totalCost -= transactionCogs;
    } else {
        totalCost += transactionCogs;
    }
  });
  
  const totalProfit = totalRevenue - totalCost;

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">📈 အစီရင်ခံစာနှင့် ခွဲခြမ်းစိတ်ဖြာချက်</h2>
          <p className="text-gray-600">လုပ်ငန်းစွမ်းဆောင်ရည် ခြုံငုံသုံးသပ်ချက်</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard title="စုစုပေါင်းဝင်ငွေ" value={`${totalRevenue.toLocaleString()} ကျပ်`} color="purple" note="အားလုံး" />
          <StatCard title="စုစုပေါင်းအမြတ်" value={`${totalProfit.toLocaleString()} ကျပ်`} color="pink" note="ခန့်မှန်း" />
          <StatCard title="စုစုပေါင်းအရောင်း" value={transactions.filter(t => t.type === 'sale').length.toString()} color="blue" note="Transactions" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl shadow-md p-6 bg-white">
            <h3 className="text-lg font-bold mb-4 text-gray-800">လတ်တလောအရောင်း (7 ရက်)</h3>
            <SalesChart transactions={transactions} />
          </div>
          <div className="rounded-xl shadow-md p-6 bg-white">
            <h3 className="text-lg font-bold mb-4 text-gray-800">လူကြိုက်များသော ကုန်ပစ္စည်း (Top 5)</h3>
            <TopProducts transactions={transactions} />
          </div>
        </div>

        <div className="rounded-xl shadow-md p-6 bg-white">
          <h3 className="text-lg font-bold mb-4 text-gray-800">ငွေပေးချေမှုနည်းလမ်းများ</h3>
          <PaymentMethodsChart transactions={transactions} />
        </div>
      </div>
    </div>
  );
};