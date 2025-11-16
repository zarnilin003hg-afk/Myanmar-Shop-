import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Header } from './Header';
import { Modal } from './shared/Modal';
import { Toast, ToastData } from './shared/Toast';
import type { Tab, CartItem, Product, Transaction, Customer, Supplier, ModalState, AnyData, UserRole, Settings, User as UserType } from '../types';
import { TABS } from '../constants';

// --- Lazy-loaded Components ---

const LoadingSpinner = () => (
    <div className="w-full h-full flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
);

// Views
const PosView = lazy(() => import('./views/PosView').then(m => ({ default: m.PosView })));
const InventoryView = lazy(() => import('./views/InventoryView').then(m => ({ default: m.InventoryView })));
const CustomersView = lazy(() => import('./views/CustomersView').then(m => ({ default: m.CustomersView })));
const TransactionsView = lazy(() => import('./views/TransactionsView').then(m => ({ default: m.TransactionsView })));
const SuppliersView = lazy(() => import('./views/SuppliersView').then(m => ({ default: m.SuppliersView })));
const ReportsView = lazy(() => import('./views/ReportsView').then(m => ({ default: m.ReportsView })));
const FinanceView = lazy(() => import('./views/FinanceView').then(m => ({ default: m.FinanceView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

// Modals
const ProductModal = lazy(() => import('./modals/ProductModal').then(m => ({ default: m.ProductModal })));
const CustomerModal = lazy(() => import('./modals/CustomerModal').then(m => ({ default: m.CustomerModal })));
const SupplierModal = lazy(() => import('./modals/SupplierModal').then(m => ({ default: m.SupplierModal })));
const UserModal = lazy(() => import('./modals/UserModal').then(m => ({ default: m.UserModal })));
const CheckoutModal = lazy(() => import('./modals/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const DiscountModal = lazy(() => import('./modals/DiscountModal').then(m => ({ default: m.DiscountModal })));
const ReceiptModal = lazy(() => import('./modals/ReceiptModal').then(m => ({ default: m.ReceiptModal })));
const TransactionDetailModal = lazy(() => import('./modals/TransactionDetailModal').then(m => ({ default: m.TransactionDetailModal })));
const ConfirmationModal = lazy(() => import('./modals/ConfirmationModal').then(m => ({ default: m.ConfirmationModal })));
const BarcodeScanner = lazy(() => import('./shared/BarcodeScanner').then(m => ({ default: m.BarcodeScanner })));
const ReturnModal = lazy(() => import('./modals/ReturnModal').then(m => ({ default: m.ReturnModal })));
const PriceHistoryModal = lazy(() => import('./modals/PriceHistoryModal').then(m => ({ default: m.PriceHistoryModal })));

interface MainLayoutProps {
  user: UserType;
  onLogout: () => void;
  data: AnyData[];
  create: (item: Omit<AnyData, '__backendId' | 'id'> & { id?: string }) => Promise<{ isOk: boolean }>;
  update: (item: AnyData) => Promise<{ isOk: boolean }>;
  deleteItem: (item: AnyData) => Promise<{ isOk: boolean }>;
}

const modalSizes: { [key in ModalState['type']]?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' } = {
    product: 'xl',
    customer: 'lg',
    supplier: '2xl',
    user: 'md',
    checkout: 'md',
    discount: 'sm',
    receipt: 'lg',
    transaction_detail: 'lg',
    return: 'xl',
    price_history: 'md',
    confirm_delete: 'sm',
    confirm_clear_cart: 'sm',
};

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, data, create, update, deleteItem }) => {
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0.05);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: null, data: null });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    storeName: 'Myanmar Shop',
    storeAddress: 'Yangon, Myanmar',
    storePhone: '09-123-456-789',
    receiptFooter: 'ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်',
  });
  
  const products = useMemo(() => data.filter((d): d is Product => d.module === 'inventory'), [data]);
  const customers = useMemo(() => data.filter((d): d is Customer => d.module === 'customers'), [data]);
  const transactions = useMemo(() => data.filter((d): d is Transaction => d.module === 'transactions'), [data]);
  const suppliers = useMemo(() => data.filter((d): d is Supplier => d.module === 'suppliers'), [data]);
  const users = useMemo(() => data.filter((d): d is UserType => d.module === 'users'), [data]);

  const currentUserRole = user.role;

  const visibleTabs = TABS.filter(tab => {
    if (currentUserRole === 'Cashier') {
      return tab.id === 'pos' || tab.id === 'transactions';
    }
    return true; // Admin sees all
  });

  useEffect(() => {
    const isTabVisible = visibleTabs.some(tab => tab.id === activeTab);
    if (!isTabVisible) {
      setActiveTab('pos');
    }
  }, [currentUserRole, activeTab, visibleTabs]);


  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_code === product.product_code);
      if (existingItem) {
        if (existingItem.quantity < product.quantity) {
          return prevCart.map(item =>
            item.product_code === product.product_code
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          addToast('ကုန်ပစ္စည်းလက်ကျန်မလုံလောက်ပါ', 'error');
          return prevCart;
        }
      } else {
        addToast(`${product.product_name} ထည့်ပြီးပါပြီ`, 'success');
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const updateCartQuantity = (productCode: string, newQuantity: number) => {
    const product = products.find(p => p.product_code === productCode);
    if (!product) return;

    if (newQuantity > product.quantity) {
        addToast('ကုန်ပစ္စည်းလက်ကျန်မလုံလောက်ပါ', 'error');
        return;
    }

    setCart(prevCart => {
        if (newQuantity <= 0) {
            return prevCart.filter(item => item.product_code !== productCode);
        }
        return prevCart.map(item =>
            item.product_code === productCode
                ? { ...item, quantity: newQuantity }
                : item
        );
    });
  };

  const removeFromCart = (productCode: string) => {
    setCart(prevCart => prevCart.filter(item => item.product_code !== productCode));
  };
  
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomerId(null);
    addToast('စာရင်းရှင်းလင်းပြီးပါပြီ', 'success');
    setModal({type: null, data: null});
  };
  
  const handleCheckout = async (transaction: Omit<Transaction, '__backendId' | 'id' | 'module' | 'type' | 'created_at'>) => {
    const transactionWithCustomer = {
      ...transaction,
      customer_id: selectedCustomerId || undefined,
      cashier: user.username,
    };

    const newTransactionData: Omit<Transaction, '__backendId'> = {
        ...transactionWithCustomer,
        id: transaction.transaction_id,
        module: 'transactions',
        type: 'sale',
        created_at: new Date().toISOString(),
    };

    const result = await create(newTransactionData);

    if (result.isOk) {
        // Update product quantities
        for (const item of cart) {
            const product = products.find(p => p.__backendId === item.__backendId);
            if (product) {
                await update({ ...product, quantity: product.quantity - item.quantity });
            }
        }

        // Update customer loyalty points
        if (selectedCustomerId) {
            const customer = customers.find(c => c.__backendId === selectedCustomerId);
            if (customer) {
                // 1. Calculate points spent from discount
                const maxDiscountFromPoints = (customer.loyalty_points || 0) * 10;
                const actualDiscountFromPoints = Math.min(discount, maxDiscountFromPoints);
                const pointsSpent = Math.floor(actualDiscountFromPoints / 10);
                
                // 2. Calculate points earned from this purchase
                const pointsEarned = Math.floor(transaction.total_amount / 1000);
                
                // 3. Calculate final points
                const currentPoints = customer.loyalty_points || 0;
                const finalPoints = currentPoints - pointsSpent + pointsEarned;
                
                await update({ ...customer, loyalty_points: finalPoints });
            }
        }

        addToast('အရောင်းအောင်မြင်ပါသည်!', 'success');
        setModal({type: 'receipt', data: newTransactionData as Transaction });
        setCart([]);
        setDiscount(0);
        setSelectedCustomerId(null);
    } else {
        addToast('အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်', 'error');
    }
  };
  
  const handleReturn = async (
    originalTransaction: Transaction,
    itemsToReturn: { product_code: string; name: string; quantity: number; price: number }[],
    reason: string,
    restock: boolean
  ) => {
      const refundAmount = itemsToReturn.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const returnTransactionData: Omit<Transaction, '__backendId'> = {
          id: `RTN-${Date.now()}`,
          module: 'transactions',
          type: 'return',
          transaction_id: `RTN-${originalTransaction.transaction_id.slice(0, 10)}`,
          original_transaction_id: originalTransaction.transaction_id,
          transaction_date: new Date().toISOString(),
          items: JSON.stringify(itemsToReturn.map(item => ({ 
              product_code: item.product_code, 
              product_name: item.name, 
              quantity: item.quantity, 
              price: item.price,
              subtotal: item.price * item.quantity 
          }))),
          total_amount: -refundAmount,
          paid_amount: -refundAmount,
          change_amount: 0,
          discount: 0,
          tax: 0,
          payment_method: 'Return',
          cashier: user.username,
          customer_id: originalTransaction.customer_id,
          created_at: new Date().toISOString(),
      };

      const result = await create(returnTransactionData);

      if (result.isOk) {
          if (restock) {
              for (const item of itemsToReturn) {
                  const product = products.find(p => p.product_code === item.product_code);
                  if (product) {
                      await update({ ...product, quantity: product.quantity + item.quantity });
                  }
              }
          }

          if (originalTransaction.customer_id) {
              const customer = customers.find(c => c.__backendId === originalTransaction.customer_id);
              if (customer) {
                  const currentPurchases = customer.total_purchases || 0;
                  await update({ ...customer, total_purchases: Math.max(0, currentPurchases - refundAmount) });
                  // Note: Loyalty points are not clawed back in this simple implementation.
              }
          }
          
          addToast('ပစ္စည်းပြန်သွင်းခြင်း အောင်မြင်ပါသည်', 'success');
          setModal({ type: null, data: null });
      } else {
          addToast('အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်', 'error');
      }
  };

  const renderModalContent = () => {
    const selectedCustomer = customers.find(c => c.__backendId === selectedCustomerId) || null;

    switch(modal.type) {
      case 'product':
        return <ProductModal 
                  product={modal.data as Product | null} 
                  suppliers={suppliers}
                  products={products}
                  onClose={() => setModal({ type: null, data: null })} 
                  onSave={async (p) => {
                    if (currentUserRole !== 'Admin') {
                      addToast('လုပ်ဆောင်ခွင့်မရှိပါ', 'error');
                      return;
                    }
                    const isUpdate = '__backendId' in p;

                    let result;
                    if (isUpdate) {
                      let productToSave = { ...p };
                      const originalProduct = products.find(prod => prod.__backendId === p.__backendId);
                      if (originalProduct && originalProduct.price !== p.price) {
                          const historyEntry = {
                              date: new Date().toISOString(),
                              old_price: originalProduct.price,
                              new_price: p.price,
                          };
                          const existingHistory = originalProduct.price_history ? JSON.parse(originalProduct.price_history) : [];
                          const newHistory = [historyEntry, ...existingHistory];
                          productToSave.price_history = JSON.stringify(newHistory);
                      }
                      result = await update(productToSave);
                    } else {
                      result = await create(p);
                    }

                    if (result.isOk) {
                      addToast(isUpdate ? 'ပြင်ဆင်ပြီးပါပြီ' : 'ထည့်သွင်းပြီးပါပြီ', 'success');
                      setModal({ type: null, data: null });
                    } else {
                      addToast('အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်', 'error');
                    }
                  }} 
                  addToast={addToast}
                />;
      case 'customer':
        return <CustomerModal
                  customer={modal.data as Customer | null}
                  onClose={() => setModal({ type: null, data: null })}
                  onSave={async (c) => {
                     if (currentUserRole !== 'Admin') {
                        addToast('လုပ်ဆောင်ခွင့်မရှိပါ', 'error');
                        return;
                     }
                     const isUpdate = '__backendId' in c;
                     let result;
                     if (isUpdate) {
                       result = await update(c);
                     } else {
                       const customerData = { ...c, loyalty_points: 0 };
                       result = await create(customerData);
                     }

                     if (result.isOk) {
                       addToast(isUpdate ? 'ပြင်ဆင်ပြီးပါပြီ' : 'ထည့်သွင်းပြီးပါပြီ', 'success');
                       setModal({ type: null, data: null });
                     } else {
                       addToast('အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်', 'error');
                     }
                  }}
                />;
      case 'supplier':
        return <SupplierModal
                  supplier={modal.data as Supplier | null}
                  onClose={() => setModal({ type: null, data: null })}
                  onSave={async (s) => {
                    if (currentUserRole !== 'Admin') {
                        addToast('လုပ်ဆောင်ခွင့်မရှိပါ', 'error');
                        return;
                    }
                    const isUpdate = '__backendId' in s;
                    const result = isUpdate ? await update(s) : await create(s);
                     if (result.isOk) {
                       addToast(isUpdate ? 'ပြင်ဆင်ပြီးပါပြီ' : 'ထည့်သွင်းပြီးပါပြီ', 'success');
                       setModal({ type: null, data: null });
                     } else {
                       addToast('အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်', 'error');
                     }
                  }}
                  addToast={addToast}
                />;
      case 'user':
        return <UserModal
                  user={modal.data as UserType | null}
                  onClose={() => setModal({ type: null, data: null })}
                  onSave={async (u) => {
                    if (currentUserRole !== 'Admin') {
                        addToast('လုပ်ဆောင်ခွင့်မရှိပါ', 'error');
                        return;
                    }
                    const isUpdate = '__backendId' in u;
                    // FIX: Pass the user object directly, relying on UserModal to provide a complete object with id and created_at for new users. This resolves the missing `created_at` property error.
                    const result = isUpdate ? await update(u) : await create(u);
                     if (result.isOk) {
                       addToast(isUpdate ? 'အသုံးပြုသူ ပြင်ဆင်ပြီးပါပြီ' : 'အသုံးပြုသူ ထည့်သွင်းပြီးပါပြီ', 'success');
                       setModal({ type: null, data: null });
                     } else {
                       addToast('အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်', 'error');
                     }
                  }}
                />;
      case 'checkout':
        return <CheckoutModal
                  cart={cart}
                  discount={discount}
                  taxRate={taxRate}
                  onClose={() => setModal({ type: null, data: null })}
                  onCheckout={handleCheckout}
                />;
      case 'discount':
        return <DiscountModal
                  currentDiscount={discount}
                  cart={cart}
                  selectedCustomer={selectedCustomer}
                  onClose={() => setModal({ type: null, data: null })}
                  onApply={(newDiscount) => {
                    setDiscount(newDiscount);
                    setModal({ type: null, data: null });
                    addToast('လျှော့စျေးထည့်ပြီးပါပြီ', 'success');
                  }}
                  addToast={addToast}
                />;
      case 'receipt':
        return <ReceiptModal
                  transaction={modal.data as Transaction}
                  settings={settings}
                  onClose={() => setModal({ type: null, data: null })}
                  addToast={addToast}
                />;
      case 'transaction_detail':
        return <TransactionDetailModal
                  transaction={modal.data as Transaction}
                  customers={customers}
                  products={products}
                  onClose={() => setModal({ type: null, data: null })}
                />;
      case 'return':
        return <ReturnModal
                  transaction={modal.data as Transaction}
                  onClose={() => setModal({ type: null, data: null })}
                  onProcessReturn={handleReturn}
                  addToast={addToast}
               />;
      case 'price_history':
        return <PriceHistoryModal
                  product={modal.data as Product}
                  onClose={() => setModal({ type: null, data: null })}
               />;
      case 'confirm_delete':
          const getItemType = (item: AnyData) => {
              switch (item.module) {
                  case 'inventory': return 'ကုန်ပစ္စည်း';
                  case 'customers': return 'ဝယ်ယူသူ';
                  case 'suppliers': return 'ပေးသွင်းသူ';
                  case 'users': return 'အသုံးပြုသူ';
                  default: return 'အရာ';
              }
          };
          return <ConfirmationModal
                    title="အတည်ပြုပါ"
                    message={`ဤ ${getItemType(modal.data as AnyData)} ကို ဖျက်လိုသည်မှာ သေချာပါသလား?`}
                    onConfirm={async () => {
                      if (currentUserRole !== 'Admin') {
                        addToast('လုပ်ဆောင်ခွင့်မရှိပါ', 'error');
                        setModal({type: null, data: null});
                        return;
                      }
                      const result = await deleteItem(modal.data as AnyData);
                      if (result.isOk) {
                          addToast('ဖျက်ပြီးပါပြီ', 'success');
                          setModal({type: null, data: null});
                      } else {
                          addToast('အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်', 'error');
                      }
                    }}
                    onCancel={() => setModal({type: null, data: null})}
                />;
       case 'confirm_clear_cart':
          return <ConfirmationModal
                    title="အတည်ပြုပါ"
                    message="စာရင်းကို ရှင်းလင်းလိုသည်မှာ သေချာပါသလား?"
                    onConfirm={clearCart}
                    onCancel={() => setModal({type: null, data: null})}
                />;
       case 'barcode_scanner':
          return <BarcodeScanner
                    onScan={(barcode) => {
                      const product = products.find(p => p.barcode === barcode);
                      if (product) {
                          addToCart(product);
                      } else {
                          addToast(`Barcode "${barcode}" နှင့်ကိုက်ညီသော ကုန်ပစ္စည်းမရှိပါ`, 'error');
                      }
                      setModal({ type: null, data: null });
                    }}
                    onClose={() => setModal({ type: null, data: null })}
                />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pos':
        return <PosView 
                  products={products} 
                  customers={customers}
                  cart={cart}
                  discount={discount}
                  taxRate={taxRate}
                  selectedCustomerId={selectedCustomerId}
                  setSelectedCustomerId={setSelectedCustomerId}
                  addToCart={addToCart}
                  updateCartQuantity={updateCartQuantity}
                  removeFromCart={removeFromCart}
                  openCheckout={() => setModal({ type: 'checkout', data: null })}
                  openDiscount={() => setModal({ type: 'discount', data: null })}
                  openClearCart={() => setModal({ type: 'confirm_clear_cart', data: null })}
                  openBarcodeScanner={() => setModal({ type: 'barcode_scanner', data: null })}
                />;
      case 'inventory':
        return <InventoryView 
                  products={products}
                  suppliers={suppliers}
                  openModal={(p) => setModal({ type: 'product', data: p })}
                  deleteProduct={(p) => setModal({ type: 'confirm_delete', data: p })}
                  openPriceHistoryModal={(p) => setModal({ type: 'price_history', data: p })}
                  currentUserRole={currentUserRole}
                />;
      case 'customers':
        return <CustomersView
                  customers={customers}
                  openModal={(c) => setModal({ type: 'customer', data: c })}
                  deleteCustomer={(c) => setModal({ type: 'confirm_delete', data: c })}
                  currentUserRole={currentUserRole}
                />;
      case 'transactions':
        return <TransactionsView 
                  transactions={transactions}
                  customers={customers}
                  products={products}
                  viewTransaction={(t) => setModal({ type: 'transaction_detail', data: t })}
                  openReturnModal={(t) => setModal({ type: 'return', data: t })}
                />;
      case 'suppliers':
        return <SuppliersView 
                  suppliers={suppliers}
                  products={products}
                  openModal={(s) => setModal({ type: 'supplier', data: s })}
                  deleteSupplier={(s) => setModal({ type: 'confirm_delete', data: s })}
                  currentUserRole={currentUserRole}
                />;
      case 'reports':
        return <ReportsView 
                  transactions={transactions} 
                  products={products}
                />;
      case 'finance':
        return <FinanceView 
                  transactions={transactions} 
                  products={products}
                />;
      case 'settings':
        return <SettingsView 
                  settings={settings}
                  setSettings={setSettings}
                  taxRate={taxRate}
                  setTaxRate={setTaxRate}
                  currentUserRole={currentUserRole}
                  addToast={addToast}
                  users={users}
                  currentUser={user}
                  openUserModal={(u) => setModal({ type: 'user', data: u })}
                  deleteUser={(u) => setModal({ type: 'confirm_delete', data: u })}
                />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col font-[Segoe_UI,Myanmar_Text,Pyidaungsu] bg-gray-100">
      <Header 
        storeName={settings.storeName}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={visibleTabs} 
        transactions={transactions}
        userRole={currentUserRole}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          {renderContent()}
        </Suspense>
      </main>
      
      {modal.type && (
        <Modal 
          onClose={() => setModal({ type: null, data: null })} 
          size={modalSizes[modal.type]}
        >
          <Suspense fallback={<LoadingSpinner />}>
            {renderModalContent()}
          </Suspense>
        </Modal>
      )}

      <div className="fixed top-5 right-5 z-[1001] space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
}