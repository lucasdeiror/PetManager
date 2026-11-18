import type { Metadata } from "next";
import localFont from "next/font/local";
import { TemaProvider } from "../shared/tela/tema";
import "./globals.css";

// Local para o build não depender do Google Fonts (O1). Inter variável, subset latin, OFL.
const inter = localFont({ src: "./fonts/inter-latin.woff2", weight: "100 900", display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PetManager",
  description: "Agenda, clientes, vacinas, estoque e vendas do seu pet shop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=null;try{t=localStorage.getItem('tema');}catch(e){}if(t!=='escuro'&&t!=='claro')t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'escuro':'claro';document.documentElement.setAttribute('data-theme',t==='escuro'?'dark':'light');if(t==='escuro'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-150">
        <TemaProvider>{children}</TemaProvider>
      </body>
    </html>
  );
}
