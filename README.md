# MetalWolft v2

MetalWolft v2 es un sistema de venta configurable para rejas y productos metalicos a medida, con frontend en Next.js y backend en Flask desacoplados.

No es un ecommerce generico ni una demo. El sistema esta pensado para SEO fuerte, calculo economico centralizado, operativa logistica real y crecimiento futuro.

## Vision

MetalWolft v2 se concibe como:

- un sistema de venta configurable
- un nucleo de pricing autoritativo en backend
- una base para pedidos, cobros y documentacion separados
- una arquitectura preparada para escalar a mas reglas, mas pagos y mas paises

Principios no negociables:

- El backend es la fuente de verdad absoluta.
- El frontend nunca calcula precios finales ni crea pedidos por su cuenta.
- El precio se congela al crear la `Order`.
- `Stripe` no es el centro del sistema: `Payment` y `Order` son entidades separadas.
- No se generan facturas automaticamente.
- Se generan albaranes y la factura queda como proceso documental posterior.

## Stack

### Frontend

- Next.js App Router
- TypeScript
- SSR/SSG para SEO
- Cookies `httpOnly` para autenticacion

Responsabilidades del frontend:

- renderizar
- pedir datos al backend
- mostrar configuraciones, resumenes y estados
- confirmar acciones del usuario

El frontend nunca:

- calcula precios finales
- valida reglas economicas
- congela importes
- crea pedidos de forma autoritativa

### Backend

- Flask
- SQLAlchemy
- Alembic
- Flask-Admin

Arquitectura por capas:

- `routes`: reciben requests y devuelven responses
- `services`: contienen la logica real de negocio
- `models`: persistencia
- `utils`: helpers, autenticacion y validaciones
- `admin`: gestion interna

Todo calculo economico vive en backend.

## Regla central de negocio

El corazon del sistema es `pricing_service`.

`pricing_service` debe:

- validar dimensiones
- calcular area en m2
- aplicar `price_m2`
- aplicar suplementos futuros
- aplicar penalizaciones futuras
- calcular envio
- devolver un desglose estructurado

El servicio nunca debe devolver solo un numero final. Debe devolver, como minimo, algo del estilo:

```json
{
  "subtotal_producto": 0,
  "shipping_base": 0,
  "shipping_surcharge": 0,
  "total": 0
}
```

Esto permite transparencia, auditoria, soporte, documentacion correcta y evolucion futura.

## Modelo de producto

MetalWolft no funciona como un catalogo tradicional. El producto es configurable.

Base actual acordada:

- modelo de reja
- ancho personalizado
- alto personalizado
- `price_m2`

Formula inicial:

```txt
precio = ancho x alto x precio_m2
```

Evolucion prevista:

- suplementos
- penalizaciones
- reglas logisticas mas avanzadas

## Reglas de envio documentadas

Envio estandar actual:

- si `subtotal < 150 EUR` -> `17 EUR`
- si `subtotal >= 150 EUR` -> `0 EUR`

Sobrecostes por tamano actualmente documentados:

- si un lado > `175 cm` -> `+49 EUR`
- si suma de lados > `300 cm` -> `+49 EUR`
- si suma de lados > `400 cm` -> `+99 EUR`

Decisiones aun por formalizar:

- si estos tramos son excluyentes o acumulativos
- si aplican por item o por pedido

Regla logistica clave:

- cada reja es una unidad logistica independiente

## Modelo funcional acordado

### Cart

- es editable
- recalcula siempre
- no congela precio

### Order

- se crea en checkout
- congela el contrato economico
- almacena snapshot completo de configuracion y precios

Debe congelar al menos:

- medidas
- precio aplicado
- suplementos
- envio
- total

### Payment

Entidad separada de `Order`.

Metodos previstos:

- Stripe
- Bizum
- transferencia bancaria
- posible PayPal en futuro

Las transferencias se confirmaran manualmente desde admin.

### Albaran

Se genera cuando la `Order` ya esta pagada y entra en preparacion/envio.

### Factura

- no es automatica
- es opcional
- puede agrupar uno o varios albaranes

## Momento de congelacion del precio

Decision oficial:

- el precio se congela al crear la `Order`
- no se congela en `Cart`
- no se congela al iniciar el pago
- no se congela al confirmar el pago

La `Order` representa el contrato economico.

## Responsabilidades por capa

### Next.js

- render
- SEO
- UX
- formularios
- consumo de API

### Flask

- auth / JWT
- pricing
- carrito
- pedidos
- pagos
- albaranes
- facturas
- emails
- integracion con Stripe

## Estado actual del repositorio

Estado actual: bootstrap limpio con integracion parcial.

Ya existe:

- estructura base de frontend con App Router
- catalogo publico de productos
- detalle de producto
- carrito tecnico inicial
- autenticacion base con cookies
- middleware para rutas privadas

Todavia falta implementar el nucleo real del checkout:

- `price_m2` en producto o entidad equivalente de pricing
- `pricing_service v1`
- `CartItem` con configuracion por item
- calculo estructurado de subtotal y envio
- `Order` y `OrderItem` con snapshot congelado
- `Payment` separado
- integracion real de checkout
- estados documentales

Importante: hoy el repositorio no debe interpretarse como un checkout terminado. La arquitectura objetivo esta definida, pero el nucleo economico todavia esta en construccion.

## Estructura del proyecto

```txt
frontend/
  app/           rutas, paginas y SEO
  components/    UI reutilizable
  lib/           frontera con Flask
  fonts/

backend/
  app/
    models/      persistencia
    routes/      capa HTTP
    services/    logica de negocio
    utils/       auth y helpers
    admin/       gestion interna
  migrations/
```

## Puertos de desarrollo

| Servicio | Puerto |
| --- | --- |
| Frontend | 3000 |
| Backend | 3001 |

## Variables de entorno

Las variables necesarias deben documentarse en los `.env.example` de cada parte.

Ejemplo de frontend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Nunca subas un `.env` real al repositorio.

## Desarrollo local

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python run.py
```

## Que no es este proyecto

- No es un template generico de comercio.
- No usa Shopify como fuente de verdad.
- No duplica reglas de negocio en frontend.
- No trata Stripe como el centro de la arquitectura.

## Regla para futuras decisiones

Ante cualquier duda de implementacion:

- si afecta a dinero, decide el backend
- si afecta a contrato economico, decide `Order`
- si afecta a presentacion, decide el frontend
- si una regla parece compleja, se modela en `services`, no en UI

Este README debe leerse como contexto de referencia del proyecto mientras se construye el nucleo real de MetalWolft v2.
