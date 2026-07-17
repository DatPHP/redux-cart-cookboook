// serializeCart() không đụng tới DB, nhưng cartRepository.ts import chung
// module với getOrCreateCart() (cùng file) — mà prisma.ts tạo `new
// PrismaClient()` ngay khi module được load (side-effect ở top-level), nên
// PHẢI mock nó ra, nếu không test sẽ cố khởi tạo 1 client Prisma thật (cần
// engine binary đã generate) dù bản thân test không hề gọi query nào.
jest.mock("./prisma", () => ({ prisma: {} }));

import { serializeCart } from "./cartRepository";
import type { Cart, CartItem, Product } from "@prisma/client";

// serializeCart() là pure function (không gọi DB) — test được mà KHÔNG cần
// Prisma client đã generate hay kết nối Neon thật. Chỉ cần 1 object khớp
// đúng SHAPE mà TypeScript mong đợi (ép kiểu qua `as` vì ta không cần đầy
// đủ mọi field Prisma tự sinh, chỉ cần field thực sự được serializeCart dùng).
type CartWithItems = Cart & { items: (CartItem & { product: Product })[] };

function makeFakeCart(overrides: Partial<CartWithItems> = {}): CartWithItems {
  return {
    id: 1,
    userId: null,
    sessionId: "test-session",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  } as CartWithItems;
}

describe("serializeCart", () => {
  it("map đúng field cơ bản, giữ nguyên id và danh sách items rỗng", () => {
    const cart = makeFakeCart({ id: 42, items: [] });
    expect(serializeCart(cart)).toEqual({ id: 42, items: [] });
  });

  it("chuyển Decimal price thành string (dùng .toString(), không parse lại thành number)", () => {
    // Prisma Decimal có .toString() trả về đúng chuỗi thập phân — mock tối
    // giản chỉ cần đúng method này, không cần import decimal.js thật.
    const fakeDecimal = {
      toString: () => "150000.00",
    } as unknown as Product["price"];

    const cart = makeFakeCart({
      items: [
        {
          id: 1,
          cartId: 1,
          productId: 10,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 10,
            name: "Áo thun basic",
            price: fakeDecimal,
            stock: 50,
            image: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
    });

    const result = serializeCart(cart);

    expect(result.items[0].product.price).toBe("150000.00");
    expect(typeof result.items[0].product.price).toBe("string");
  });

  it("giữ đúng thứ tự items và không làm rơi field nào (productId, quantity)", () => {
    const item = (id: number, productId: number, quantity: number) => ({
      id,
      cartId: 1,
      productId,
      quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: productId,
        name: `Product ${productId}`,
        price: { toString: () => "10000" } as unknown as Product["price"],
        stock: 10,
        image: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const cart = makeFakeCart({ items: [item(1, 100, 2), item(2, 200, 3)] });
    const result = serializeCart(cart);

    expect(result.items.map((i) => i.productId)).toEqual([100, 200]);
    expect(result.items.map((i) => i.quantity)).toEqual([2, 3]);
  });
});
