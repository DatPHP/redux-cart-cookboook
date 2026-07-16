import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, serializeCart } from "@/lib/cartRepository";
import { ApiError, handleApiError } from "@/lib/apiError";
import { createAndEmitNotification } from "@/lib/notificationRepository";

function requireSessionId(req: NextRequest): string {
  const sessionId = req.headers.get("x-cart-session-id");
  if (!sessionId) throw new ApiError(400, "Thiếu header x-cart-session-id");
  return sessionId;
}

type RouteContext = { params: Promise<{ itemId: string }> };

// PATCH /api/cart/items/:itemId — cập nhật quantity (cartSaga gọi API này
// sau khi debounce 400ms).
// LƯU Ý: KHÔNG emit notification ở đây — user có thể bấm +/- hàng chục lần,
// dội bell với hàng chục thông báo "đã cập nhật số lượng" là trải nghiệm tệ.
// Notification chỉ nên đại diện cho các sự kiện RỜI RẠC, có ý nghĩa
// (thêm mới, xoá hẳn), không phải mọi lần state thay đổi.
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const sessionId = requireSessionId(req);
    const { itemId } = await params;
    const id = Number(itemId);

    const body = await req.json();
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, "quantity phải là số nguyên dương (dùng DELETE để xoá item)");
    }

    const cart = await getOrCreateCart(sessionId);
    const item = cart.items.find((i) => i.id === id);
    if (!item) throw new ApiError(404, "Không tìm thấy item trong giỏ hàng");

    if (quantity > item.product.stock) {
      throw new ApiError(409, `Chỉ còn ${item.product.stock} sản phẩm trong kho`);
    }

    // Không dùng try/catch quanh update() riêng lẻ để phân biệt lỗi — dùng
    // Prisma.PrismaClientKnownRequestError để bắt ĐÚNG loại lỗi P2025
    // (record not found), phân biệt với các lỗi khác (mất kết nối DB...).
    //
    // TẠI SAO CẦN: giữa lúc `cart.items.find()` ở trên xác nhận item tồn
    // tại, và lúc update() THẬT SỰ chạy, có thể có 1 request DELETE khác
    // (vd user bấm "-" liên tục cho quantity về 0 -> CartPanel gọi
    // removeCartItem NGAY LẬP TỨC, không qua debounce) đã xoá mất row này.
    // Đây là race condition thật giữa PATCH (có debounce 400ms) và DELETE
    // (tức thời) trên CÙNG 1 itemId — không phải lỗi hiếm, sẽ xảy ra bất cứ
    // khi nào user giảm quantity nhanh xuống 0.
    try {
      await prisma.cartItem.update({ where: { id }, data: { quantity } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new ApiError(404, "Sản phẩm này đã bị xoá khỏi giỏ trước đó");
      }
      throw err;
    }

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

    // Cùng lý do như PATCH ở trên: giữa lúc `cart.items.find()` xác nhận
    // item tồn tại và lúc delete() thật sự chạy, có thể có 1 request DELETE
    // khác (double-click nút xoá, hoặc 2 tab cùng thao tác) đã xoá mất row
    // này trước. Bắt riêng P2025 để trả 404 sạch thay vì crash 500.
    try {
      await prisma.cartItem.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new ApiError(404, "Sản phẩm này đã bị xoá khỏi giỏ trước đó");
      }
      throw err;
    }

    createAndEmitNotification({
      cartId: cart.id,
      sessionId,
      message: `Đã xoá "${item.product.name}" khỏi giỏ hàng`,
      type: "cart_item_removed",
      metadata: { productId: item.productId },
    }).catch((err) => console.error("[notification] Lỗi khi tạo thông báo:", err));

    const updated = await getOrCreateCart(sessionId);
    return Response.json(serializeCart(updated));
  } catch (err) {
    return handleApiError(err);
  }
}