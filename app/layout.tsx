import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PF Scoring - Project Finance",
  description:
    "Application de Scoring Project Finance - Conforme IFC, EBRD, Basel, Bank Al-Maghrib",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
