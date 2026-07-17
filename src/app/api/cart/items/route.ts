import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, serializeCart } from "@/lib/cartRepository";
import { ApiError, handleApiError } from "@/lib/apiError";
import { createAndEmitNotification } from "@/lib/notificationRepository";

// POST /api/cart/items — thêm sản phẩm vào giỏ.
// Nếu sản phẩm đã có trong giỏ, CỘNG DỒN quantity (không tạo dòng mới) —
// đúng với @@unique([cartId, productId]) đã thiết kế ở Phase 1.
export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get("x-cart-session-id");
    if (!sessionId) throw new ApiError(400, "Thiếu header x-cart-session-id");

    const body = await req.json();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity ?? 1);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ApiError(400, "productId không hợp lệ");
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, "quantity phải là số nguyên dương");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      throw new ApiError(404, "Sản phẩm không tồn tại hoặc đã ngừng bán");
    }

    const cart = await getOrCreateCart(sessionId);
    const existingItem = cart.items.find((i) => i.productId === productId);
    const nextQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (nextQuantity > product.stock) {
      throw new ApiError(409, `Chỉ còn ${product.stock} sản phẩm trong kho`);
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: nextQuantity },
      create: { cartId: cart.id, productId, quantity: nextQuantity },
    });

    // Không dùng await ở đây để không làm chậm response trả về cho user —
    // notification là "phụ", cart mutation chính mới là thứ user đang chờ.
    createAndEmitNotification({
      cartId: cart.id,
      sessionId,
      message: `Đã thêm "${product.name}" vào giỏ hàng`,
      type: "cart_item_added",
      metadata: { productId, quantity },
    }).catch((err) =>
      console.error("[notification] Lỗi khi tạo thông báo:", err),
    );

    const updated = await getOrCreateCart(sessionId);
    return Response.json(serializeCart(updated));
  } catch (err) {
    return handleApiError(err);
  }
}
