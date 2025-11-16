

export type Tab = 'pos' | 'inventory' | 'customers' | 'transactions' | 'reports' | 'suppliers' | 'settings' | 'finance';
export type UserRole = 'Admin' | 'Cashier';

export interface Settings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
}

export interface Product {
  __backendId: string;
  id: string;
  module: 'inventory';
  type: 'product';
  product_code: string;
  barcode?: string;
  product_name: string;
  category: string;
  supplier?: string;
  unit: string;
  cost: number;
  price: number;
  quantity: number;
  reorder_level: number;
  image_url?: string;
  price_history?: string; // JSON string of {date: string, old_price: number, new_price: number}[]
  created_at: string;
  updated_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  __backendId: string;
  id: string;
  module: 'transactions';
  type: 'sale' | 'return';
  transaction_id: string;
  original_transaction_id?: string;
  transaction_date: string;
  items: string; // JSON string of CartItem[] or return items
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  discount: number;
  tax: number;
  payment_method: string;
  cashier: string;
  customer_id?: string;
  created_at: string;
}

export interface Customer {
  __backendId: string;
  id: string;
  module: 'customers';
  type: 'customer';
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  total_purchases?: number;
  last_purchase?: string;
  loyalty_points?: number;
  created_at: string;
  updated_at?: string;
}

export interface SupplierProduct {
    category: string;
    products: string[];
}
export interface Supplier {
  __backendId: string;
  id: string;
  module: 'suppliers';
  type: 'supplier';
  supplier_name: string;
  supplier_phone: string;
  supplier_email?: string;
  supplier_address?: string;
  supplier_products: string; // JSON string of SupplierProduct[]
  created_at: string;
  updated_at?: string;
}

export interface User {
  __backendId: string;
  id: string;
  module: 'users';
  type: 'user';
  username: string;
  password?: string; // Should be handled securely in a real app
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export type AnyData = Product | Transaction | Customer | Supplier | User;

export interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ModalType = 
  | 'product' 
  | 'customer' 
  | 'supplier' 
  | 'user'
  | 'checkout' 
  | 'discount' 
  | 'receipt' 
  | 'transaction_detail'
  | 'confirm_delete'
  | 'confirm_clear_cart'
  | 'barcode_scanner'
  | 'price_history'
  | 'return';

export interface ModalState {
  type: ModalType | null;
  data?: AnyData | null;
}