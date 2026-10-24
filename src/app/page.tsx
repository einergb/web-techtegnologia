import { apiGet, ApiError } from "@/lib/api";
import { Categoria, Producto } from "@/lib/contracts";
import { allowedImageUrl } from "@/lib/image-url";
import { CategoryGrid, FeaturedProducts, Hero, TrustStrip } from "@/components/storefront/home-sections";

export const dynamic = "force-dynamic";

async function getStorefront() {
  try {
    const [categories, products] = await Promise.all([
      apiGet<Categoria[]>("/api/catalogo/categorias"),
      apiGet<Producto[]>("/api/catalogo/productos?page=0&size=12"),
    ]);
    return { categories, products, error: "" };
  } catch (error) {
    return { categories: [], products: [], error: error instanceof ApiError ? error.message : "No pudimos cargar la tienda." };
  }
}

export default async function Home() {
  const { categories, products, error } = await getStorefront();
  const featured = products.find((product) => allowedImageUrl(product.imagenUrl));
  return <main className="flex-grow"><Hero product={featured}/><CategoryGrid categories={categories}/><FeaturedProducts products={products} error={error}/><TrustStrip/></main>;
}
