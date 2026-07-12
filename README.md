# Cart Redux Practice

Mini app luyện tập **Redux Toolkit + Redux Thunk + Redux Saga** với chức năng Cart (thêm / sửa / xóa / cập nhật quantity / xóa từng item / xóa toàn bộ cart), kết hợp WebSocket (Socket.io) bắn notification realtime.

## Stack

| Layer      | Công nghệ                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js (App Router) + TypeScript                                                                                     |
| State      | Redux Toolkit + Redux Thunk (action đơn giản) + Redux Saga (side-effect phức tạp: debounce, eventChannel cho socket) |
| Data fetch | @tanstack/react-query (cho Product list / Order history — tách biệt với Redux)                                       |
| DB         | Neon Postgres qua Prisma ORM                                                                                          |
| Realtime   | Socket.io                                                                                                             |
| UI         | TailwindCSS v4                                                                                                        |
| Test       | Jest + redux-saga-test-plan                                                                                           |
| CI/CD      | GitHub Actions                                                                                                         |
| Container  | Docker                                                                                                                 |

## Cấu trúc thư mục

```text
cart-redux-book/
├── prisma/
│   ├── schema.prisma          # Database schema (Product, Cart, Order, etc.)
│   └── seed.ts                # Seed data for initial setup
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes (cart, products)
│   │   ├── layout.tsx         # Root layout with providers (StoreProvider, QueryProvider)
│   │   └── page.tsx           # Main page with ProductList & CartPanel
│   ├── components/            # UI Components
│   │   ├── ProductList.tsx    # React Query integrated product list
│   │   └── CartPanel.tsx      # Redux connected cart UI
│   ├── features/              # Feature slices
│   │   ├── cart/              # Cart Slice, Saga, Thunks & Tests
│   │   └── products/          # React Query hooks for products
│   ├── lib/                   # Utilities and configurations
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── apiError.ts        # Error handling utilities
│   │   └── formatCurrency.ts  # Formatting utilities
│   ├── store/                 # Redux Store Configuration
│   │   ├── index.ts           # Store config & middleware
│   │   ├── rootSaga.ts        # Root saga
│   │   ├── hooks.ts           # Typed Redux hooks
│   │   └── StoreProvider.tsx  # Redux Provider wrapper
│   └── types/                 # Shared TypeScript types
├── Dockerfile                 # Docker configuration
└── docker-compose.yml         # Docker compose configuration
```

## Setup lần đầu

1. Tạo project Neon Postgres tại https://neon.tech, copy connection string.
2. Điền vào `.env`:
   ```env
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

## Testing

```bash
# Chạy Unit Tests
npm test

# Chạy Test ở chế độ Watch
npm run test:watch
```

## Chạy bằng Docker

```bash
docker compose up --build
```

*(Neon là managed Postgres nên container chỉ chạy app, không chạy DB local — `.env` cần trỏ đúng Neon connection string.)*

## Trạng thái các Phase

- [x] **Phase 1** — Setup Next.js + Tailwind + Prisma schema + Redux store skeleton + Docker
- [x] **Phase 2** — Core Redux Cart: cartSlice, cartThunk (fetchCart/addItemToCart/removeCartItem/clearCart), cartSaga (debounce per-itemId + optimistic update + rollback), API routes, 10 unit test
- [x] **Phase 3** — UI: ProductList (react-query) + CartPanel (Redux) — verify optimistic update + debounce trên trình duyệt thật, cart persist qua Neon
- [ ] **Phase 4** — WebSocket notification: Socket.io server, eventChannel trong saga, notification bell UI
- [ ] **Phase 5** — CI/CD (GitHub Actions) + mở rộng test coverage + (optional) BullMQ queue cho xử lý Order async
