"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Shield,
  Zap,
  CreditCard,
  Smartphone,
  Wallet,
  Bitcoin,
  Copy,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { t } from "@/lib/i18n";
import {
  getProductById,
  getCategories,
  getAvailableStock,
  getActivePaymentChannels,
} from "@/lib/mock-data";
import Modal from "@/components/ui/modal";

// ============================================
// Payment method icons & labels
// ============================================

const paymentIcons: Record<string, React.ReactNode> = {
  wechat: <Smartphone size={16} />,
  alipay: <Wallet size={16} />,
  stripe: <CreditCard size={16} />,
  crypto: <Bitcoin size={16} />,
  custom: <CreditCard size={16} />,
};

const paymentLabels: Record<string, string> = {
  wechat: "微信支付",
  alipay: "支付宝",
  stripe: "Stripe",
  crypto: "USDT",
};

// ============================================
// Payment modal states
// ============================================

type PaymentModalState =
  | "idle" // not open
  | "loading" // calling /api/payments/create
  | "wechat" // wechat QR code
  | "alipay" // alipay redirect + QR
  | "stripe" // stripe processing
  | "crypto" // crypto transfer info
  | "polling" // waiting for payment result
  | "success" // payment success
  | "expired" // payment timeout
  | "error"; // payment creation failed

interface PaymentData {
  orderNo: string;
  totalAmount: number;
  paymentMethod: string;
  codeUrl?: string;
  payUrl?: string;
  sessionId?: string;
  walletAddress?: string;
  network?: string;
  amount?: string;
}

// ============================================
// Main Product Page Component
// ============================================

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [stock, setStock] = useState(0);
  const [paymentChannels, setPaymentChannels] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("wechat");

  // Payment modal state
  const [modalState, setModalState] = useState<PaymentModalState>("idle");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState<{
    orderNo: string;
    cardContent: string;
  } | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const p = getProductById(productId);
    setProduct(p);
    if (p) {
      setCategory(getCategories().find((c) => c.id === p.categoryId));
      setStock(getAvailableStock(productId));
    }
    const activeChannels = getActivePaymentChannels();
    setPaymentChannels(activeChannels);
    if (activeChannels.length > 0) setPaymentMethod(activeChannels[0].code);
  }, [productId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ============================================
  // Payment status polling
  // ============================================

  const startPolling = useCallback((orderNo: string) => {
    // Poll every 3 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status?orderNo=${encodeURIComponent(orderNo)}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          const { status, cardContent } = json.data;
          if (status === "paid" || status === "delivered") {
            // Payment successful
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setSuccessData({ orderNo, cardContent: cardContent || "" });
            setModalState("success");
          } else if (status === "failed" || status === "refunded") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setErrorMsg(t("payment.error"));
            setModalState("error");
          }
        }
      } catch {
        // Ignore polling errors, continue polling
      }
    }, 3000);
  }, []);

  // ============================================
  // Countdown timer
  // ============================================

  const startCountdown = useCallback(() => {
    setCountdown(300);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setModalState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ============================================
  // Handle pay button click
  // ============================================

  const handlePay = async () => {
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg(t("payment.verifyEmail"));
      setModalState("error");
      return;
    }

    // Validate stock
    if (stock < quantity) {
      setErrorMsg(t("payment.noStock"));
      setModalState("error");
      return;
    }

    // Open modal in loading state
    setModalState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          email,
          paymentMethod,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setErrorMsg(json.error || t("payment.error"));
        setModalState("error");
        return;
      }

      const data = json.data;
      setPaymentData(data);

      // Show appropriate payment UI
      switch (paymentMethod) {
        case "wechat":
          setModalState("wechat");
          startPolling(data.orderNo);
          startCountdown();
          break;
        case "alipay":
          setModalState("alipay");
          startPolling(data.orderNo);
          startCountdown();
          break;
        case "stripe":
          setModalState("stripe");
          startPolling(data.orderNo);
          startCountdown();
          break;
        case "crypto":
          setModalState("crypto");
          startPolling(data.orderNo);
          startCountdown();
          break;
        default:
          setModalState("error");
          setErrorMsg(t("payment.error"));
      }
    } catch {
      setErrorMsg(t("payment.error"));
      setModalState("error");
    }
  };

  // ============================================
  // Close modal and cleanup
  // ============================================

  const handleCloseModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setModalState("idle");
    setPaymentData(null);
    setErrorMsg("");
    setSuccessData(null);
    setCopied(false);
  };

  // ============================================
  // Retry payment
  // ============================================

  const handleRetry = () => {
    setModalState("idle");
    setErrorMsg("");
    handlePay();
  };

  // ============================================
  // Copy to clipboard
  // ============================================

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ============================================
  // Format countdown
  // ============================================

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ============================================
  // QR Code placeholder (simulated)
  // ============================================

  const QRCodePlaceholder = ({ label }: { label: string }) => (
    <div className="w-48 h-48 mx-auto rounded-xl bg-white p-3 flex flex-col items-center justify-center gap-2">
      <QrCode size={120} className="text-gray-800" />
      <p className="text-xs text-gray-500 text-center">{label}</p>
    </div>
  );

  // ============================================
  // 404 state
  // ============================================

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-light-3 mb-4">
            {t("product.notFound")}
          </h1>
          <Link href="/" className="btn-secondary text-sm">
            {t("common.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  const total = product.price * quantity;

  // ============================================
  // Render payment modal content
  // ============================================

  const renderModalContent = () => {
    // Loading state
    if (modalState === "loading") {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 size={40} className="text-light-3 animate-spin" />
          <p className="text-gray-3 text-sm">{t("payment.processing")}</p>
        </div>
      );
    }

    // Error state
    if (modalState === "error") {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-gray-3 text-sm">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="btn-primary text-sm px-6 py-2 flex items-center gap-2"
          >
            <Zap size={14} />
            {t("payment.retry")}
          </button>
        </div>
      );
    }

    // Expired state
    if (modalState === "expired") {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Clock size={40} className="text-yellow-400" />
          <p className="text-light-3 font-medium">{t("payment.expired")}</p>
          <p className="text-gray-4 text-sm">{t("payment.polling")}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleRetry}
              className="btn-primary text-sm px-6 py-2 flex items-center gap-2"
            >
              <Zap size={14} />
              {t("payment.retry")}
            </button>
            <button
              onClick={handleCloseModal}
              className="btn-secondary text-sm px-6 py-2"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      );
    }

    // Success state
    if (modalState === "success" && successData) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-light-3">
            {t("payment.success")}
          </h3>
          <p className="text-gray-4 text-sm">{t("payment.successDesc")}</p>
          <div className="w-full mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-3/50 border border-glass-border">
              <span className="text-sm text-gray-4">
                {t("payment.orderNo")}
              </span>
              <span className="text-sm text-light-3 font-mono">
                {successData.orderNo}
              </span>
            </div>
            {successData.cardContent && (
              <div className="p-3 rounded-lg bg-dark-3/50 border border-glass-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-4">
                    {t("payment.cardContent")}
                  </span>
                  <button
                    onClick={() => handleCopy(successData.cardContent)}
                    className="flex items-center gap-1 text-xs text-gray-4 hover:text-light-3 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={12} /> {t("order.copied")}
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> {t("order.copy")}
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-sm text-light-3 font-mono whitespace-pre-wrap break-all">
                  {successData.cardContent}
                </pre>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Link
              href={`/order?query=${encodeURIComponent(successData.orderNo)}`}
              className="btn-secondary text-sm px-6 py-2"
            >
              {t("payment.viewOrder")}
            </Link>
            <button
              onClick={handleCloseModal}
              className="btn-primary text-sm px-6 py-2"
            >
              {t("payment.backToProduct")}
            </button>
          </div>
        </div>
      );
    }

    // WeChat payment - QR code
    if (modalState === "wechat") {
      return (
        <div className="flex flex-col items-center py-6 gap-5">
          <QRCodePlaceholder label={t("payment.qrcode")} />
          <div className="flex items-center gap-2 text-sm text-gray-3">
            <Clock size={14} />
            <span>
              {t("payment.countdown")}: {formatCountdown(countdown)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-4">
            <Loader2 size={14} className="animate-spin" />
            <span>{t("payment.polling")}</span>
          </div>
          <p className="text-xs text-gray-5">
            {t("payment.orderNo")}: {paymentData?.orderNo}
          </p>
        </div>
      );
    }

    // Alipay - redirect + QR
    if (modalState === "alipay") {
      return (
        <div className="flex flex-col items-center py-6 gap-5">
          <div className="flex items-center gap-2 text-sm text-gray-3">
            <Loader2 size={16} className="animate-spin" />
            <span>{t("payment.alipayRedirect")}</span>
          </div>
          <QRCodePlaceholder label={t("payment.alipayQrcode")} />
          <div className="flex items-center gap-2 text-sm text-gray-3">
            <Clock size={14} />
            <span>
              {t("payment.countdown")}: {formatCountdown(countdown)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-4">
            <Loader2 size={14} className="animate-spin" />
            <span>{t("payment.polling")}</span>
          </div>
          <p className="text-xs text-gray-5">
            {t("payment.orderNo")}: {paymentData?.orderNo}
          </p>
        </div>
      );
    }

    // Stripe - processing
    if (modalState === "stripe") {
      return (
        <div className="flex flex-col items-center py-6 gap-5">
          <div className="w-48 h-48 mx-auto rounded-xl bg-dark-3/50 border border-glass-border flex flex-col items-center justify-center gap-3">
            <CreditCard size={48} className="text-light-3" />
            <p className="text-sm text-gray-3">{t("payment.stripeRedirect")}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-3">
            <Clock size={14} />
            <span>
              {t("payment.countdown")}: {formatCountdown(countdown)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-4">
            <Loader2 size={14} className="animate-spin" />
            <span>{t("payment.polling")}</span>
          </div>
          <p className="text-xs text-gray-5">
            {t("payment.orderNo")}: {paymentData?.orderNo}
          </p>
        </div>
      );
    }

    // Crypto - wallet address
    if (modalState === "crypto") {
      return (
        <div className="flex flex-col items-center py-6 gap-4 w-full">
          <div className="w-full p-4 rounded-xl bg-dark-3/50 border border-glass-border space-y-3">
            <div>
              <p className="text-xs text-gray-4 mb-1">
                {t("payment.cryptoAddress")}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-light-3 font-mono bg-dark-2 p-2.5 rounded-lg border border-glass-border break-all">
                  {paymentData?.walletAddress}
                </code>
                <button
                  onClick={() =>
                    handleCopy(paymentData?.walletAddress || "")
                  }
                  className="flex-shrink-0 p-2.5 rounded-lg bg-dark-2 border border-glass-border text-gray-4 hover:text-light-3 hover:border-white/15 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-dark-2 border border-glass-border">
                <p className="text-xs text-gray-4 mb-0.5">
                  {t("payment.amount")}
                </p>
                <p className="text-sm text-light-3 font-medium">
                  {paymentData?.amount} USDT
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-dark-2 border border-glass-border">
                <p className="text-xs text-gray-4 mb-0.5">
                  {t("payment.network")}
                </p>
                <p className="text-sm text-light-3 font-medium">
                  {paymentData?.network || "TRC20"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-3">
            <Clock size={14} />
            <span>
              {t("payment.countdown")}: {formatCountdown(countdown)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-4">
            <Loader2 size={14} className="animate-spin" />
            <span>{t("payment.polling")}</span>
          </div>
          <p className="text-xs text-gray-5">
            {t("payment.orderNo")}: {paymentData?.orderNo}
          </p>
        </div>
      );
    }

    return null;
  };

  // ============================================
  // Main render
  // ============================================

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-4 hover:text-light-3 transition-colors mb-8"
        >
          <ArrowLeft size={16} /> {t("common.backToHome")}
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Product info */}
          <div className="lg:col-span-3">
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="badge badge-dark">{category?.name}</span>
                <span className="badge badge-dark">
                  {product.stockType === "one_time"
                    ? t("product.oneTime")
                    : t("product.repeatable")}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-light-3 mb-4">
                {product.name}
              </h1>
              <p className="text-gray-3 leading-relaxed mb-6">
                {product.description}
              </p>
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-dark-3/50 border border-glass-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-light-3">{stock}</p>
                  <p className="text-xs text-gray-4">{t("product.inStock")}</p>
                </div>
                <div className="text-center border-x border-glass-border">
                  <p className="text-lg font-bold text-light-3">
                    {product.stockType === "one_time"
                      ? t("product.autoDelivery")
                      : t("product.manualDelivery")}
                  </p>
                  <p className="text-xs text-gray-4">{t("product.delivery")}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-success">✓</p>
                  <p className="text-xs text-gray-4">{t("product.verified")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Purchase panel */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 sticky top-24">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-light-3">
                  {t("common.currency")}
                  {product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-4">
                  {t("product.perAccount")}
                </span>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm text-gray-4 mb-2">
                  {t("common.quantity")}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-dark-3 border border-glass-border flex items-center justify-center text-gray-4 hover:text-light-3 hover:border-white/15 transition-colors cursor-pointer"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-lg font-medium text-light-3 w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-dark-3 border border-glass-border flex items-center justify-center text-gray-4 hover:text-light-3 hover:border-white/15 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm text-gray-4 mb-2">
                  {t("product.deliveryEmail")}
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium"
                />
              </div>

              {/* Payment method */}
              <div className="mb-6">
                <label className="block text-sm text-gray-4 mb-2">
                  {t("product.paymentMethod")}
                </label>
                <div
                  className={`grid gap-3 ${
                    paymentChannels.length <= 2
                      ? "grid-cols-2"
                      : paymentChannels.length <= 4
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  }`}
                >
                  {paymentChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setPaymentMethod(ch.code)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer text-sm ${
                        paymentMethod === ch.code
                          ? "bg-white/[0.06] border-white/15 text-light-3"
                          : "bg-dark-3 border-glass-border text-gray-4 hover:border-white/10"
                      }`}
                    >
                      {paymentIcons[ch.code] || <CreditCard size={16} />}
                      {paymentLabels[ch.code] || ch.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total & Pay */}
              <div className="pt-4 border-t border-glass-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-4">
                    {t("common.total")}
                  </span>
                  <span className="text-xl font-bold text-light-3">
                    {t("common.currency")}
                    {total.toFixed(2)}
                  </span>
                </div>
                <button
                  className="btn-primary w-full text-sm py-3 flex items-center justify-center gap-2"
                  disabled={stock === 0}
                  onClick={handlePay}
                >
                  <Zap size={16} /> {t("product.payNow")}
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-xs text-gray-4">
                  <Shield size={12} /> {t("product.encrypted")}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-4">
                  <Zap size={12} /> {t("product.instant")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={modalState !== "idle"}
        onClose={
          modalState === "success" ? handleCloseModal : handleCloseModal
        }
        title={
          modalState === "success"
            ? t("payment.success")
            : modalState === "error"
            ? t("payment.error")
            : modalState === "expired"
            ? t("payment.expired")
            : t("payment.title")
        }
        maxWidth="max-w-md"
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
