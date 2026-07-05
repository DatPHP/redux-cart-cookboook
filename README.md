# Cart Redux Practice

Mini app luyện tập **Redux Toolkit + Redux Thunk + Redux Saga** với chức năng
Cart (thêm / sửa / xóa / cập nhật quantity / xóa từng item / xóa toàn bộ cart),
kết hợp WebSocket (Socket.io) bắn notification realtime.

## Stack

| Layer      | Công nghệ |
|------------|-----------|
| Framework  | Next.js (App Router) + TypeScript |
| State      | Redux Toolkit + Redux Thunk (action đơn giản) + Redux Saga (side-effect phức tạp: debounce, eventChannel cho socket) |
| Data fetch | @tanstack/react-query (cho Product list / Order history — tách biệt với Redux) |
| DB         | Neon Postgres qua Prisma ORM |
| Realtime   | Socket.io |
| UI         | TailwindCSS |
| Test       | Jest |
| CI/CD      | GitHub Actions |
| Container  | Docker |

## Cấu trúc thư mục

```
src/
  app/                 # Next.js App Router pages
  store/
    index.ts           # configureStore + saga middleware
    rootSaga.ts         # root saga (sẽ fork cartSaga, notificationSaga ở Phase 2)
    appSlice.ts          # slice tạm thời, sẽ thay bằng cart/notification slice
    StoreProvider.tsx    # client component bọc <Provider>
  features/
    cart/               # (Phase 2) cartSlice, cartSaga, cartThunk, components
    notification/        # (Phase 2) notificationSlice, socket eventChannel
  lib/
    prisma.ts            # Prisma client singleton
prisma/
  schema.prisma          # Product, Cart, CartItem, Order, OrderItem, Notification
  seed.ts                # seed data mẫu (5 sản phẩm)
```

## Setup lần đầu

1. Tạo project Neon Postgres tại https://neon.tech, copy connection string.
2. Điền vào `.env`:
   ```
   DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require"
   ```
3. Cài dependencies + generate Prisma client:
   ```bash
   npm install        # postinstall hook sẽ tự chạy "prisma generate"
   ```
4. Tạo bảng trong Neon từ schema:
   ```bash
   npm run prisma:migrate -- --name init
   ```
5. Seed dữ liệu mẫu:
   ```bash
   npm run db:seed
   ```
6. Chạy dev server:
   ```bash
   npm run dev
   ```

## Chạy bằng Docker

```bash
docker compose up --build
```
(Neon là managed Postgres nên container chỉ chạy app, không chạy DB local — `.env` cần trỏ đúng Neon connection string.)

## Trạng thái các Phase

- [x] **Phase 1** — Setup Next.js + Tailwind + Prisma schema + Redux store skeleton + Docker
- [ ] **Phase 2** — Core Redux Cart: cartSlice, thunk (CRUD cart item), saga (debounce update quantity, optimistic update + rollback)
- [ ] **Phase 3** — WebSocket notification: Socket.io server, eventChannel trong saga, notification bell UI
- [ ] **Phase 4** — Testing (Jest + redux-saga-test-plan) + CI/CD (GitHub Actions) + (optional) BullMQ queue cho xử lý Order async
