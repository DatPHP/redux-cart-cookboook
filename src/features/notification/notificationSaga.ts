import { eventChannel, EventChannel } from "redux-saga";
import { call, put, take } from "redux-saga/effects";
import type { Socket } from "socket.io-client";
import { socket } from "@/lib/socketClient";
import { notificationReceived } from "./notificationSlice";
import type { NotificationDTO } from "@/types/notification";

// eventChannel là cầu nối giữa 1 nguồn sự kiện KHÔNG PHẢI Redux (ở đây là
// socket.io-client) và saga: mỗi khi socket bắn "notification", hàm emit
// bên trong sẽ đẩy payload đó vào channel — sau đó saga có thể `take(channel)`
// giống hệt như take() một Redux action bình thường.
export function createSocketChannel(
  socketInstance: Socket,
): EventChannel<NotificationDTO> {
  return eventChannel<NotificationDTO>((emit) => {
    const handleNotification = (payload: NotificationDTO) => emit(payload);
    socketInstance.on("notification", handleNotification);

    // Hàm cleanup — redux-saga tự gọi khi channel bị đóng (vd task bị cancel
    // lúc HMR reload trong dev). PHẢI gỡ listener ở đây, nếu không mỗi lần
    // saga restart sẽ cộng dồn thêm 1 listener, gây nhận trùng notification.
    return () => {
      socketInstance.off("notification", handleNotification);
    };
  });
}

// Nhận socketInstance qua tham số (mặc định = singleton thật từ
// socketClient) thay vì hardcode import bên trong — nhờ vậy test có thể
// truyền vào 1 fake socket mà không cần jest.mock().
export function* watchSocketNotifications(
  socketInstance: Socket | null = socket,
) {
  if (!socketInstance) return; // SSR (không có window) — bỏ qua, không kết nối

  const channel: EventChannel<NotificationDTO> = yield call(
    createSocketChannel,
    socketInstance,
  );

  // try/finally là bắt buộc ở đây — nếu task này bị cancel (vd HMR reload
  // lúc dev, hoặc unmount), redux-saga sẽ huỷ take(channel) đang chờ
  // NHƯNG KHÔNG tự đóng channel giúp bạn. Phải tự gọi channel.close() trong
  // finally để trigger hàm cleanup đã đăng ký trong createSocketChannel
  // (chính là socketInstance.off(...)) — thiếu bước này sẽ leak listener,
  // và mỗi lần saga restart sẽ cộng dồn thêm 1 listener y hệt bug đã
  // cảnh báo trong comment của createSocketChannel.
  try {
    while (true) {
      const notification: NotificationDTO = yield take(channel);
      yield put(notificationReceived(notification));
    }
  } finally {
    channel.close();
  }
}
