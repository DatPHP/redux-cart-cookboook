import { NextRequest } from "next/server";
import {
  listRecentNotifications,
  markAllNotificationsRead,
} from "@/lib/notificationRepository";
import { getOrCreateCart } from "@/lib/cartRepository";
import { ApiError, handleApiError } from "@/lib/apiError";

function requireSessionId(req: NextRequest): string {
  const sessionId = req.headers.get("x-cart-session-id");
  if (!sessionId) throw new ApiError(400, "Thiếu header x-cart-session-id");
  return sessionId;
}

// GET /api/notifications — lịch sử thông báo CỦA ĐÚNG giỏ hàng này (khi mở
// lại trang, trước khi socket kịp bắn sự kiện mới nào).
export async function GET(req: NextRequest) {
  try {
    const sessionId = requireSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    const notifications = await listRecentNotifications(cart.id);
    return Response.json(notifications);
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/notifications — đánh dấu toàn bộ đã đọc (nút "Đánh dấu đã đọc"
// trên notification bell), CHỈ trong phạm vi cart của session này.
export async function PATCH(req: NextRequest) {
  try {
    const sessionId = requireSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    await markAllNotificationsRead(cart.id);
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
