export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  image_key: string | null;
  featured: number;
  created_at: string;
  image_url: string | null;
};

export type CartItem = {
  id: string; // unique item key e.g. productId-size-color
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  image_url: string;
};

export type Order = {
  id: number;
  code: string;
  customer_name: string;
  phone: string;
  address: string;
  note: string;
  total: number;
  status: string;
  created_at: string;
  customer_id?: number | null;
  voucher_code?: string | null;
  discount?: number;
  total_items?: number;
  items?: Array<{
    id?: number;
    order_id?: number;
    product_id?: number;
    product_name: string;
    size: string;
    color: string;
    quantity: number;
    unit_price: number;
    image_url?: string | null;
  }>;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

export type Review = {
  id: number;
  customer_id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  customer_name?: string;
};

export type Voucher = {
  code: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  active: number;
  expires_at: string | null;
};

export type KnowledgeDoc = {
  id: string;
  title: string;
  created_at: string;
  chunk_count?: number;
};

export type CreatedOrderInfo = {
  code: string;
  total: number;
  discount: number;
  shippingFee: number;
  customer_name: string;
  phone: string;
  address: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
};

export type PendingOrderInfo = {
  productId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: Array<string | { title?: string; text?: string; score?: number }>;
  products?: Product[];
  readyToConfirm?: boolean;
  createdOrder?: CreatedOrderInfo;
  pendingOrder?: PendingOrderInfo;
};
