import Link from "next/link";
import { ShieldCheck, Ruler, Factory, ArrowRight, CheckCircle2 } from "lucide-react";
import { getCategories } from "@/lib/categories";

export const metadata = {
  title: "Rejas para ventanas a medida | MetalWolft",
  description: "Fabricación propia de rejas metálicas a medida. Seguridad y diseño para tu hogar con envío a toda España.",
};

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <main>
      {/* SECTION 1: HERO SECTION - IMPACTO VISUAL */}
      <section className="relative min-h-[85vh] w-full flex items-center overflow-hidden bg-neutral-900">
        {/* Imagen de fondo con Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://res.cloudinary.com/dewanllxn/image/upload/v1776668261/IMG_20220409_151947_kui2ws.jpg"
            alt="Reja para ventana a medida instalada"
            className="h-full w-full object-cover opacity-60" // Bajamos opacidad para legibilidad
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 via-neutral-900/40 to-transparent" />
        </div>

        <div className="mw-container relative z-10 py-20">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center rounded-full bg-[var(--mw-primary)]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--mw-primary-border)] backdrop-blur-md mb-6 border border-[var(--mw-primary)]/30">
              Fabricación directa desde España
            </span>
            <h1 className="text-white text-5xl md:text-6xl lg:text-7xl mb-6">
              Seguridad que se <span className="text-[var(--mw-primary)]">integra</span> en tu hogar
            </h1>
            <p className="text-neutral-200 text-xl md:text-2xl mb-10 leading-relaxed font-light">
              Diseñamos y fabricamos rejas metálicas a medida con acabados premium. Protección robusta con estética minimalista.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/rejas-para-ventanas" className="mw-button-primary !px-8 !py-4 text-base shadow-lg shadow-[var(--mw-primary)]/20">
                Configurar mi reja
              </Link>
              <Link href="#categorias" className="mw-button-secondary !bg-white/10 !text-white !border-white/20 backdrop-blur-md hover:!bg-white/20 !px-8 !py-4 text-base">
                Ver modelos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DIFERENCIADORES - CONFIANZA */}
      <section className="relative z-20 -mt-12">
        <div className="mw-container">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Máxima Seguridad", desc: "Acero de alta resistencia y soldaduras reforzadas para tu tranquilidad." },
              { icon: Ruler, title: "Ajuste Milimétrico", desc: "Olvídate de holguras. Fabricamos exactamente con las medidas de tu hueco." },
              { icon: Factory, title: "Precio de Fábrica", desc: "Sin intermediarios. Calidad artesanal directa a tu puerta desde nuestro taller." }
            ].map((item, i) => (
              <div key={i} className="mw-card p-8 flex flex-col items-center text-center hover:border-[var(--mw-primary-border)]">
                <div className="mb-4 rounded-2xl bg-[var(--mw-primary-soft)] p-4">
                  <item.icon className="h-8 w-8 text-[var(--mw-primary)]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: CATEGORÍAS - NAVEGACIÓN VISUAL */}
      <section id="categorias" className="mw-section">
        <div className="mw-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <span className="mw-badge mb-4">Catálogo</span>
              <h2 className="text-4xl">Encuentra el estilo perfecto</h2>
              <p className="mt-4 text-lg">
                Desde soluciones fijas hasta sistemas abatibles. Todos nuestros modelos son personalizables en color y dimensiones.
              </p>
            </div>
            <Link href="/rejas-para-ventanas" className="text-[var(--mw-primary)] font-bold flex items-center gap-2 hover:underline">
              Ver todos los modelos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <article key={category.id} className="group mw-card overflow-hidden border-none shadow-none bg-neutral-50 hover:bg-white">
                <div className="relative h-72 overflow-hidden rounded-2xl">
                  {category.image_url ? (
                    <img
                      alt={category.name}
                      src={category.image_url}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-200">Sin imagen</div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                </div>

                <div className="py-6 px-2">
                  <h3 className="text-2xl font-bold">{category.name}</h3>
                  <p className="mt-3 line-clamp-2 text-neutral-600 italic">
                    {category.description || "Diseño exclusivo de alta durabilidad."}
                  </p>
                  <Link
                    href={`/${category.slug}`}
                    className="mt-6 inline-flex items-center gap-2 font-bold text-[var(--mw-primary)]"
                  >
                    Personalizar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PASOS / CTA FINAL - CIERRE DE VENTA */}
      <section className="mw-section bg-neutral-900 text-white overflow-hidden relative">
        {/* Decoración sutil de fondo */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[var(--mw-primary)]/10 skew-x-12 translate-x-20" />
        
        <div className="mw-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-white text-4xl md:text-5xl mb-8">Tu reja lista en 3 pasos</h2>
              <div className="space-y-8">
                {[
                  { step: "01", t: "Mide tu ventana", d: "Sigue nuestra guía sencilla para tomar las medidas." },
                  { step: "02", t: "Elige tu diseño", d: "Selecciona el modelo y el color de acabado." },
                  { step: "03", t: "Recibe e instala", d: "Te lo enviamos listo para montar sin obras complejas." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6">
                    <span className="text-4xl font-black text-[var(--mw-primary)] opacity-50">{item.step}</span>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-2">{item.t}</h4>
                      <p className="text-neutral-400">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 text-neutral-900 shadow-2xl">
              <h3 className="text-3xl mb-4">¿Hablamos de tu proyecto?</h3>
              <p className="mb-8 text-neutral-600">Si tienes dudas sobre las medidas o necesitas un diseño especial, nuestro equipo técnico te asesora sin compromiso.</p>
              
              <ul className="space-y-4 mb-10">
                {['Presupuesto inmediato online', 'Garantía de 10 años en metal', 'Soporte técnico por WhatsApp'].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" /> {text}
                  </li>
                ))}
              </ul>

              <Link href="/contacto" className="mw-button-primary w-full !py-4 text-lg">
                Solicitar Asesoría Gratuita
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}