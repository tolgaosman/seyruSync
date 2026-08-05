import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
