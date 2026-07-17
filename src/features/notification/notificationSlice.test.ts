import notificationReducer, {
  NotificationState,
  notificationReceived,
  fetchNotifications,
  markAllNotificationsRead,
} from "./notificationSlice";
import type { NotificationDTO } from "@/types/notification";

function makeNotification(
  overrides: Partial<NotificationDTO> = {},
): NotificationDTO {
  return {
    id: 1,
    message: 'Đã thêm "Áo thun basic" vào giỏ hàng',
    type: "cart_item_added",
    isRead: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeState(
  overrides: Partial<NotificationState> = {},
): NotificationState {
  return {
    items: [],
    unreadCount: 0,
    status: "idle",
    ...overrides,
  };
}

describe("notificationSlice reducers", () => {
  it("notificationReceived: thêm notification mới lên đầu danh sách và tăng unreadCount", () => {
    const state = makeState({
      items: [makeNotification({ id: 1 })],
      unreadCount: 1,
    });
    const next = notificationReducer(
      state,
      notificationReceived(
        makeNotification({ id: 2, message: "Đã thêm sản phẩm khác" }),
      ),
    );

    expect(next.items).toHaveLength(2);
    expect(next.items[0].id).toBe(2); // notification mới nhất lên đầu
    expect(next.unreadCount).toBe(2);
  });

  it("fetchNotifications.fulfilled: set items và tính unreadCount từ số item isRead=false", () => {
    const state = makeState({ status: "loading" });
    const serverData = [
      makeNotification({ id: 1, isRead: true }),
      makeNotification({ id: 2, isRead: false }),
      makeNotification({ id: 3, isRead: false }),
    ];
    const next = notificationReducer(
      state,
      fetchNotifications.fulfilled(serverData, "reqId"),
    );

    expect(next.status).toBe("succeeded");
    expect(next.items).toEqual(serverData);
    expect(next.unreadCount).toBe(2);
  });

  it("markAllNotificationsRead.fulfilled: set toàn bộ isRead=true và unreadCount về 0", () => {
    const state = makeState({
      items: [
        makeNotification({ id: 1, isRead: false }),
        makeNotification({ id: 2, isRead: false }),
      ],
      unreadCount: 2,
    });
    const next = notificationReducer(
      state,
      markAllNotificationsRead.fulfilled(undefined, "reqId"),
    );

    expect(next.items.every((n) => n.isRead)).toBe(true);
    expect(next.unreadCount).toBe(0);
  });
});
