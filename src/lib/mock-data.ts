// ============================================
// CardShop Data Store — localStorage persistence
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stockType: "one_time" | "repeatable";
  isActive: boolean;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardItem {
  id: string;
  productId: string;
  content: string;
  isSold: boolean;
  orderId: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  email: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: "wechat" | "alipay" | "stripe" | "crypto";
  status: "pending" | "paid" | "delivered" | "failed" | "refunded";
  cardContent: string | null;
  txId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  seoMetaTitle: string;
  seoMetaKeywords: string;
  seoMetaDescription: string;
  announcement: string;
  supportLink: string;
  supportEmail: string;
  customDomain: string;
  faviconUrl: string;  // 网站 favicon 图标 URL
  adminUsername: string;
  adminPassword: string;  // 明文存储，仅用于演示，生产环境应使用 bcrypt hash
}

export interface PaymentChannel {
  id: string;
  name: string;
  code: "wechat" | "alipay" | "stripe" | "crypto" | "custom";
  icon: string; // lucide icon name
  isActive: boolean;
  sortOrder: number;
  config: Record<string, string>; // channel-specific config fields
  createdAt: string;
}

export interface StoreData {
  categories: Category[];
  products: Product[];
  cards: CardItem[];
  orders: Order[];
  settings: SiteSettings;
  paymentChannels: PaymentChannel[];
  adminToken: string;  // 当前有效的管理员认证 token
}

const STORAGE_KEY = "cardshop_data";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateOrderNo(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${num}`;
}

const defaultSettings: SiteSettings = {
  siteName: "CardShop",
  siteDescription: "Premium digital accounts marketplace",
  seoMetaTitle: "CardShop — Premium Digital Accounts",
  seoMetaKeywords: "buy accounts, telegram, twitter, google",
  seoMetaDescription: "Premium digital accounts marketplace with instant delivery.",
  announcement: "\u{1F389} \u6B22\u8FCE\u5149\u4E34\uFF01\u6240\u6709\u8D26\u53F7\u5747\u5DF2\u9A8C\u8BC1\uFF0C\u5373\u65F6\u53D1\u8D27\u3002",
  supportLink: "https://t.me/cardshop_support",
  supportEmail: "support@cardshop.com",
  customDomain: "zap534.site",
  faviconUrl: "",
  adminUsername: "admin",
  adminPassword: "admin123",
};

const defaultCategories: Category[] = [
  { id: "cat-1", name: "Telegram", slug: "telegram", description: "\u5DF2\u9A8C\u8BC1\u7684 Telegram \u8D26\u53F7", sortOrder: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "cat-2", name: "Twitter / X", slug: "twitter", description: "\u5E26\u7C89\u4E1D\u7684 Twitter \u8001\u53F7", sortOrder: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: "cat-3", name: "Google / Gmail", slug: "google", description: "\u5404\u5E74\u4EFD Google \u8D26\u53F7", sortOrder: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: "cat-4", name: "Instagram", slug: "instagram", description: "\u4F18\u8D28 Instagram \u8D26\u53F7", sortOrder: 4, isActive: true, createdAt: new Date().toISOString() },
  { id: "cat-5", name: "Discord", slug: "discord", description: "\u5E26 Nitro \u7684 Discord \u8D26\u53F7", sortOrder: 5, isActive: true, createdAt: new Date().toISOString() },
  { id: "cat-6", name: "TikTok", slug: "tiktok", description: "\u5E26\u7C89\u4E1D\u7684 TikTok \u8D26\u53F7", sortOrder: 6, isActive: true, createdAt: new Date().toISOString() },
];

const defaultProducts: Product[] = [
  { id: "prod-1", name: "Telegram \u8001\u53F7 (2022)", description: "2022\u5E74\u6CE8\u518C\u7684 Telegram \u8001\u53F7\uFF0C\u65E0\u5C01\u7981\u8BB0\u5F55\u3002", price: 39.99, categoryId: "cat-1", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-2", name: "Telegram Premium \u8D26\u53F7", description: "\u5E26 Premium \u8BA2\u9605\u7684 Telegram \u8D26\u53F7\u3002", price: 89.99, categoryId: "cat-1", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-3", name: "Twitter \u8001\u53F7 (2021)", description: "2021\u5E74\u6CE8\u518C\uFF0C\u6709\u81EA\u7136\u7C89\u4E1D\uFF0C\u90AE\u7BB1\u5DF2\u9A8C\u8BC1\u3002", price: 59.99, categoryId: "cat-2", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-4", name: "Twitter \u9AD8\u7C89\u53F7", description: "5K+ \u771F\u5B9E\u7C89\u4E1D\u7684 Twitter \u8D26\u53F7\uFF0C2\u5E74\u4EE5\u4E0A\u3002", price: 179.99, categoryId: "cat-2", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-5", name: "Google Gmail \u8001\u53F7", description: "2022\u5E74\u521B\u5EFA\u7684 Google \u8D26\u53F7\uFF0C\u8BB0\u5F55\u5E72\u51C0\u3002", price: 28.99, categoryId: "cat-3", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-6", name: "Instagram \u8001\u53F7 (2021)", description: "2021\u5E74\u6CE8\u518C\uFF0C\u6709\u771F\u5B9E\u5E16\u5B50\uFF0C\u8BB0\u5F55\u5E72\u51C0\u3002", price: 49.99, categoryId: "cat-4", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-7", name: "Discord Nitro \u8D26\u53F7", description: "\u5E26 Nitro \u8BA2\u9605\u7684 Discord \u8D26\u53F7\uFF0C\u5269\u4F593\u4E2A\u6708\u3002", price: 69.99, categoryId: "cat-5", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-8", name: "TikTok \u8001\u53F7", description: "1K+ \u7C89\u4E1D\u7684 TikTok \u8001\u53F7\uFF0C\u8BB0\u5F55\u5E72\u51C0\u3002", price: 53.99, categoryId: "cat-6", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-9", name: "Telegram \u65B0\u53F7", description: "\u65B0\u6CE8\u518C\u7684 Telegram \u8D26\u53F7\uFF0C\u5DF2\u9A8C\u8BC1\u624B\u673A\u53F7\u3002", price: 14.99, categoryId: "cat-1", stockType: "one_time", isActive: true, image: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function generateDefaultCards(): CardItem[] {
  const cards: CardItem[] = [];
  const stockCounts: Record<string, number> = { "prod-1": 18, "prod-2": 7, "prod-3": 12, "prod-4": 3, "prod-5": 24, "prod-6": 9, "prod-7": 5, "prod-8": 11, "prod-9": 31 };
  for (const [productId, count] of Object.entries(stockCounts)) {
    for (let i = 0; i < count; i++) {
      cards.push({
        id: generateId(),
        productId,
        content: `account_${productId}_${i + 1}@email.com:password_${i + 1}`,
        isSold: i < 2,
        orderId: i < 2 ? `ord-mock-${i}` : null,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return cards;
}

const defaultOrders: Order[] = [
  { id: "ord-1", orderNo: "ORD-100001", email: "customer1@gmail.com", productId: "prod-1", quantity: 1, unitPrice: 5.99, totalAmount: 5.99, paymentMethod: "stripe", status: "delivered", cardContent: "Email: john_telegram@gmail.com\nPassword: Tg@Secure2024\nPhone: +1 234-567-8901", txId: "tx_stripe_001", createdAt: "2024-12-01T10:00:00Z", updatedAt: "2024-12-01T10:01:00Z" },
  { id: "ord-2", orderNo: "ORD-100002", email: "buyer2@outlook.com", productId: "prod-4", quantity: 1, unitPrice: 24.99, totalAmount: 24.99, paymentMethod: "crypto", status: "delivered", cardContent: "Username: @aged_twitter_2021\nPassword: Tw!tPass$ecure\nEmail: twitter_buyer@outlook.com", txId: "tx_crypto_002", createdAt: "2024-12-02T14:30:00Z", updatedAt: "2024-12-02T14:31:00Z" },
  { id: "ord-3", orderNo: "ORD-100003", email: "user3@yahoo.com", productId: "prod-5", quantity: 2, unitPrice: 3.99, totalAmount: 7.98, paymentMethod: "stripe", status: "paid", cardContent: null, txId: "tx_stripe_003", createdAt: "2024-12-03T09:15:00Z", updatedAt: "2024-12-03T09:15:00Z" },
  { id: "ord-4", orderNo: "ORD-100004", email: "test4@proton.me", productId: "prod-7", quantity: 1, unitPrice: 9.99, totalAmount: 9.99, paymentMethod: "crypto", status: "pending", cardContent: null, txId: null, createdAt: "2024-12-04T16:45:00Z", updatedAt: "2024-12-04T16:45:00Z" },
  { id: "ord-5", orderNo: "ORD-100005", email: "demo5@gmail.com", productId: "prod-3", quantity: 1, unitPrice: 8.49, totalAmount: 8.49, paymentMethod: "stripe", status: "failed", cardContent: null, txId: "tx_stripe_005", createdAt: "2024-12-05T11:20:00Z", updatedAt: "2024-12-05T11:21:00Z" },
];

const defaultPaymentChannels: PaymentChannel[] = [
  {
    id: "pay-1",
    name: "微信支付",
    code: "wechat",
    icon: "Smartphone",
    isActive: true,
    sortOrder: 1,
    config: {
      mchId: "",
      appId: "",
      apiKey: "",
      apiV3Key: "",
      notifyUrl: "https://zap534.site/api/payments/wechat/notify",
      description: "微信支付商户号、APPID、API密钥",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "pay-2",
    name: "支付宝",
    code: "alipay",
    icon: "Wallet",
    isActive: true,
    sortOrder: 2,
    config: {
      appId: "",
      privateKey: "",
      alipayPublicKey: "",
      notifyUrl: "https://zap534.site/api/payments/alipay/notify",
      description: "支付宝应用APPID、商户私钥、支付宝公钥",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "pay-3",
    name: "Stripe (信用卡)",
    code: "stripe",
    icon: "CreditCard",
    isActive: true,
    sortOrder: 3,
    config: {
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
      currency: "usd",
      description: "Stripe 发布密钥、密钥、Webhook 密钥",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "pay-4",
    name: "USDT-TRC20",
    code: "crypto",
    icon: "Bitcoin",
    isActive: true,
    sortOrder: 4,
    config: {
      walletAddress: "",
      network: "TRC20",
      confirmations: "3",
      description: "USDT 收款钱包地址、网络、确认数",
    },
    createdAt: new Date().toISOString(),
  },
];

const defaultData: StoreData = {
  categories: defaultCategories,
  products: defaultProducts,
  cards: generateDefaultCards(),
  orders: defaultOrders,
  settings: defaultSettings,
  paymentChannels: defaultPaymentChannels,
  adminToken: "cs_admin_2024_secure",
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function initializeStore(): StoreData {
  if (!isBrowser()) return defaultData;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Corrupted data, reset
    }
  }
  // First time: seed with default data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
}

function saveData(data: StoreData): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 导出 saveData 供 API 路由使用
export { saveData };

export function getStore(): StoreData {
  if (!isBrowser()) return defaultData;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  return defaultData;
}

// ============================================
// Category CRUD
// ============================================
export function getCategories(): Category[] {
  return getStore().categories.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategoryById(id: string): Category | undefined {
  return getStore().categories.find((c) => c.id === id);
}

export function createCategory(data: Omit<Category, "id" | "createdAt">): Category {
  const store = getStore();
  const category: Category = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  store.categories.push(category);
  saveData(store);
  return category;
}

export function updateCategory(id: string, data: Partial<Category>): Category | null {
  const store = getStore();
  const idx = store.categories.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.categories[idx] = { ...store.categories[idx], ...data };
  saveData(store);
  return store.categories[idx];
}

export function deleteCategory(id: string): boolean {
  const store = getStore();
  const idx = store.categories.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.categories.splice(idx, 1);
  saveData(store);
  return true;
}

// ============================================
// Product CRUD
// ============================================
export function getProducts(): Product[] {
  return getStore().products;
}

export function getProductById(id: string): Product | undefined {
  return getStore().products.find((p) => p.id === id);
}

export function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
  const store = getStore();
  const now = new Date().toISOString();
  const product: Product = { ...data, id: generateId(), createdAt: now, updatedAt: now };
  store.products.push(product);
  saveData(store);
  return product;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.products[idx] = { ...store.products[idx], ...data, updatedAt: new Date().toISOString() };
  saveData(store);
  return store.products[idx];
}

export function deleteProduct(id: string): boolean {
  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.products.splice(idx, 1);
  // Also delete associated cards
  store.cards = store.cards.filter((c) => c.productId !== id);
  saveData(store);
  return true;
}

export function toggleProductActive(id: string): Product | null {
  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.products[idx].isActive = !store.products[idx].isActive;
  store.products[idx].updatedAt = new Date().toISOString();
  saveData(store);
  return store.products[idx];
}

// ============================================
// Card Stock
// ============================================
export function getCards(productId?: string): CardItem[] {
  const store = getStore();
  return productId ? store.cards.filter((c) => c.productId === productId) : store.cards;
}

export function getAvailableStock(productId: string): number {
  return getStore().cards.filter((c) => c.productId === productId && !c.isSold).length;
}

export function getTotalStock(productId?: string): number {
  const store = getStore();
  return productId
    ? store.cards.filter((c) => c.productId === productId).length
    : store.cards.length;
}

export function addCard(productId: string, content: string): CardItem {
  const store = getStore();
  const card: CardItem = { id: generateId(), productId, content, isSold: false, orderId: null, createdAt: new Date().toISOString() };
  store.cards.push(card);
  saveData(store);
  return card;
}

export function importCards(productId: string, contents: string[]): number {
  const store = getStore();
  const newCards: CardItem[] = contents.map((content) => ({
    id: generateId(),
    productId,
    content: content.trim(),
    isSold: false,
    orderId: null,
    createdAt: new Date().toISOString(),
  }));
  store.cards.push(...newCards);
  saveData(store);
  return newCards.length;
}

export function clearCards(productId: string): number {
  const store = getStore();
  const before = store.cards.length;
  store.cards = store.cards.filter((c) => c.productId !== productId);
  saveData(store);
  return before - store.cards.length;
}

export function deleteCard(id: string): boolean {
  const store = getStore();
  const idx = store.cards.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.cards.splice(idx, 1);
  saveData(store);
  return true;
}

// ============================================
// Orders
// ============================================
export function getOrders(): Order[] {
  return getStore().orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getOrderById(id: string): Order | undefined {
  return getStore().orders.find((o) => o.id === id);
}

export function getOrderByNoOrEmail(query: string): Order | undefined {
  const store = getStore();
  const q = query.toLowerCase().trim();
  return store.orders.find((o) => o.orderNo.toLowerCase() === q || o.email.toLowerCase() === q);
}

export function createOrder(data: Omit<Order, "id" | "orderNo" | "createdAt" | "updatedAt">): Order {
  const store = getStore();
  const now = new Date().toISOString();
  const order: Order = { ...data, id: generateId(), orderNo: generateOrderNo(), createdAt: now, updatedAt: now };
  store.orders.push(order);
  saveData(store);
  return order;
}

export function updateOrderStatus(id: string, status: Order["status"]): Order | null {
  const store = getStore();
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  store.orders[idx].status = status;
  store.orders[idx].updatedAt = new Date().toISOString();
  saveData(store);
  return store.orders[idx];
}

// ============================================
// Settings
// ============================================
export function getSettings(): SiteSettings {
  return getStore().settings;
}

export function updateSettings(data: Partial<SiteSettings>): SiteSettings {
  const store = getStore();
  store.settings = { ...store.settings, ...data };
  saveData(store);
  return store.settings;
}

// ============================================
// Dashboard Stats
// ============================================
export function getDashboardStats() {
  const store = getStore();
  const totalRevenue = store.orders.filter((o) => o.status === "delivered" || o.status === "paid").reduce((sum, o) => sum + o.totalAmount, 0);
  const todayOrders = store.orders.filter((o) => {
    const today = new Date().toDateString();
    return new Date(o.createdAt).toDateString() === today;
  }).length;
  const activeProducts = store.products.filter((p) => p.isActive).length;
  const lowStockAlerts = store.products.filter((p) => {
    const stock = store.cards.filter((c) => c.productId === p.id && !c.isSold).length;
    return stock <= 5 && p.isActive;
  }).length;
  return { totalRevenue, todayOrders, activeProducts, lowStockAlerts };
}

// ============================================
// Payment Channels
// ============================================
export function getPaymentChannels(): PaymentChannel[] {
  return getStore().paymentChannels.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getActivePaymentChannels(): PaymentChannel[] {
  return getStore().paymentChannels.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPaymentChannelById(id: string): PaymentChannel | undefined {
  return getStore().paymentChannels.find((c) => c.id === id);
}

export function createPaymentChannel(data: Omit<PaymentChannel, "id" | "createdAt">): PaymentChannel {
  const store = getStore();
  const channel: PaymentChannel = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  store.paymentChannels.push(channel);
  saveData(store);
  return channel;
}

export function updatePaymentChannel(id: string, data: Partial<PaymentChannel>): PaymentChannel | null {
  const store = getStore();
  const idx = store.paymentChannels.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.paymentChannels[idx] = { ...store.paymentChannels[idx], ...data };
  saveData(store);
  return store.paymentChannels[idx];
}

export function deletePaymentChannel(id: string): boolean {
  const store = getStore();
  const idx = store.paymentChannels.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.paymentChannels.splice(idx, 1);
  saveData(store);
  return true;
}

export function togglePaymentChannel(id: string): PaymentChannel | null {
  const store = getStore();
  const idx = store.paymentChannels.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.paymentChannels[idx].isActive = !store.paymentChannels[idx].isActive;
  saveData(store);
  return store.paymentChannels[idx];
}

// ============================================
// Reset Store (for testing)
// ============================================
export function resetStore(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  initializeStore();
}

// ============================================
// Admin Credentials
// ============================================
export function updateAdminCredentials(username: string, password: string): SiteSettings {
  const store = getStore();
  store.settings.adminUsername = username;
  store.settings.adminPassword = password;
  // 同时更新 token（用新凭据生成新 token）
  const newToken = "cs_" + Date.now().toString(36) + "_secure";
  store.adminToken = newToken;
  saveData(store);
  return store.settings;
}

export function getAdminToken(): string {
  return getStore().adminToken;
}
