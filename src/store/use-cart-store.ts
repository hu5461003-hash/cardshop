import { create } from "zustand";

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  email: string;
  paymentMethod: "stripe" | "crypto";
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setEmail: (email: string) => void;
  setPaymentMethod: (method: "stripe" | "crypto") => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  email: "",
  paymentMethod: "stripe",

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
    })),

  setEmail: (email) => set({ email }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  clearCart: () => set({ items: [], email: "" }),

  getTotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
