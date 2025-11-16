
import React, { useMemo } from 'react';
import type { Transaction, Product } from '../../types';
import { StatCard } from '../shared/StatCard';

interface FinanceViewProps {
  transactions: Transaction[];
  products: Product[];
}

const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const isThisWeek = (date: Date) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
};

const isThisMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const calculateMetrics = (transactions: Transaction[], products: Product[]) => {
    let revenue = 0;
    let cogs = 0;
    
    transactions.forEach(t => {
        // total_amount is negative for returns, so it correctly subtracts from revenue
        revenue += t.total_amount; 
        
        const items: { product_code: string; quantity: number }[] = JSON.parse(t.items);
        
        const transactionCogs = items.reduce((sum, item) => {
            const product = products.find(p => p.product_code === item.product_code);
            return sum + (product ? (product.cost || 0) * item.quantity : 0);
        }, 0);

        if (t.type === 'return') {
            cogs -= transactionCogs; // Subtract cost of goods returned
        } else {
            cogs += transactionCogs; // Add cost of goods sold
        }
    });

    const profit = revenue - cogs;
    return { revenue, cogs, profit };
};

export const FinanceView: React.FC<FinanceViewProps> = ({ transactions, products }) => {

    const financialData = useMemo(() => {
        const totalTax = transactions.reduce((sum, t) => sum + t.tax, 0); // Note: returns have 0 tax
        const { revenue: totalRevenue, cogs: totalCogs, profit: totalProfit } = calculateMetrics(transactions, products);

        const todayTx = transactions.filter(t => isToday(new Date(t.transaction_date)));
        const weekTx = transactions.filter(t => isThisWeek(new Date(t.transaction_date)));
        const monthTx = transactions.filter(t => isThisMonth(new Date(t.transaction_date)));

        const todayMetrics = calculateMetrics(todayTx, products);
        const weekMetrics = calculateMetrics(weekTx, products);
        const monthMetrics = calculateMetrics(monthTx, products);
        
        const paymentMethods: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.type === 'return') return;
            const method = t.payment_method || 'အခြား';
            paymentMethods[method] = (paymentMethods[method] || 0) + t.total_amount;
        });

        return {
            totalRevenue,
            totalCogs,
            totalProfit,
            totalTax,
            profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
            periods: [
                { label: 'ယနေ့', ...todayMetrics },
                { label: 'ယခုအပတ်', ...weekMetrics },
                { label: 'ယခုလ', ...monthMetrics },
            ],
            paymentMethods,
        };
    }, [transactions, products]);

    const { totalRevenue, totalCogs, totalProfit, profitMargin, totalTax, periods, paymentMethods } = financialData;

    return (
        <div className="h-full overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold mb-2 text-gray-800">💰 ဘဏ္ဍာရေး ခြုံငုံသုံးသပ်ချက်</h2>
                    <p className="text-gray-600">သင့်လုပ်ငန်း၏ ငွေကြေးဆိုင်ရာ စွမ်းဆောင်ရည်ကို ကြည့်ရှုပါ</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard title="စုစုပေါင်းဝင်ငွေ" value={`${totalRevenue.toLocaleString()} ကျပ်`} color="green" />
                    <StatCard title="စုစုပေါင်းအမြတ်" value={`${totalProfit.toLocaleString()} ကျပ်`} color="blue" />
                    <StatCard title="အမြတ် ရာခိုင်နှုန်း" value={`${profitMargin.toFixed(2)}%`} color="purple" />
                    <StatCard title="စုစုပေါင်းအခွန်" value={`${totalTax.toLocaleString()} ကျပ်`} color="pink" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl shadow-md p-6 bg-white">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">အရှုံးအမြတ် ရှင်းတမ်း</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 text-sm font-semibold text-gray-600">ကာလ</th>
                                        <th className="py-2 text-sm font-semibold text-gray-600 text-right">ဝင်ငွေ</th>
                                        <th className="py-2 text-sm font-semibold text-gray-600 text-right">ရောင်းကုန်ကျစရိတ်</th>
                                        <th className="py-2 text-sm font-semibold text-gray-600 text-right">စုစုပေါင်းအမြတ်</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.map(p => (
                                        <tr key={p.label} className="border-b last:border-none">
                                            <td className="py-3 font-semibold text-gray-800">{p.label}</td>
                                            <td className="py-3 text-right text-green-600">{p.revenue.toLocaleString()}</td>
                                            <td className="py-3 text-right text-red-600">{p.cogs.toLocaleString()}</td>
                                            <td className="py-3 text-right font-bold text-blue-600">{p.profit.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-b last:border-none bg-gray-50 font-bold">
                                        <td className="py-3 text-gray-800">စုစုပေါင်း</td>
                                        <td className="py-3 text-right text-green-700">{totalRevenue.toLocaleString()}</td>
                                        <td className="py-3 text-right text-red-700">{totalCogs.toLocaleString()}</td>
                                        <td className="py-3 text-right text-blue-700">{totalProfit.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-xl shadow-md p-6 bg-white">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">ငွေပေးချေမှုအလိုက် ဝင်ငွေ</h3>
                        <div className="space-y-3">
                            {Object.entries(paymentMethods).length > 0 ? (
                                Object.entries(paymentMethods).map(([method, amount]) => (
                                    <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                        <span className="font-semibold text-gray-700">{method}</span>
                                        <span className="font-bold text-gray-800">{amount.toLocaleString()} ကျပ်</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">ဒေတာမရှိသေးပါ</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
