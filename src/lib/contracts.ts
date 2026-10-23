export type Categoria = { id: number; nombre: string; slug: string; categoriaPadreId?: number | null };
export type ImagenProducto = { id: number; url: string; orden: number; esPrincipal: boolean };
export type Producto = {
  id: number; sku: string; nombre: string; slug: string; descripcion: string; precio: number;
  categoriaId: number; categoria: string; marcaId?: number; marca?: string; garantiaMeses: number;
  stockDisponible: number; activo: boolean; imagenes: ImagenProducto[]; atributos: Record<string, string>; imagenUrl: string;
};
export type CarritoItem = { id: number; productoId: number; sku: string; nombreProducto: string; precioUnitario: number; cantidad: number; subtotal: number; stockDisponible: number };
export type Carrito = { id: number; usuarioId: number; items: CarritoItem[]; subtotal: number; costoEnvio: number; iva: number; total: number };
export type Direccion = { id: number; alias: string; destinatario: string; telefono: string; departamento: string; ciudad: string; direccion: string; indicaciones: string; esPrincipal: boolean };
export type Pedido = { id: number; numero: string; estado: string; subtotal: number; descuento: number; iva: number; costoEnvio: number; total: number; reservaExpiraEn: string; creadoEn: string; items: Array<{ id: number; productoId: number; sku: string; nombreProducto: string; precioUnitario: number; cantidad: number; subtotal: number }> };
export type SesionPago = { pagoId: number; pasarela: string; referencia: string; claveIdempotencia: string; sesionId: string; urlPago: string };
export type ValidacionCupon = { id: number; codigo: string; tipo: string; valor: number; descuento: number };
export type InventarioReporte = { productos: number; unidades: number; valorInventario: number; bajoUmbral: Array<{ productoId: number; sku: string; nombre: string; stock: number; stockReservado: number; stockMinimo: number }> };
export type VentasReporte = { desde: string; hasta: string; pedidos: number; pedidosPagados: number; ingresos: number; ticketPromedio: number; porEstado: Record<string, number>; topProductos: Array<{ productoId: number; nombre: string; unidades: number; ingresos: number }>; ventasPorDia: Array<{ dia: string; pedidos: number; ingresos: number }> };

export const formatCop = (amount: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
