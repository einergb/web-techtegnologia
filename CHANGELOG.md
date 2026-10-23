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
