import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "One - Store | Giày Thể Thao & Sneaker Chính Hãng",
  description: "One - Store (One) — Hệ thống phân phối giày thể thao và sneaker chính hãng Âu - Á.",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo-icon.svg",
  },
};

import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
