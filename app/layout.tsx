// app/layout.tsx
import type { ReactNode } from "react";
import Header from "../components/mw-layout/Header";
import Footer from "../components/mw-layout/Footer";
import "./globals.css";

export const metadata = {
  title: {
    default: "MetalWolft",
    template: "%s | MetalWolft",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
