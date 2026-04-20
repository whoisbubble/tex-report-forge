import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MakeTexChigga",
  description: "Редактор отчетов с генерацией LaTeX"
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
