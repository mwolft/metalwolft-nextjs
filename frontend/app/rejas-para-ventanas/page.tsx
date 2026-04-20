import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  HelpCircle,
  Ruler,
  ShieldCheck,
  Palette,
  Info,
  Factory
} from "lucide-react";

import { getCategoryBySlug, getCategories, getProductsByCategory } from "@/lib/categories";
import { getProductPublicPath } from "@/lib/products";
import { getAbsoluteUrl } from "@/lib/site";

const faqItems = [
  {
    question: "¿Cómo se calcula el precio final de una reja para ventana?",
    answer:
      "El precio final depende de las medidas exactas (ancho x alto), el modelo elegido, el tipo de anclaje y el color. En la ficha de cada producto encontrarás un configurador en tiempo real.",
  },
  {
    question: "¿Todas las rejas se fabrican a medida?",
    answer:
      "Sí, en MetalWolft no trabajamos con stock estándar. Cada reja se fabrica desde cero según las dimensiones milimétricas que nos proporciones para asegurar un ajuste perfecto.",
  },
  {
    question: "¿Puedo elegir el color y el tipo de anclaje después?",
    answer:
      "El color y el anclaje se seleccionan en la ficha de producto. Si tienes dudas, puedes elegir un modelo base aquí y ver todas las opciones de personalización antes de añadirlo al carrito.",
  },
];

export default async function RejasParaVentanasPage() {
  const [category, products, categories] = await Promise.all([
    getCategoryBySlug("rejas-para-ventanas"),
    getProductsByCategory("rejas-para-ventanas"),
    getCategories(),
  ]);

  if (!category) notFound();

  const relatedCategories = categories
    .filter((item) => item.slug !== category.slug)
    .slice(0, 3);

  return (
    <main className="bg-white">
      {/* 1. HERO DE CATEGORÍA */}
      <header className="bg-neutral-50 pt-32 pb-16 border-b border-neutral-200">
        <div className="mw-container">
          <div className="max-w-4xl">
            <span className="mw-badge mb-6">Catálogo Profesional</span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8 text-neutral-900">
              Rejas para ventanas <br />
              <span className="text-[var(--mw-primary)]">a medida</span>
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed mb-10 max-w-2xl">
              Explora nuestra selección de modelos metálicos. Configura medidas, acabados y anclajes directamente en la ficha de cada producto.
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                { icon: ShieldCheck, text: "Seguridad Certificada" },
                { icon: Factory, text: "Fabricación Propia" },
                { icon: Ruler, text: "Precisión Milimétrica" }
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-full text-sm font-medium text-neutral-700 shadow-sm">
                  <b.icon className="w-4 h-4 text-[var(--mw-primary)]" />
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN RÁPIDA (Sticky en Desktop) */}
        <nav className="mt-12 border-t border-neutral-200 bg-white/50 backdrop-blur-sm sticky top-[72px] z-40 hidden md:block">
          <div className="mw-container">
            <div className="flex gap-8 py-4 overflow-x-auto no-scrollbar text-sm font-bold uppercase tracking-wider text-neutral-500">
              {['catalogo', 'como-elegir', 'categorias-relacionadas', 'informacion', 'faq'].map((id) => (
                <a key={id} href={`#${id}`} className="hover:text-[var(--mw-primary)] transition-colors whitespace-nowrap">
                  {id.replace('-', ' ')}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* 2. CATÁLOGO DE PRODUCTOS */}
      <section className="mw-section scroll-mt-32" id="catalogo">
        <div className="mw-container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold">Modelos Disponibles</h2>
            <p className="text-neutral-500 mt-2">Haz clic en un modelo para entrar al configurador de medidas.</p>
          </div>

          {!products.length ? (
            <div className="p-12 text-center bg-neutral-50 rounded-[2rem] border border-dashed border-neutral-300 text-neutral-500 font-medium">
              Próximamente nuevos modelos disponibles.
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="group mw-card border-none bg-white overflow-hidden shadow-none hover:shadow-xl transition-all duration-500">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl relative bg-neutral-100">
                    {product.image && (
                      <img
                        alt={product.name}
                        src={product.image}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-900 shadow-sm border border-neutral-100">
                        Top Ventas
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 pb-2">
                    <h3 className="text-2xl font-bold text-neutral-900 group-hover:text-[var(--mw-primary)] transition-colors">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-neutral-600 line-clamp-2 text-sm leading-relaxed">
                      {product.description || "Reja de alta seguridad fabricada en acero reforzado con acabado premium."}
                    </p>
                    <Link
                      href={getProductPublicPath(product)}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-tighter text-neutral-900 group-hover:text-[var(--mw-primary)] transition-colors"
                    >
                      Configurar Medidas <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. GUÍA DE COMPRA (INFO CARDS) */}
      <section className="mw-section bg-neutral-900 text-white scroll-mt-32" id="como-elegir">
        <div className="mw-container">
          <div className="max-w-3xl mb-16">
            <span className="text-[var(--mw-primary)] font-bold uppercase tracking-widest text-xs">Asesoría Técnica</span>
            <h2 className="text-white text-4xl mt-4 italic">¿Cómo elegir tu reja ideal?</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Ruler, t: "Medidas del hueco", d: "Mide el ancho y alto en tres puntos distintos. Usaremos la medida más pequeña para asegurar que encaje." },
              { icon: ShieldCheck, t: "Tipo de anclaje", d: "Elige entre tornillería de seguridad (sin obra) o garras para recibir con mortero (con obra)." },
              { icon: Palette, t: "Acabado final", d: "Pintura al horno de alta resistencia. Elige el RAL que mejor combine con tu carpintería." }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                <item.icon className="w-10 h-10 text-[var(--mw-primary)] mb-6" />
                <h3 className="text-white text-xl font-bold mb-4">{item.t}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQ SECCIÓN MEJORADA */}
      <section className="mw-section scroll-mt-32" id="faq">
        <div className="mw-container max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">Dudas frecuentes</h2>
            <p className="text-neutral-500 mt-4 text-lg">Todo lo que necesitas saber antes de hacer tu pedido.</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="group border border-neutral-200 rounded-2xl bg-white overflow-hidden transition-all hover:border-[var(--mw-primary-border)]">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-neutral-900">
                  <span className="flex items-center gap-4">
                    <HelpCircle className="w-5 h-5 text-[var(--mw-primary)]" />
                    {item.question}
                  </span>
                  <div className="transition-transform group-open:rotate-180">
                    <ArrowRight className="w-5 h-5 rotate-90" />
                  </div>
                </summary>
                <div className="px-6 pb-6 text-neutral-600 leading-relaxed pl-[3.5rem]">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA FINAL */}
      <section className="pb-20">
        <div className="mw-container">
          <div className="bg-[var(--mw-primary)] rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
            {/* Decoración fondo */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

            <div className="relative z-10">
              <h2 className="text-white text-4xl font-black mb-6 tracking-tighter">¿No encuentras el modelo perfecto?</h2>
              <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto font-medium">
                Explora todo nuestro catálogo general o contacta con un técnico para diseños especiales fuera de catálogo.
              </p>
              <Link href="/productos" className="inline-flex items-center gap-3 bg-white text-[var(--mw-primary)] px-10 py-5 rounded-full font-black uppercase tracking-tighter hover:bg-neutral-900 hover:text-white transition-all shadow-xl">
                Ver todos los productos <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}