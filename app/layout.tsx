import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoBarem KKTC — Seyrüsefer Vergisi & TCO Hesaplayıcı",
  description:
    "Kuzey Kıbrıs Türk Cumhuriyeti araç seyrüsefer vergisini ağırlık baremine göre hesaplayın ve 5 yıllık toplam sahip olma maliyetini karşılaştırın.",
  keywords: [
    "KKTC seyrüsefer vergisi",
    "araç vergisi hesaplama",
    "barem tablosu",
    "TCO karşılaştırma",
    "Kuzey Kıbrıs araç vergisi",
  ],
  authors: [{ name: "AutoBarem KKTC" }],
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#161a23" },
  ],
};

/**
 * İlk boyamadan ÖNCE çalışır: kayıtlı temayı `<html data-theme>` üzerine yazar.
 * Olmazsa sayfa bir kare yanlış temayla görünür (tema flaşı).
 */
const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('autocalc-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      className={`h-full ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-base text-ink antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
