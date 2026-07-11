import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import type { ProductDTO } from "@/types/product";

// GET /api/products — dùng bởi react-query ở client (server state thuần,
// không liên quan gì tới Redux). Chỉ trả sản phẩm đang bán (isActive).
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    const data: ProductDTO[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      stock: p.stock,
      image: p.image,
    }));

    return Response.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
