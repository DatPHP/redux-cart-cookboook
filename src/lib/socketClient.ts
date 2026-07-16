import { io, Socket } from "socket.io-client";
import { getCartSessionId } from "./cartSession";

// StoreProvider là Client Component, nhưng Next.js vẫn PRE-RENDER nó ở
// server lúc SSR (khác với việc "chỉ chạy ở client" — SSR vẫn chạy code
// của Client Component để tạo HTML ban đầu). Nếu gọi io() vô điều kiện ở
// module scope, server sẽ cố mở kết nối WebSocket lúc render — vô nghĩa
// và có thể gây lỗi. Guard bằng typeof window để chỉ browser thật mới kết nối.
function createSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const socketInstance = io();
  // Join đúng room mang tên cartSessionId NGAY sau khi kết nối (và cả sau
  // mỗi lần reconnect — "connect" bắn lại mỗi lần reconnect thành công) —
  // để server biết gửi notification của session này vào đúng room nào.
  socketInstance.on("connect", () => {
    socketInstance.emit("join", getCartSessionId());
  });

  return socketInstance;
}

export const socket: Socket | null = createSocket();