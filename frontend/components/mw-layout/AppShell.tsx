"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

import { CartProvider } from "../cart/CartProvider";
import Footer from "./Footer";
import Header from "./Header";
import styles from "./AppShell.module.css";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const mainClassName = [
    styles.main,
    !isHomePage ? styles.mainWithHeaderOffset : "",
  ].join(" ");

  return (
    <CartProvider>
      <Header />
      <main className={mainClassName}>{children}</main>
      <Footer />
      <Toaster position="top-right" richColors closeButton />
    </CartProvider>
  );
}
