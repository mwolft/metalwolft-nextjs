# MetalWolft v2 — Frontend (Next.js)

Frontend oficial de **MetalWolft** basado en **Next.js (App Router + TypeScript)**.
Este proyecto es una **reescritura limpia** orientada a SEO, rendimiento y mantenibilidad, y está diseñado para trabajar con un **backend independiente en Flask**, que actúa como única fuente de verdad.

---

## 🎯 Objetivo del proyecto

MetalWolft no es un e‑commerce genérico. Es un sistema de venta de **productos metálicos a medida**, donde:

* El SEO es crítico
* El cálculo de precios es complejo
* La coherencia entre carrito, pago y factura es obligatoria

Por ello, este frontend **no contiene lógica de negocio**.

---

## 🧠 Filosofía de arquitectura

* **Separación estricta de responsabilidades**
* Next.js se encarga de:

  * Renderizado (SSR / SSG)
  * SEO
  * Experiencia de usuario
* Flask se encarga de:

  * Autenticación (JWT)
  * Precios y validaciones
  * Carrito y pedidos
  * Stripe
  * Facturación
  * Emails

> ⚠️ El frontend **nunca** calcula precios finales ni crea pedidos.

---

## 🧱 Estructura del proyecto

```txt
app/            # Rutas, páginas y layouts (App Router)
components/     # Componentes UI reutilizables
lib/            # Cliente API, auth y helpers (frontera con Flask)
fonts/          # Tipografías locales
```

---

## 🔌 Puertos de desarrollo

| Servicio | Puerto |
| -------- | ------ |
| Frontend | 3000   |
| Backend  | 3001   |

El frontend consume el backend vía HTTP. No existe lógica duplicada.

---

## ⚙️ Variables de entorno

Las variables necesarias están documentadas en:

```bash
.env.example
```

Ejemplo:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

⚠️ **Nunca** subas un `.env` real al repositorio.

---

## 🚀 Desarrollo local

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en:

```txt
http://localhost:3000
```

---

## 🚫 Qué NO es este proyecto

* No es un template genérico de Next.js Commerce
* No usa Shopify ni proveedores externos
* No replica lógica de backend

---

## 📄 Estado del proyecto

**MetalWolft v2 — Fase 6 completada**

### 🧹 Limpieza y normalización

* Eliminado todo el código heredado de Next.js Commerce (Shopify, grid, carousel, cart demo, layout antiguo).
* Eliminados providers globales y lógica de demo en `app/layout.tsx`.
* Home (`app/page.tsx`) reescrita como base SEO mínima y coherente con el negocio.
* OpenGraph desacoplado de Tailwind, SVGs y fuentes del template.

### 🧱 Estructura resultante

```
app/
├── page.tsx
├── layout.tsx
├── rejas-para-ventanas/
│   ├── page.tsx
│   ├── fijas/page.tsx
│   ├── abatibles/page.tsx
│   └── correderas/page.tsx
├── carrito/page.tsx
├── checkout/page.tsx
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── robots.ts
├── sitemap.ts
└── opengraph-image.tsx

components/
└── mw-layout/
    ├── Header.tsx
    ├── Header.module.css
    ├── Footer.tsx
    └── Footer.module.css

lib/
├── constants.ts
├── type-guards.ts
└── utils.ts
```

### 🎨 Estilos

* CSS nativo con **CSS Modules**.
* Grid y Flexbox.
* Sin frameworks de estilos.

### 🔌 Puertos de desarrollo

* Frontend (Next.js): **3000**
* Backend (Flask): **3001**

El proyecto queda listo para definir el contrato frontend–backend y comenzar la integración con Flask.
