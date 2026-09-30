import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDI – Sistema de Órdenes y Turnos TC/RM | Hospital Eva Perón",
  description: "Servicio de Diagnóstico por Imágenes - H.E. Eva Perón",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {/* Banner de advertencia obligatorio */}
        <div className="bg-red-700 text-white text-center py-1.5 px-4 text-xs font-bold sticky top-0 z-50 shadow">
          ⚠️ SISTEMA EN DESARROLLO — DATOS FICTICIOS — Hospital Escuela Eva Perón (Granadero Baigorria)
        </div>
        {children}
      </body>
    </html>
  );
}
