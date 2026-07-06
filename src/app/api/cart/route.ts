import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, serializeCart } from "@/lib/cartRepository";
import { ApiError, handleApiError } from "@/lib/apiError";

function requireSessionId(req: NextRequest): string {
  const sessionId = req.headers.get("x-cart-session-id");
  if (!sessionId) throw new ApiError(400, "Thiếu header x-cart-session-id");
  return sessionId;
}

// GET /api/cart — lấy giỏ hàng hiện tại (tự tạo mới nếu chưa có)
export async function GET(req: NextRequest) {
  try {
    const sessionId = requireSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    return Response.json(serializeCart(cart));
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/cart — xoá toàn bộ item trong giỏ (clear cart)
export async function DELETE(req: NextRequest) {
  try {
    const sessionId = requireSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return Response.json({ id: cart.id, items: [] });
  } catch (err) {
    return handleApiError(err);
  }
}
