import { prisma } from "./prisma";
import type { CartDTO } from "@/types/cart";
import type { Cart, CartItem, Product } from "@prisma/client";

type CartWithItems = Cart & { items: (CartItem & { product: Product })[] };

export async function getOrCreateCart(
  sessionId: string,
): Promise<CartWithItems> {
  const existing = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: { include: { product: true } } },
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { sessionId },
    include: { items: { include: { product: true } } },
  });
}

// Prisma Decimal cần chuyển tường minh sang string trước khi trả về JSON —
// nếu không, một số version Next.js sẽ throw lỗi serialize object phức tạp.
export function serializeCart(cart: CartWithItems): CartDTO {
  return {
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price.toString(),
        stock: item.product.stock,
        image: item.product.image,
      },
    })),
  };
}
