"use client"; // Para manejar el scroll effect
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AuthNav from "./AuthNav";
import CartNav from "./CartNav";
import { Menu, X } from "lucide-react"; // Para el menú móvil

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Efecto para cambiar el estilo al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-[100] w-full transition-all duration-300 ${isScrolled
          ? "bg-white/90 py-3 shadow-md backdrop-blur-md"
          : "bg-transparent py-5"
        }`}
    >
      <div className="mw-container flex items-center justify-between">
        {/* LOGO */}
        {/* LOGO REFORMADO */}
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="relative h-10 w-40 md:h-12 md:w-48 transition-transform duration-300 hover:scale-105">
            <img
              src="https://res.cloudinary.com/dewanllxn/image/upload/v1750127736/logo-metal-wolft_zlbzng.avif"
              alt="MetalWolft Logo"
              className={`h-full w-full object-contain transition-all duration-300 ${!isScrolled
                  ? "drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" // Añade sombra en lugar de invertir para que se vea sobre la foto
                  : ""
                }`}
            />
          </div>
        </Link>

        {/* NAVIGATION DESKTOP */}
        <nav className="hidden items-center gap-8 lg:flex">
          {[
            { name: "Modelos", href: "/rejas-para-ventanas" },
            { name: "Categorías", href: "/#categorias" },
            { name: "Cómo medir", href: "/guia-medicion" },
            { name: "Contacto", href: "/contacto" },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-[var(--mw-primary)] ${isScrolled ? "text-neutral-800" : "text-white"
                }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isScrolled ? "text-neutral-800" : "text-white"}`}>
            <AuthNav />
            <div className="h-6 w-[1px] bg-neutral-300/30 mx-2" />
            <CartNav />
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={isScrolled ? "text-neutral-900" : "text-white"} />
            ) : (
              <Menu className={isScrolled ? "text-neutral-900" : "text-white"} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[-1] flex flex-col bg-white p-8 pt-24 lg:hidden">
          <nav className="flex flex-col gap-6">
            <Link href="/rejas-para-ventanas" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Modelos</Link>
            <Link href="/#categorias" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Categorías</Link>
            <Link href="/guia-medicion" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Cómo medir</Link>
            <Link href="/contacto" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Contacto</Link>
          </nav>
        </div>
      )}
    </header>
  );
}