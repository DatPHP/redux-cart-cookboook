import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, serializeCart } from "@/lib/cartRepository";
import { ApiError, handleApiError } from "@/lib/apiError";

function requireSessionId(req: NextRequest): string {
  const sessionId = req.headers.get("x-cart-session-id");
  if (!sessionId) throw new ApiError(400, "Thiếu header x-cart-session-id");
  return sessionId;
}

type RouteContext = { params: Promise<{ itemId: string }> };

// PATCH /api/cart/items/:itemId — cập nhật quantity (cartSaga gọi API này
// sau khi debounce 400ms).
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const sessionId = requireSessionId(req);
    const { itemId } = await params;
    const id = Number(itemId);

    const body = await req.json();
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(
        400,
        "quantity phải là số nguyên dương (dùng DELETE để xoá item)",
      );
    }

    const cart = await getOrCreateCart(sessionId);
    const item = cart.items.find((i) => i.id === id);
    if (!item) throw new ApiError(404, "Không tìm thấy item trong giỏ hàng");

    if (quantity > item.product.stock) {
      throw new ApiError(
        409,
        `Chỉ còn ${item.product.stock} sản phẩm trong kho`,
      );
    }

    await prisma.cartItem.update({ where: { id }, data: { quantity } });

    const updated = await getOrCreateCart(sessionId);
    return Response.json(serializeCart(updated));
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/cart/items/:itemId — xoá 1 sản phẩm khỏi giỏ (cartThunk gọi API này)
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const sessionId = requireSessionId(req);
    const { itemId } = await params;
    const id = Number(itemId);

    const cart = await getOrCreateCart(sessionId);
    const item = cart.items.find((i) => i.id === id);
    if (!item) throw new ApiError(404, "Không tìm thấy item trong giỏ hàng");

    await prisma.cartItem.delete({ where: { id } });

    const updated = await getOrCreateCart(sessionId);
    return Response.json(serializeCart(updated));
  } catch (err) {
    return handleApiError(err);
  }
}
