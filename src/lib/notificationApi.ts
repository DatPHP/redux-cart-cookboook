import { getCartSessionId } from "./cartSession";
import type { NotificationDTO } from "@/types/notification";

export const notificationApi = {
  fetchRecent: async (): Promise<NotificationDTO[]> => {
    const res = await fetch("/api/notifications", {
      headers: { "x-cart-session-id": getCartSessionId() },
    });
    if (!res.ok) throw new Error(`Không tải được thông báo (${res.status})`);
    return res.json();
  },
  markAllRead: async (): Promise<void> => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "x-cart-session-id": getCartSessionId() },
    });
    if (!res.ok) throw new Error(`Không đánh dấu đã đọc được (${res.status})`);
  },
};