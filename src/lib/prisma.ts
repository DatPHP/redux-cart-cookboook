import { PrismaClient } from "@prisma/client";

// Next.js dev mode hot-reload sẽ tạo lại module mỗi lần save file.
// Nếu không cache PrismaClient vào globalThis, mỗi lần reload sẽ
// mở thêm 1 connection pool mới -> nhanh chóng vượt giới hạn
// connection của Neon (đặc biệt là free tier).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
