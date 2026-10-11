import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

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
