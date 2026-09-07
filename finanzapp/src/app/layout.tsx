import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanzApp — Tu Asesor Financiero Personal",
  description: "Gestiona tu salario, deudas y gastos. Calcula tu capacidad real de ahorro, prioriza pagos y toma mejores decisiones financieras.",
  keywords: ["finanzas personales", "presupuesto", "deudas", "ahorro", "IESS", "Ecuador"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
