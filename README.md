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

## Business & Architectural Ideology (Thinking)

- **Separation of Concerns (SoC):** 
  - Server state (Products, Orders) is managed by **React Query**, optimizing for caching, background re-fetching, and declarative data fetching.
  - Client state and complex synchronous/asynchronous flows (Cart interactions, optimistic updates, notifications via Websockets) are managed by **Redux Toolkit** combined with **Redux Saga** & **Redux Thunk**.
- **Performance First (Optimistic Updates & Debouncing):** UI reacts instantly for a seamless user experience. Updates are reflected immediately (Optimistic Update) and rolled back on API failure. Debounce strategies in Saga are applied to prevent spamming API requests when rapidly modifying cart quantities.
- **Scalability & Maintainability:** The codebase leverages a feature-based folder structure (e.g., `src/features/cart`) rather than file-type grouping, making it highly modular and readable as the application scales.
- **Realtime Integration:** Notifications (e.g., cart checkout, system alerts) are pushed in realtime via Socket.io leveraging the Redux Saga `eventChannel` pattern to cleanly map socket events to Redux actions.

## Features

- **Products Management:** List fetching utilizing `React Query`.
- **Advanced Cart Operations:**
  - Add / Remove Items.
  - Update quantities with debouncing.
  - Clear entire cart.
  - Optimistic UI Updates & Error Rollbacks.
- **Realtime Notifications:** WebSocket-based notification system via Socket.io to alert users in real-time.
- **Robust State Management:** Combining the strengths of Thunk (simple async/sync logic) and Saga (complex side-effects, cancellations, debouncing, websockets).
- **Persistent Data:** Syncs client state effectively with Neon Postgres (Serverless DB).

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
│   │   ├── CartPanel.tsx      # Redux connected cart UI
│   │   └── NotificationBell.tsx # Socket.io notification bell component
│   ├── features/              # Feature slices
│   │   ├── cart/              # Cart Slice, Saga, Thunks & Tests
│   │   ├── notification/      # Notification Slice & Saga (Socket.io)
│   │   └── products/          # React Query hooks for products
│   ├── lib/                   # Utilities and configurations
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── apiError.ts        # Error handling utilities
│   │   └── formatCurrency.ts  # Formatting utilities
│   ├── store/                 # Redux Store Configuration
│   │   ├── index.ts           # Store config & middleware
│   │   ├── rootSaga.ts        # Root saga
│   │   ├── hooks.ts           # Typed Redux hooks
│   │   ├── appSlice.ts        # Global application state
│   │   ├── StoreProvider.tsx  # Redux Provider wrapper
│   │   └── QueryProvider.tsx  # React Query Provider wrapper
│   └── types/                 # Shared TypeScript types
├── server.ts                  # Custom server for Socket.io & Next.js integration
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
6. Chạy dev server (sẽ chạy qua custom server với socket.io):
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
- [x] **Phase 4** — WebSocket notification: Socket.io server, eventChannel trong saga, notification bell UI
- [x] **Phase 5** — CI/CD (GitHub Actions) + mở rộng test coverage + (optional) BullMQ queue cho xử lý Order async
