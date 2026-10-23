# TechStore Colombia

Frontend de comercio electrónico para TechStore Colombia, construido con Next.js 15, React 19, TypeScript y Tailwind CSS 4. Consume la API REST de la tienda y deja en el backend las decisiones de precios, impuestos, envíos, inventario y pagos.

## Requisitos

- Node.js 20 o una versión compatible con Next.js 15.
- npm.
- Acceso a la API configurada.

## Inicio local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>. Copia `.env.example` a `.env.local` y ajusta `API_BASE_URL` según el entorno. La API pública desplegada es `https://tiendaapi.codeconheiner.com`; si ejecutas el backend local puedes usar `http://localhost:8080`. `SITE_URL` debe ser el origen público de la tienda.

`API_BASE_URL` se lee en tiempo de ejecución exclusivamente en el servidor. No la conviertas en una variable `NEXT_PUBLIC_*`. El frontend solo se comunica con la API: no accede directamente a PostgreSQL, Redis ni RustFS. Consulta `.env.example` para la configuración disponible.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera la compilación de producción. |
| `npm run start` | Sirve la compilación de producción. |
| `npm run typecheck` | Revisa los tipos de TypeScript. |
| `npm run lint` | Ejecuta ESLint. |
| `npm test` | Ejecuta pruebas unitarias del proxy. |

## Páginas

| Ruta | Función |
| --- | --- |
| `/` | Inicio de la tienda. |
| `/catalogo` | Catálogo con búsqueda, categorías y paginación. |
| `/producto/[id]` | Detalle, imágenes y disponibilidad del producto. |
| `/cuenta` | Inicio de sesión. |
| `/carrito` | Consulta y edición del carrito. |
| `/checkout` | Direcciones, cupón, creación de pedido e inicio de pago. |
| `/pago/exitoso` | Retorno visual desde el proveedor de pagos. El estado real lo confirma el backend. |
| `/pedidos` | Historial de pedidos. |
| `/pedidos/[id]` | Detalle de un pedido. |
| `/admin` | Reportes de inventario y ventas; requiere autorización de administrador en la API. |

Las rutas públicas de catálogo usan renderizado del servidor y metadatos para indexación. Las páginas privadas incluyen directivas para evitar su indexación.

## API y datos

La URL base se centraliza en `src/lib/api-config.ts`. Las páginas de catálogo consultan, entre otros, estos endpoints:

- `GET /api/catalogo/tienda`
- `GET /api/catalogo/categorias`
- `GET /api/catalogo/productos`
- `GET /api/catalogo/productos/{id}`

Las imágenes se muestran usando directamente `imagenUrl` entregado por la API. El frontend no construye ni transforma las URL de imágenes. Las solicitudes de catálogo no mantienen una caché local adicional para evitar presentar precios o existencias desactualizados.

Las solicitudes protegidas del navegador pasan por el proxy del servidor en `src/app/api/backend/[...path]/route.ts`. El proxy adjunta el token de acceso cuando corresponde. La sesión se guarda en cookies `httpOnly`, `SameSite=Lax` y el atributo `Secure` se activa cuando `SITE_URL` comienza con `https://`; el navegador no guarda el token en `localStorage`.

El proxy permite únicamente los prefijos usados por la tienda y los métodos GET, POST, PUT, PATCH y DELETE. Valida rutas para bloquear traversal y codificaciones evasivas, limita los cuerpos (8 MiB por defecto), aplica timeout de 15 segundos y no sigue redirecciones. Reenvía únicamente Authorization desde la cookie de sesión, Content-Type, Accept, X-Request-Id y una IP validada en X-Forwarded-For. Comprueba Origin en solicitudes que modifican datos y descarta Set-Cookie y cabeceras hop-by-hop de las respuestas. La ruta `/api/health` responde sin consultar la API.

La IP del cliente se reenvía en `X-Forwarded-For`; configura el backend para confiar en ese valor únicamente cuando la conexión provenga de este proxy.

El frontend presenta los totales, impuestos, envío, stock y resultados que devuelve la API. Las validaciones del navegador son únicamente una ayuda rápida para el usuario; la API es la autoridad y debe validar cada operación. Los errores de API se presentan en las pantallas correspondientes.

## Pagos

El checkout crea el pedido e inicia la sesión de pago mediante la API. La URL de pago recibida se valida antes de redirigir al usuario. Configura en el backend la URL de retorno para que apunte a `/pago/exitoso` en el dominio desplegado. La página de retorno no marca pedidos como pagados: el backend actualiza el estado después de la confirmación del proveedor mediante su webhook.

No agregues secretos de pasarela, `JWT_SECRET` ni credenciales de almacenamiento al frontend. Cualquier dato enviado al navegador es público.

## Docker en el homelab

El compose de ejemplo publica el frontend en `192.168.0.150:3000` y lo conecta a la red Docker externa `homelab_net`. Ajusta esa IP si el host usa otra dirección. Crea el archivo `.env` del stack (no se versiona) copiando el ejemplo y configura el dominio público:

> El Dockerfile instala dependencias con `npm ci`, que exige `package-lock.json`. Este checkout todavía no incluye ese archivo: genéralo en un entorno con npm (`npm install --package-lock-only`) y versiona el lockfile antes de construir la imagen.

```bash
cp .env.example .env
# Edita .env: API_BASE_URL=http://tienda-api:8080 y SITE_URL=https://tu-dominio
docker network create homelab_net # solo si la red aún no existe
docker compose build
docker compose up -d
```

Build y ejecución manual:

```bash
docker build --build-arg IMAGE_HOSTS=img.codeconheiner.com -t techstore-web .
docker run --rm -p 3000:3000 -e API_BASE_URL=http://host.docker.internal:8080 -e SITE_URL=http://localhost:3000 techstore-web
```

En Linux, si el backend local está en el host, agrega `--add-host=host.docker.internal:host-gateway`; en el stack homelab usa el nombre de servicio `tienda-api`.

Pruebas manuales del proxy (con la tienda local en el puerto 3000):

```bash
# Ruta traversal (debe responder 400; --path-as-is evita normalización del cliente)
curl --path-as-is -i http://localhost:3000/api/backend/api/%2e%2e/admin
# Método no permitido (405)
curl -i -X TRACE http://localhost:3000/api/backend/api/catalogo
# Cuerpo mayor al límite predeterminado (413)
python3 -c 'print("x" * (8 * 1024 * 1024 + 1))' | curl -i -X POST -H 'Content-Type: application/octet-stream' --data-binary @- http://localhost:3000/api/backend/api/carrito
# Origin ajeno en operación que modifica datos (403)
curl -i -X POST -H 'Origin: https://sitio-ajeno.example' -H 'Content-Type: application/json' --data '{}' http://localhost:3000/api/backend/api/carrito
# Consulta pública normal al catálogo
curl -i 'http://localhost:3000/api/backend/api/catalogo/productos?page=0&size=8'
```

Para un build independiente de la disponibilidad de la API, ejecuta `API_BASE_URL=http://127.0.0.1:1 npm run build` y luego busca `API_BASE_URL` dentro de `.next/` para confirmar que la variable no quedó incrustada.

## Pendientes conocidos

- El flujo de cuenta implementado cubre inicio de sesión; registro, restablecimiento de contraseña y confirmación de cuenta aún requieren implementación.
- Operaciones administrativas adicionales, como CRUD de productos y gestión de cupones o del flujo de despacho, siguen pendientes.
- La renovación de sesión requiere coordinación segura ante solicitudes simultáneas.
- Antes de habilitar el registro público, revisa la configuración de CAPTCHA del backend: su README documenta un bypass de desarrollo cuando el secreto no está configurado.

## Verificación

Se revisaron la especificación OpenAPI y endpoints públicos de lectura de la API. `git diff --check` no reportó errores en la implementación inicial. Las pruebas de proxy están definidas con Vitest, pero no se ejecutaron. No se ejecutaron compilación, lint ni revisión de tipos porque el entorno de trabajo no dispone de Node.js/npm; tampoco se pudo comprobar el bundle ni correr Docker. Tampoco se realizaron transacciones autenticadas ni pagos reales en producción.
