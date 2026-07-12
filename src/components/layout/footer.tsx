import Link from "next/link";
import { t } from "@/lib/i18n";

export default function Footer() {
  return (
    <footer className="border-t border-glass-border bg-dark-1">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-bold text-xs">CS</span>
              </div>
              <span className="text-light-3 font-semibold tracking-tight">
                {t("common.siteName")}
              </span>
            </div>
            <p className="text-sm text-gray-3 leading-relaxed">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-medium text-gray-4 mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-3 hover:text-light-3 transition-colors">
                  {t("header.products")}
                </Link>
              </li>
              <li>
                <Link href="/order/query" className="text-sm text-gray-3 hover:text-light-3 transition-colors">
                  {t("header.trackOrder")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-medium text-gray-4 mb-4">{t("footer.support")}</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@cardshop.com" className="text-sm text-gray-3 hover:text-light-3 transition-colors">
                  support@cardshop.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider my-8" />

        <p className="text-xs text-gray-3 text-center">
          {t("footer.copyright", { year: String(new Date().getFullYear()) })}
        </p>
      </div>
    </footer>
  );
}
