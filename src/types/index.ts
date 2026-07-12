export type StockType = "one_time" | "repeatable";

export type OrderStatus = "pending" | "paid" | "delivered" | "failed" | "refunded";

export type PaymentMethod = "stripe" | "crypto";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  stockType: StockType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CardStock {
  id: string;
  productId: string;
  encryptedContent: string;
  isSold: boolean;
  orderId?: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderNo: string;
  email: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  cardContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription?: string;
  seoMeta?: string;
  announcement?: string;
  supportLink?: string;
  customDomain?: string;
  updatedAt: Date;
}
