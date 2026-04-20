import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 text-neutral-300">
      <div className="mw-container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* COLUMNA 1: BRANDING */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg">MetalWolft</h4>
            <p className="text-sm leading-relaxed text-neutral-400">
              Fabricación propia de rejas metálicas a medida. Seguridad, durabilidad y diseño para tu hogar.
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">
              © {new Date().getFullYear()} MetalWolft
            </p>
          </div>

          {/* COLUMNA 2: NAVEGACIÓN */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Explorar</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/rejas-para-ventanas" className="text-sm hover:text-[var(--mw-primary)] transition-colors">Ver Modelos</Link>
              <Link href="/#categorias" className="text-sm hover:text-[var(--mw-primary)] transition-colors">Categorías</Link>
              <Link href="/blog" className="text-sm hover:text-[var(--mw-primary)] transition-colors">Blog y consejos</Link>
            </nav>
          </div>

          {/* COLUMNA 3: SOPORTE */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Soporte</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/guia-medicion" className="text-sm hover:text-[var(--mw-primary)] transition-colors">Cómo medir</Link>
              <Link href="/contacto" className="text-sm hover:text-[var(--mw-primary)] transition-colors">Contacto</Link>
              <Link href="/faq" className="text-sm hover:text-[var(--mw-primary)] transition-colors">Preguntas frecuentes</Link>
            </nav>
          </div>

          {/* COLUMNA 4: INFO */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Fabricación</h4>
            <div className="text-sm text-neutral-400">
              <p>Envío a toda España</p>
              <p className="mt-2 text-white font-semibold">Diseño y metalurgia artesanal</p>
            </div>
          </div>
        </div>

        {/* LÍNEA FINAL */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500">Hecho con precisión en España</p>
          <div className="flex gap-6 text-xs text-neutral-500">
            <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}