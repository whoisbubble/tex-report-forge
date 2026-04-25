import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tex.bostoncrew.ru",
  description: "ASCII-редактор отчётов с генерацией LaTeX"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
