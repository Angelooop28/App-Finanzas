import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#070F1E" },
  ],
};

export const metadata: Metadata = {
  title: "Fin593 — Inteligencia Financiera Personal (Ecuador)",
  description: "Plataforma líder en gestión de finanzas personales para Ecuador. Rol de pagos con IESS (9.45%), amortización de deudas, control de gastos y metas de ahorro en USD.",
  keywords: ["Fin593", "finanzas personales Ecuador", "IESS", "rol de pagos", "presupuesto", "deudas", "ahorro USD"],
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
