# ============================================================
# 4-stage build:
#   1. deps       — cài ĐẦY ĐỦ dependencies (kể cả devDeps) để build
#   2. builder    — build Next.js + generate Prisma client
#   3. prod-deps  — cài LẠI, CHỈ dependencies production (không devDeps)
#      -> node_modules ở đây nhỏ hơn nhiều (không có jest/eslint/typescript...)
#   4. runner     — image cuối cùng, chỉ copy đúng artifact cần để CHẠY
#
# Vì sao tách "prod-deps" riêng thay vì tái dùng node_modules của "builder"?
# node_modules của builder có đầy đủ devDependencies (cần để build/test),
# nhưng production KHÔNG cần jest/eslint/typescript... Copy production
# dependencies (chỉ ~vài chục package thay vì gần trăm) giúp image cuối
# nhỏ hơn đáng kể — nhưng "prod-deps" vẫn phải tự chạy `prisma generate`
# riêng, vì client Prisma sinh ra (nằm trong node_modules/.prisma) không
# tự động có mặt khi cài lại dependencies ở stage mới.
# ============================================================

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: bỏ qua hook "postinstall" (prisma generate) — ở bước
# này CHƯA copy thư mục prisma/ vào, nên schema.prisma không tồn tại, hook
# sẽ fail nếu chạy. Việc generate được làm TƯỜNG MINH ở bước sau (RUN npx
# prisma generate trong stage builder), không cần dựa vào postinstall.
# Lợi ích phụ: layer này CHỈ phụ thuộc package.json/package-lock.json —
# nếu sau này chỉ sửa schema.prisma (không đổi dependency), Docker cache
# vẫn tái sử dụng được layer cài đặt này, không phải cài lại từ đầu.
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
# Giá trị GIẢ — chỉ để `prisma generate`/`next build` có biến môi trường
# tham chiếu (KHÔNG kết nối DB thật lúc build). Giá trị THẬT được truyền
# vào lúc container chạy qua docker-compose (env_file: .env), không phải
# lúc build image — 2 giai đoạn hoàn toàn tách biệt.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/dummy"
ENV DIRECT_URL="postgresql://user:password@localhost:5432/dummy"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS prod-deps
WORKDIR /app
ENV DATABASE_URL="postgresql://user:password@localhost:5432/dummy"
ENV DIRECT_URL="postgresql://user:password@localhost:5432/dummy"
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts
# Client Prisma phải generate LẠI ở đây — node_modules này là bản cài mới
# (chỉ production deps), không kế thừa .prisma/client đã generate ở builder.
RUN npx prisma generate

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# server.ts là entrypoint (chạy qua "tsx server.ts") — BẮT BUỘC phải copy,
# nếu không container sẽ crash ngay lúc start với lỗi
# "Cannot find module '/app/server.ts'". next.config.ts cũng cần vì
# Next.js đọc file này lúc khởi động (kể cả production mode).
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# node_modules lấy từ "prod-deps" (gọn nhẹ), KHÔNG lấy từ "builder"
# (builder có đầy đủ devDependencies, nặng hơn nhiều mà production
# không cần tới).
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3000

# Kiểm tra qua GET /api/health — endpoint này KHÔNG đụng Prisma/Neon, chỉ
# xác nhận process Next.js + Socket.io còn sống (tránh healthcheck fail
# oan nếu Neon đang "ngủ"/cold-start, xem comment trong route handler).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]