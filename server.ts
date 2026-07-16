// Next.js App Router route handler chạy trên Fetch API (Request/Response),
// không expose raw Node socket như Pages API cũ -> không thể "tự chế" Socket.io
// bên trong route handler. Cách chuẩn (và được Next.js docs công nhận) là
// dùng 1 custom server: tự tạo http.Server, vừa giao cho Next.js xử lý HTTP
// request bình thường, vừa gắn thêm Socket.io lên CÙNG 1 server đó.
//
// Đánh đổi: mất một phần tối ưu mặc định của `next dev`/`next start` (chủ
// yếu ảnh hưởng Pages Router cũ), và Turbopack dev server nhanh hơn có thể
// không được dùng khi chạy qua custom server. Với dự án practice này, đánh
// đổi này chấp nhận được để lấy WebSocket thật.
import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new SocketIOServer(httpServer);

  // Route handler (chạy trong CÙNG process Node với server.ts) lấy io qua
  // globalThis thay vì import trực tiếp — vì route handler được Next.js
  // bundle riêng (webpack/turbopack), không share module scope với
  // server.ts (file này KHÔNG đi qua bundler của Next.js, Node chạy thẳng).
  // globalThis là nơi duy nhất chắc chắn dùng chung giữa 2 "thế giới" đó.
  (globalThis as unknown as { io?: SocketIOServer }).io = io;

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    // Client gửi "join" kèm cartSessionId ngay sau khi connect (xem
    // src/lib/socketClient.ts) — mỗi session join vào 1 room riêng mang
    // tên chính sessionId, để emitNotification() chỉ gửi đúng cho session đó.
    socket.on("join", (sessionId: string) => {
      socket.join(sessionId);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server (Next.js + Socket.io) ready on http://localhost:${port}`);
  });
});