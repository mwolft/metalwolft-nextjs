"use client";

import Link from "next/link";

import styles from "./Header.module.css";
import { useCart } from "../cart/CartProvider";

export default function CartNav() {
  const { cartCount } = useCart();

  const visibleCount =
    cartCount > 99 ? "99+" : String(cartCount);

  return (
    <Link href="/carrito" className={styles.cart} aria-label="Carrito">
      <span className={styles.cartIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 4h2l2.4 10.2a1 1 0 0 0 .98.8h8.84a1 1 0 0 0 .98-.8L21 7H7" />
          <circle cx="10" cy="19" r="1.5" />
          <circle cx="18" cy="19" r="1.5" />
        </svg>
      </span>
      {cartCount > 0 ? (
        <span className={styles.cartBadge}>{visibleCount}</span>
      ) : null}
    </Link>
  );
}
