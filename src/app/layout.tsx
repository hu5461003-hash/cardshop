import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zap534.site";

export const metadata: Metadata = {
  title: {
    default: "CardShop — Premium Digital Accounts",
    template: "%s | CardShop",
  },
  description:
    "Premium digital accounts marketplace. Buy verified Telegram, Twitter, Google accounts securely with instant delivery.",
  keywords: [
    "buy accounts",
    "Telegram accounts",
    "Twitter accounts",
    "Google accounts",
    "digital marketplace",
    "instant delivery",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CardShop",
    title: "CardShop — Premium Digital Accounts",
    description:
      "Premium digital accounts marketplace with instant delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CardShop — Premium Digital Accounts",
    description:
      "Premium digital accounts marketplace with instant delivery.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
