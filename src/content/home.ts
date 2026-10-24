// Textos procedentes del boceto; confirmar las afirmaciones comerciales con el dueño antes de publicarlos.
export const homeCopy = {
  badge: "Nueva Colección TechStore 2025",
  heroSubtitle: "Descubre los dispositivos y periféricos de alto rendimiento diseñados para optimizar tu trabajo, estudio y entretenimiento con garantía oficial en Colombia.",
  footerDescription: "Líderes en importación y distribución oficial de periféricos, componentes de computador y tecnología premium en todo el territorio colombiano.",
  heroBenefits: [
    { title: "Envío express", description: "24/48h en Colombia", icon: "bolt" },
    { title: "Garantía oficial", description: "12 meses directa", icon: "verified" },
    { title: "Soporte local", description: "Bogotá, Med, Cali", icon: "support_agent" },
  ],
} as const;

// Beneficios adaptados a información neutral mientras la tienda confirma cobertura y condiciones.
export const homeBenefits = [
  { title: "Envíos a todo el país", description: "Consulta las condiciones de envío disponibles para tu pedido.", icon: "local_shipping" },
  { title: "Pagos 100% seguros", description: "Consulta los medios de pago disponibles durante el checkout.", icon: "security" },
  { title: "Devoluciones sencillas", description: "Consulta con la tienda las condiciones de cambios y devoluciones.", icon: "assignment_return" },
] as const;
