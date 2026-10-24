# Plan de implementación — TechStore Colombia

## Auditoría inicial

- El repositorio solo contiene un README mínimo; no había aplicación, gestor de paquetes, frontend ni configuración que conservar.
- El usuario eligió Next.js, React, TypeScript y Tailwind. Se creó una base Next.js con App Router, TypeScript estricto y Tailwind CSS v4.
- El ZIP de Stitch contiene diseños para tienda oficial, catálogo/búsqueda, detalle de producto, carrito/checkout y dos variantes del dashboard; `DESIGN.md` define colores, tipografía y componentes.
- En la auditoría inicial no estaba el backend dentro del workspace. Luego se recibió su README y se pudo consultar el OpenAPI publicado. La rama ya tenía un borrado pendiente de `Readme.md`; se dejó intacto.

## Arquitectura inicial

- Next.js App Router en `src/app`.
- Cliente de lectura HTTP compartido en `src/lib/api.ts`, con URL server-side `API_BASE_URL`, errores HTTP/ProblemDetail y tratamiento de `204`.
- Proxy BFF en `/api/backend/[...path]`: reenvía peticiones al backend, guarda access y refresh tokens en cookies `httpOnly`, y adjunta el bearer token sin exponerlo a JavaScript.
- Fuentes Outfit y Hanken Grotesk; tokens de color derivados de Stitch.

## Pantallas y capacidades

| Pantalla | Estado |
| --- | --- |
| Tienda oficial / home | Implementada; carga configuración, categorías y productos reales. |
| Catálogo / búsqueda | Listado API, filtro por categoría, búsqueda y paginación por páginas de 12. |
| Ficha de producto | Detalle API, `imagenUrl`, atributos, garantía, stock consultado y añadir al carrito. |
| Carrito | Consulta, cantidades, quitar/vaciar, resumen API y manejo de sesión. |
| Checkout | Direcciones existentes/alta, creación de pedido y sesión de Wompi/ePayco; el precio final lo fija el backend. |
| Pedidos / retorno de pago | Historial y detalle; la página de retorno no declara el pago aprobado. |
| Dashboard administrativo | Protección verificada contra API y reportes reales de ventas e inventario; CRUD administrativo pendiente. |
| Cuenta | Login, renovación y cierre de sesión; registro y recuperación pendientes. |

## Contrato de API según README del backend

El README y el OpenAPI publicado confirman `GET /api/catalogo/tienda`, `GET /api/catalogo/categorias`, `GET /api/catalogo/productos?categoriaId=&q=&page=0&size=12` y `GET /api/catalogo/productos/{id}` como rutas públicas. La portada y el catálogo usan listados; la ficha usa el detalle. La API excluye productos inactivos o sin stock del listado, y el detalle devuelve 404 si no hay stock. Las consultas de la interfaz usan `cache: no-store` para no añadir caché de precio/stock. Además se contrastaron respuestas públicas reales: tienda (`envioGratisDesde`, `moneda`, `iva`), categorías, y productos (`precio`, `stockDisponible`, `imagenUrl`).

El OpenAPI confirma DTOs e integra login/refresh/logout; carrito `/api/carrito` y `/api/carrito/items`; direcciones; checkout `POST /api/pedidos`; pedidos; sesiones de pago `POST /api/pagos/sesion`; y reportes administrativos de ventas e inventario. Las pantallas de reseñas, cupones, facturas y CRUD administrativo de productos/pedidos/envíos aún no están implementadas.

El OpenAPI se obtuvo de `https://tiendaapi.codeconheiner.com/v3/api-docs`; el BFF usa ese origen HTTPS por defecto. Para usar servidor local se define `API_BASE_URL=http://localhost:8080`. Como el navegador habla con Next.js y no con la API, CORS no interviene en las peticiones web del BFF; cualquier consumidor directo debe respetar `CORS_ORIGINS`.

## Riesgos y brechas

- Las rutas/DTO usados en el home, catálogo, carrito, direcciones, pedidos, sesiones de pago e informes se cotejaron con el OpenAPI; las respuestas públicas de tienda/categorías/productos se consultaron en producción solo para lectura.
- No se hicieron operaciones autenticadas ni transacciones en el backend de producción. Los flujos protegidos no se han verificado en vivo.
- No se puede implementar sesión, compra, pagos ni operaciones administrativas de forma segura hasta contrastar DTOs, despliegue y reglas reales con OpenAPI.
- El backend entrega JWT y refresh token en JSON y rota refresh tokens; el README recomienda mantener acceso en memoria y proteger el refresh token. No se debe poner el refresh token en `localStorage`.
- La capa Next.js intercepta login, refresh y logout, coloca tokens en cookies `httpOnly` con `SameSite=Lax` y `Secure` en producción, y omite los tokens de la respuesta enviada al cliente. El proxy adjunta `Authorization` a las rutas protegidas. Las llamadas de negocio de carrito/pedido aún requieren DTOs para completar sus pantallas.
- La página `/admin` verifica el permiso consultando `/api/admin/inventario/stock-bajo`; la API sigue siendo la autoridad para el rol y responde 401/403. La estructura del dashboard queda pendiente del DTO de reportes/inventario.
- El registro presenta un bypass CAPTCHA de desarrollo (`captchaToken: "test"` y secreto vacío). Debe corregirse/configurarse en backend antes de exponer el registro en producción.
- Las imágenes de producto se muestran solo si el backend provee `imagenUrl`; no se exponen rutas de almacenamiento.

## Fases siguientes

1. Instalar dependencias y ejecutar build, TypeScript y lint en un entorno con Node.
2. Completar registro/confirmación de correo y revisiones de producto.
3. Completar administración de productos, pedidos, envíos y cupones con todos los estados permitidos.
4. Añadir factura y seguimiento de envíos en la cuenta.
5. Revisar la estrategia de renovación de refresh token ante solicitudes concurrentes.
6. Ejecutar recorridos autenticados y checkout en entorno de pruebas, sin pagos reales.

## Criterios de aceptación iniciales

- La aplicación arranca y compila con Next.js.
- La tienda no usa datos inventados; informa cuando falta `API_BASE_URL` o falla la API.
- La interfaz se adapta a móvil y escritorio, conserva identidad Stitch y mantiene estados accesibles.
- Las operaciones sensibles se completan solo después de confirmar contratos y permisos reales.
