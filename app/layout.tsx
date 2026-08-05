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
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f6f5f0] text-[#111814] selection:bg-[#063b28] selection:text-white">
        {children}
      </body>
    </html>
  );
}
