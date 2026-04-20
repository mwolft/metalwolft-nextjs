"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import AuthNav from "./AuthNav";
import CartNav from "./CartNav";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { name: "Modelos", href: "/rejas-para-ventanas" },
  { name: "Categorias", href: "/#categorias" },
  { name: "Como medir", href: "/guia-medicion" },
  { name: "Contacto", href: "/contacto" },
];

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const isSolid = !isHomePage || isScrolled;
  const headerClassName = [
    styles.header,
    isSolid ? styles.headerSolid : styles.headerTransparent,
  ].join(" ");
  const navLinkClassName = [
    styles.navLink,
    isSolid ? styles.navLinkSolid : styles.navLinkTransparent,
  ].join(" ");
  const accountClassName = [
    styles.accountArea,
    isSolid ? styles.accountAreaSolid : styles.accountAreaTransparent,
  ].join(" ");
  const mobileButtonClassName = [
    styles.mobileToggle,
    isSolid ? styles.mobileToggleSolid : styles.mobileToggleTransparent,
  ].join(" ");

  return (
    <header className={headerClassName}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logoLink} aria-label="MetalWolft">
          <img
            src="https://res.cloudinary.com/dewanllxn/image/upload/v1750127736/logo-metal-wolft_zlbzng.avif"
            alt="MetalWolft"
            className={[
              styles.logoImage,
              !isSolid ? styles.logoImageOverlay : "",
            ].join(" ")}
          />
        </Link>

        <nav className={styles.navDesktop} aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.name} href={link.href} className={navLinkClassName}>
              {link.name}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <div className={accountClassName}>
            <AuthNav />
            <span className={styles.divider} aria-hidden="true" />
            <CartNav />
          </div>

          <button
            className={mobileButtonClassName}
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className={styles.mobileMenu} id="mobile-navigation">
          <nav className={styles.mobileNav} aria-label="Principal movil">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
