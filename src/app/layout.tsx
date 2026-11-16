import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Local para o build não depender do Google Fonts (O1). Inter variável, subset latin, OFL.
const inter = localFont({ src: "./fonts/inter-latin.woff2", weight: "100 900", display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PetManager",
  description: "Agenda, clientes, vacinas, estoque e vendas do seu pet shop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
