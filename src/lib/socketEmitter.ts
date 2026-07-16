import type { Server as SocketIOServer } from "socket.io";
import type { NotificationDTO } from "@/types/notification";

// Đọc io từ globalThis do server.ts gán vào (xem comment trong server.ts).
// Guard optional-chaining vì lúc `next build` (không chạy qua server.ts)
// hoặc lúc test, globalThis.io sẽ không tồn tại — không được để việc emit
// thất bại làm hỏng cả request API.
//
// CHỈ emit vào room mang tên sessionId — KHÔNG io.emit() broadcast toàn cục.
// Nếu broadcast toàn cục, session A thêm sản phẩm sẽ khiến session B (tab
// khác/máy khác) cũng nhận được thông báo của A — sai hoàn toàn với ý nghĩa
// "thông báo của giỏ hàng tôi". Client tự join room này ngay sau khi kết nối
// (xem src/lib/socketClient.ts).
export function emitNotification(sessionId: string, notification: NotificationDTO): void {
  const io = (globalThis as unknown as { io?: SocketIOServer }).io;
  if (!io) {
    console.warn("[socketEmitter] io chưa sẵn sàng — bỏ qua emit (bình thường lúc build/test)");
    return;
  }
  io.to(sessionId).emit("notification", notification);
}