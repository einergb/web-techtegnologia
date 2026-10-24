# Changelog

Los cambios de este archivo describen la implementación presente en el repositorio.

## [0.1.0] - 2026-10-23

### Añadido

- Aplicación de tienda con Next.js App Router, React, TypeScript y Tailwind CSS.
- Páginas de inicio, catálogo y detalle de producto conectadas con los endpoints públicos de la API.
- Búsqueda, filtros de categoría y paginación del catálogo.
- Inicio de sesión y proxy de API del lado del servidor, con tokens de sesión en cookies `httpOnly`.
- Carrito, checkout con direcciones y cupones, creación de pedidos e inicio de sesión de pago.
- Historial y detalle de pedidos.
- Panel con reportes de inventario y ventas protegidos por autorización de la API.
- Metadatos para páginas públicas y directivas para excluir páginas privadas de los índices.
- Archivo `.env.example` y documentación de configuración local.

### Seguridad e integración

- La API es la autoridad para precios, impuestos, costos de envío, existencias y estado del pago.
- Las imágenes se cargan desde el `imagenUrl` proporcionado por la API.
- Las peticiones de catálogo no agregan una caché local prolongada de precio o stock.
- Los tokens no se guardan en `localStorage`; las operaciones protegidas se reenvían desde el servidor.
- La página de retorno de pago no altera el estado del pedido; la confirmación pertenece al backend y su webhook.

### Verificación

- Se revisaron OpenAPI y endpoints públicos de lectura.
- `git diff --check` pasó sin errores.
- Build, lint y typecheck pendientes: Node.js y npm no están disponibles en el entorno de trabajo.
- No se probaron operaciones autenticadas ni pagos reales en producción.

## [0.2.0] - 2026-10-23

### Endurecimiento y despliegue

- Next.js usa salida standalone, allowlist de hosts de imágenes y cabeceras básicas de seguridad.
- Las rutas que renderizan datos de API son dinámicas; la URL del backend se resuelve en ejecución.
- Se endureció el proxy con allowlist, validación de rutas y Origin, métodos acotados, límite de cuerpo, timeout y filtrado de cabeceras.
- Se añadió reenvío de IP validada, endpoint de salud, imagen Docker multi-stage y compose de ejemplo para `homelab_net`.
- Se añadieron pruebas unitarias para rutas, allowlist, Origin, IP y cabeceras.

### Verificación pendiente

- No fue posible correr build, tests, lint, typecheck ni Docker en este entorno, que carece de Node.js/npm y Docker.
- El proyecto no tenía `package-lock.json`; el Dockerfile solicita `npm ci`, por lo que falta generar y revisar el lockfile antes de construir la imagen.

## [0.3.0] - 2026-10-23

### Corregido

- El proxy construye el cuerpo reenviado en un `ArrayBuffer` explícito para satisfacer el tipo `BodyInit` sin alterar el límite ni la respuesta 413.

### Verificación

- No se pudo ejecutar typecheck en esta sesión: `node` y `npm` no están disponibles en el entorno.

## [0.4.0] - 2026-10-23

### Corregido

- Se cambió ESLint a `FlatCompat` y las configuraciones `next/core-web-vitals` y `next/typescript`, compatibles con Next 15.
- Se verificó en los manifiestos que `eslint-config-next` resuelve a 15.5.28 junto con Next 15.5.28. `@eslint/eslintrc` 3.3.7 ya está en el lockfile como dependencia de ESLint, por lo que no se añadió otra dependencia.

### Verificación

- No se pudo ejecutar lint ni build en esta sesión: `node`, `npm` y `docker` no están disponibles en el entorno.

## [0.5.0] - 2026-10-24

### Actualizado

- Se alinearon tokens de color, tipografía, espaciado y radios con la configuración HTML de Stitch (paleta A); se empaquetan Outfit y Hanken Grotesk con `next/font` y se quitaron las solicitudes de Google Fonts en tiempo de ejecución.
- Se rediseñaron encabezado, footer, inicio, catálogo, detalle de producto, carrito, pasos de checkout y retorno de pago para escritorio y móvil.
- El inicio, catálogo y detalle usan productos/categorías de la API; las imágenes se muestran únicamente desde HTTPS y hosts permitidos, y se conserva el `imagenUrl` recibido.
- Se retiraron elementos visuales sin respaldo (badges promocionales, reseñas y ofertas); los indicadores administrativos siguen mostrando datos de reportes de la API. La página de detalle agrega productos relacionados del endpoint de catálogo.
- El encabezado consulta carrito y autorización administrativa a través del proxy; el sidebar de administración enlaza solo a las secciones de reportes conectadas.
- El panel dibuja la serie diaria cuando existe; si la API no entrega datos diarios, muestra una tabla vacía con ese estado en lugar de inventar valores.
- Los precios se presentan como `$ 189.900 COP` con agrupación `es-CO`. El CTA de carrito conserva el retorno al producto al iniciar sesión.
- Los textos de beneficios de la portada viven en `src/lib/store-content.ts` y requieren aprobación del propietario.

### Pendientes de datos o contrato

- El DTO documentado del producto no garantiza `marca` ni `descripcion`; se muestran solo cuando existen. El contrato de reseñas no está documentado y la petición directa a la API devolvió 403, por eso se omitió el bloque de valoraciones.
- El catálogo conserva búsqueda por texto, categoría y paginación; filtros adicionales y ordenamiento no aparecen en el contrato consultado.
- No se habilitaron CRUD de productos, gestión de pedidos, despachos ni cupones en el panel; aunque existen algunos endpoints backend, no están expuestos por la allowlist del proxy actual.
- No se confirmó en vivo el DTO de configuración ni contenido de productos porque la API pública devolvió 403.

### Verificación

- `git diff --check` pasó y la búsqueda en `src` no encontró `href="#"`, llamadas a Google Fonts, `googleusercontent`, la paleta B, “Ofertas” ni `⌘K`.
- Se intentaron `npm run typecheck`, `npm run lint`, `npm test` y `API_BASE_URL=http://127.0.0.1:1 npm run build`; todos terminaron con código 127 porque `npm` no está disponible (`npm: command not found`). Tampoco se encontró `node`, navegador ni Playwright, así que no hubo capturas ni pruebas de estilos computados.
- Se preservó el cambio previo de `docker-compose.yml`; no se crearon commits.
