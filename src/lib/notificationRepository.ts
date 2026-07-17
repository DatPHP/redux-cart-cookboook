import { prisma } from "./prisma";
import { emitNotification } from "./socketEmitter";
import type { NotificationDTO } from "@/types/notification";
import type { Notification, Prisma  } from "@prisma/client";

function serialize(n: Notification): NotificationDTO {
  return {
    id: n.id,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

// Gọi hàm này ở BẤT KỲ đâu cart/order có thay đổi đáng thông báo. Vừa ghi
// xuống DB (để notification bell load lại lịch sử khi mở lại trang, SCOPE
// theo cartId để không lẫn giữa các session khác nhau), vừa emit qua socket
// ngay lập tức vào ĐÚNG room của sessionId đó (không broadcast toàn cục).
export async function createAndEmitNotification(params: {
  cartId: number;
  sessionId: string;
  message: string;
  type: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      cartId: params.cartId,
      message: params.message,
      type: params.type,
      metadata: params.metadata,
    },
  });
  emitNotification(params.sessionId, serialize(notification));
}

export async function listRecentNotifications(
  cartId: number,
  limit = 20
): Promise<NotificationDTO[]> {
  const notifications = await prisma.notification.findMany({
    where: { cartId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return notifications.map(serialize);
}

export async function markAllNotificationsRead(cartId: number): Promise<void> {
  await prisma.notification.updateMany({
    where: { cartId, isRead: false },
    data: { isRead: true },
  });
}