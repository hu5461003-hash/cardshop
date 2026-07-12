import { create } from "zustand";

interface ModalState {
  purchaseModalOpen: boolean;
  selectedProductId: string | null;
  openPurchaseModal: (productId: string) => void;
  closePurchaseModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  purchaseModalOpen: false,
  selectedProductId: null,
  openPurchaseModal: (productId) =>
    set({ purchaseModalOpen: true, selectedProductId: productId }),
  closePurchaseModal: () =>
    set({ purchaseModalOpen: false, selectedProductId: null }),
}));
