"use client";

import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CustomerChatWidget from "@/components/chat/customer-chat-widget";
import { useLocaleStore } from "@/store/use-locale-store";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useLocaleStore();

  // Sync locale to the i18n module
  useEffect(() => {
    const { setLocale } = require("@/lib/i18n");
    setLocale(locale);
  }, [locale]);

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CustomerChatWidget />
    </>
  );
}
