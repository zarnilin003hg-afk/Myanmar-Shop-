
import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, Customer, Product } from '../../types';
import { StatCard } from '../shared/StatCard';
import { Badge } from '../shared/Badge';

const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const isThisWeek = (date: Date) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    firstDayOfWeek.setHours(0,0,0,0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23,59,59,999);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
};

const isThisMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

interface TransactionsViewProps {
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
  viewTransaction: (transaction: Transaction) => void;
  openReturnModal: (transaction: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, customers, products, viewTransaction, openReturnModal }) => {
  const [dateRange, setDateRange] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [customerId, setCustomerId] = useState('all');
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


  const uniquePaymentMethods = useMemo(() => ['all', ...new Set(transactions.map(t => t.payment_method))], [transactions]);

  const calculateProfit = (transaction: Transaction): number => {
    try {
      const items: { product_code: string; quantity: number }[] = JSON.parse(transaction.items);
      const cogs = items.reduce((sum, item) => {
        const product = products.find(p => p.product_code === item.product_code);
        return sum + (product ? product.cost * item.quantity : 0);
      }, 0);
      
      if (transaction.type === 'return') {
          // total_amount is negative. cogs is cost of goods returned to inventory.
          // Net effect on profit is cash outflow + asset inflow
          return transaction.total_amount + cogs;
      }
      
      // For sales, total_amount includes tax, so we subtract it for profit calculation
      const revenueAfterDiscount = transaction.total_amount - transaction.tax;
      return revenueAfterDiscount - cogs;
    } catch (e) {
      console.error("Error calculating profit", e);
      return 0;
    }
  };

  const filteredTransactions = useMemo(() => {
    let results = transactions.filter(t => {
      const txDate = new Date(t.transaction_date);
      if (dateRange === 'today' && !isToday(txDate)) return false;
      if (dateRange === 'week' && !isThisWeek(txDate)) return false;
      if (dateRange === 'month' && !isThisMonth(txDate)) return false;
      if (paymentMethod !== 'all' && t.payment_method !== paymentMethod) return false;
      if (customerId !== 'all' && t.customer_id !== customerId) return false;
      return true;
    });

    if (searchQuery.trim()) {
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(t => t);
        
        results = results.filter(t => {
            const customer = customers.find(c => c.__backendId === t.customer_id);
            const items: { product_name: string }[] = JSON.parse(t.items);

            const searchableContent = [
                t.transaction_id.toLowerCase(),
                customer?.customer_name.toLowerCase() || '',
                customer?.customer_phone || '',
                ...items.map(i => i.product_name.toLowerCase())
            ].join(' ');

            return searchTerms.every(term => searchableContent.includes(term));
        });
    }

    return results.slice().reverse();
  }, [transactions, dateRange, paymentMethod, customerId, searchQuery, customers]);

  const { totalAmount, totalProfit, totalTransactions } = useMemo(() => {
    let amount = 0;
    let profit = 0;
    filteredTransactions.forEach(t => {
      amount += t.total_amount;
      profit += calculateProfit(t);
    });
    return { totalAmount: amount, totalProfit: profit, totalTransactions: filteredTransactions.length };
  }, [filteredTransactions, products]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Transaction ID",
      "Type",
      "Date",
      "Customer",
      "Items Count",
      "Total Amount (Kyat)",
      "Profit (Kyat)",
      "Payment Method"
    ];

    const csvRows = filteredTransactions.map(t => {
        const customer = customers.find(c => c.__backendId === t.customer_id);
        const items = JSON.parse(t.items);
        const profit = calculateProfit(t);
        const date = new Date(t.transaction_date).toLocaleString('en-CA');

        const escapeCSV = (str: string | number) => `"${String(str).replace(/"/g, '""')}"`;

        return [
            t.transaction_id,
            t.type,
            escapeCSV(date),
            customer ? escapeCSV(customer.customer_name) : 'N/A',
            items.length,
            t.total_amount,
            profit,
            t.payment_method
        ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const exportDate = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `transactions_${exportDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const getFilterText = () => {
      const dateMap: { [key: string]: string } = {
          'all': 'All Time',
          'today': 'Today',
          'week': 'This Week',
          'month': 'This Month'
      };
      const customerName = customerId === 'all' ? 'All Customers' : customers.find(c => c.__backendId === customerId)?.customer_name || 'N/A';
      const paymentMethodText = paymentMethod === 'all' ? 'All Methods' : paymentMethod;
      return `Date: ${dateMap[dateRange]}, Customer: ${customerName}, Payment: ${paymentMethodText}`;
  };


  return (
    <>
      <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 no-print">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">📊 အရောင်းမှတ်တမ်း</h2>
              <p className="hidden md:block text-gray-600 dark:text-gray-400">အရောင်းအားလုံး၏ အသေးစိတ်မှတ်တမ်း</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={filteredTransactions.length === 0}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-transform hover:scale-105"
              >
                <span className="text-lg">🖨️</span>
                <span className="hidden md:inline">Print</span>
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-transform hover:scale-105"
              >
                <span className="text-lg">📄</span>
                <span className="hidden md:inline">CSV သို့ Export</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl shadow-md p-4 bg-white dark:bg-gray-800 mb-6">
              <h3 className="font-bold text-lg mb-3 text-gray-700 dark:text-gray-200">🔍 စစ်ထုတ်ရန်</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 block">အချိန်ကာလ</label>
                      <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                          <option value="all">အားလုံး</option>
                          <option value="today">ယနေ့</option>
                          <option value="week">ယခုအပတ်</option>
                          <option value="month">ယခုလ</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 block">ငွေပေးချေမှု</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                          {uniquePaymentMethods.map(method => <option key={method} value={method}>{method === 'all' ? 'အားလုံး' : method}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 block">ဝယ်ယူသူ</label>
                      <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                          <option value="all">အားလုံး</option>
                          {customers.map(c => <option key={c.__backendId} value={c.__backendId}>{c.customer_name}</option>)}
                      </select>
                  </div>
              </div>
              <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 block">အထွေထွေရှာဖွေရန်</label>
                  <input
                      type="text"
                      placeholder="Transaction ID, ဝယ်ယူသူ, ကုန်ပစ္စည်း..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                  />
              </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard title="အရောင်း" value={totalTransactions.toString()} color="plain" valueColor='text-gray-800 dark:text-gray-100' titleColor="dark:text-gray-400" />
              <StatCard title="စုစုပေါင်းဝင်ငွေ" value={`${totalAmount.toLocaleString()}`} unit="ကျပ်" color="plain" valueColor='text-green-600 dark:text-green-400' titleColor="dark:text-gray-400"/>
              <StatCard title="စုစုပေါင်းအမြတ်" value={`${totalProfit.toLocaleString()}`} unit="ကျပ်" color="plain" valueColor='text-blue-600 dark:text-blue-400' titleColor="dark:text-gray-400"/>
          </div>

          {/* Desktop Table */}
          <div className="rounded-xl shadow-md overflow-hidden bg-white dark:bg-gray-800 hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['ID', 'ရက်စွဲ', 'ဝယ်ယူသူ', 'ပစ္စည်း', 'စုစုပေါင်း', 'အမြတ်', 'ငွေပေးချေမှု', 'လုပ်ဆောင်ချက်'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="dark:text-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="text-5xl mb-3">📊</div>
                        <div className="text-lg">ရလဒ်နှင့်ကိုက်ညီသော အရောင်းမှတ်တမ်းမရှိပါ</div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(t => {
                      const items = JSON.parse(t.items);
                      const customer = customers.find(c => c.__backendId === t.customer_id);
                      const profit = calculateProfit(t);
                      return (
                        <tr key={t.__backendId} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-blue-600 dark:text-blue-400">{t.transaction_id}</div>
                            {t.type === 'return' ? <Badge color="warning">ပြန်သွင်း</Badge> : <Badge color="success">ရောင်း</Badge>}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(t.transaction_date).toLocaleDateString('my-MM')}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{customer?.customer_name || '-'}</td>
                          <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{items.length} ခု</td>
                          <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">{t.total_amount.toLocaleString()} ကျပ်</td>
                          <td className={`px-6 py-4 font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{profit.toLocaleString()} ကျပ်</td>
                          <td className="px-6 py-4"><Badge color="info">{t.payment_method}</Badge></td>
                          <td className="px-6 py-4">
                            <button onClick={() => viewTransaction(t)} className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 mr-2">👁️ ကြည့်ရန်</button>
                            {t.type === 'sale' && <button onClick={() => openReturnModal(t)} className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600">↩️ ပြန်သွင်း</button>}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
              {filteredTransactions.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="text-5xl mb-3">📊</div>
                      <div className="text-lg">ရလဒ်နှင့်ကိုက်ညီသော အရောင်းမှတ်တမ်းမရှိပါ</div>
                  </div>
              ) : (
                  filteredTransactions.map(t => {
                      const customer = customers.find(c => c.__backendId === t.customer_id);
                      const profit = calculateProfit(t);
                      return (
                          <div key={t.__backendId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <div className="font-bold text-blue-600 dark:text-blue-400">{t.transaction_id}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.transaction_date).toLocaleString('my-MM')}</div>
                                      {t.type === 'return' ? <Badge color="warning">ပြန်သွင်း</Badge> : <Badge color="success">ရောင်း</Badge>}
                                  </div>
                                  <Badge color="info">{t.payment_method}</Badge>
                              </div>
                              <div className="border-t dark:border-gray-700 my-2"></div>
                              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{customer?.customer_name || 'ဝယ်ယူသူမပါ'}</div>
                              <div className="flex justify-between items-center mb-3">
                                  <div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">စုစုပေါင်း</div>
                                      <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{t.total_amount.toLocaleString()} ကျပ်</div>
                                  </div>
                                  <div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">အမြတ်</div>
                                      <div className={`font-bold text-lg ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{profit.toLocaleString()} ကျပ်</div>
                                  </div>
                              </div>
                              <div className="flex gap-2 border-t dark:border-gray-700 pt-3">
                                <button onClick={() => viewTransaction(t)} className="flex-1 text-sm py-2 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600">👁️ အသေးစိတ်</button>
                                {t.type === 'sale' && <button onClick={() => openReturnModal(t)} className="flex-1 text-sm py-2 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600">↩️ ပြန်သွင်း</button>}
                              </div>
                          </div>
                      )
                  })
              )}
          </div>
        </div>
      </div>
      {/* Printable Report */}
      <div id="printable-transaction-report">
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>Transaction Report</h1>
        <p style={{ marginBottom: '0.5rem' }}><strong>Generated on:</strong> {new Date().toLocaleString('en-CA')}</p>
        <p style={{ marginBottom: '1.5rem' }}><strong>Filters:</strong> {getFilterText()}</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ border: '1px solid #eee', padding: '1rem', flex: 1, minWidth: '200px' }}>
                <strong>Total Transactions:</strong> {totalTransactions}
            </div>
            <div style={{ border: '1px solid #eee', padding: '1rem', flex: 1, minWidth: '200px' }}>
                <strong>Total Revenue:</strong> {totalAmount.toLocaleString()} Kyat
            </div>
            <div style={{ border: '1px solid #eee', padding: '1rem', flex: 1, minWidth: '200px' }}>
                <strong>Total Profit:</strong> {totalProfit.toLocaleString()} Kyat
            </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items Count</th>
              <th>Total Amount (Kyat)</th>
              <th>Profit (Kyat)</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => {
                const items = JSON.parse(t.items);
                const customer = customers.find(c => c.__backendId === t.customer_id);
                const profit = calculateProfit(t);
                return (
                  <tr key={t.__backendId}>
                    <td>{t.transaction_id}</td>
                    <td>{t.type}</td>
                    <td>{new Date(t.transaction_date).toLocaleDateString('en-CA')}</td>
                    <td>{customer?.customer_name || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{items.length}</td>
                    <td style={{ textAlign: 'right' }}>{t.total_amount.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{profit.toLocaleString()}</td>
                    <td>{t.payment_method}</td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};