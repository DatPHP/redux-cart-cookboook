import { EventEmitter } from "events";
import { runSaga } from "redux-saga";
import type { Socket } from "socket.io-client";
import { watchSocketNotifications } from "./notificationSaga";
import { notificationReceived } from "./notificationSlice";
import type { NotificationDTO } from "@/types/notification";

// Fake socket tối giản: chỉ cần on/off giống Socket thật là đủ để
// createSocketChannel() hoạt động — không cần kết nối mạng thật.
// jest.fn() bọc quanh off() để verify saga có gỡ listener đúng lúc không.
function createFakeSocket() {
  const emitter = new EventEmitter();
  const offSpy = jest.fn((event: string, handler: (...args: unknown[]) => void) =>
    emitter.off(event, handler)
  );

  const socket = {
    on: emitter.on.bind(emitter),
    off: offSpy,
  } as unknown as Socket;

  return {
    socket,
    offSpy,
    emitFromServer: (payload: NotificationDTO) => emitter.emit("notification", payload),
  };
}

// Helper: chờ 1 microtask tick để saga kịp chạy tới điểm "chờ" (take/eventChannel)
// trước khi test giả lập server bắn sự kiện.
const tick = () => Promise.resolve();

describe("notificationSaga — watchSocketNotifications", () => {
  it("dispatch notificationReceived khi socket bắn sự kiện 'notification'", async () => {
    const { socket, emitFromServer } = createFakeSocket();
    const dispatched: unknown[] = [];

    const task = runSaga(
      { dispatch: (action) => dispatched.push(action), getState: () => ({}) },
      watchSocketNotifications,
      socket
    );
    await tick();

    const payload: NotificationDTO = {
      id: 1,
      message: 'Đã thêm "Áo thun basic" vào giỏ hàng',
      type: "cart_item_added",
      isRead: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    emitFromServer(payload);
    await tick();

    expect(dispatched).toEqual([notificationReceived(payload)]);

    task.cancel();
  });

  it("nhận ĐÚNG NHIỀU notification liên tiếp theo thứ tự (channel không bỏ sót event)", async () => {
    const { socket, emitFromServer } = createFakeSocket();
    const dispatched: unknown[] = [];

    const task = runSaga(
      { dispatch: (action) => dispatched.push(action), getState: () => ({}) },
      watchSocketNotifications,
      socket
    );
    await tick();

    emitFromServer({
      id: 1,
      message: "Thông báo 1",
      type: "cart_item_added",
      isRead: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    emitFromServer({
      id: 2,
      message: "Thông báo 2",
      type: "cart_item_removed",
      isRead: false,
      createdAt: "2026-01-01T00:00:01.000Z",
    });
    await tick();

    expect(dispatched).toHaveLength(2);
    expect((dispatched[0] as ReturnType<typeof notificationReceived>).payload.id).toBe(1);
    expect((dispatched[1] as ReturnType<typeof notificationReceived>).payload.id).toBe(2);

    task.cancel();
  });

  it("gỡ listener khỏi socket khi task bị cancel — tránh leak/nhận trùng khi HMR reload", async () => {
    const { socket, offSpy } = createFakeSocket();

    const task = runSaga({ dispatch: () => {}, getState: () => ({}) }, watchSocketNotifications, socket);
    await tick();

    task.cancel();
    await tick();

    expect(offSpy).toHaveBeenCalledWith("notification", expect.any(Function));
  });

  it("không làm gì nếu socketInstance là null (trường hợp SSR, không có window)", async () => {
    const dispatched: unknown[] = [];

    const task = runSaga(
      { dispatch: (action) => dispatched.push(action), getState: () => ({}) },
      watchSocketNotifications,
      null
    );
    await tick();

    expect(dispatched).toEqual([]);
    expect(task.isRunning()).toBe(false); // saga return sớm, không "treo" chờ mãi
  });
});