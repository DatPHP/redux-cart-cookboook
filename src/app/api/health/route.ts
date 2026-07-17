// GET /api/health — dùng cho Docker HEALTHCHECK. Cố tình KHÔNG gọi Prisma/DB
// ở đây — mục đích chỉ là xác nhận process Next.js + Socket.io (server.ts)
// còn sống và đang phục vụ request, không phải xác nhận Neon có kết nối
// được hay không (Neon free tier có thể "ngủ" và cold-start vài giây,
// healthcheck sẽ báo sai "unhealthy" dù server hoàn toàn ổn nếu gọi DB ở đây).
export async function GET() {
  return Response.json({ status: "ok" });
}