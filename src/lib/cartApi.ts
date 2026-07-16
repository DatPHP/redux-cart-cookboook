import { getCartSessionId } from "./cartSession";
import type { CartDTO } from "@/types/cart";

// Giữ lại status code thay vì chỉ có message string — cartSaga cần phân
// biệt lỗi 404 "item đã bị xoá trước đó" (race condition với DELETE chạy
// song song) khỏi các lỗi khác (409 hết hàng, mất mạng...) để xử lý khác
// nhau (xem cartSaga.ts).
export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Tất cả request đều đính kèm header x-cart-session-id để backend biết
// đây là giỏ hàng của ai (xem src/lib/cartRepository.ts).
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-cart-session-id": getCartSessionId(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new ApiClientError(res.status, body.message ?? `Request thất bại (${res.status})`);
  }

  return res.json() as Promise<T>;
}

// cartThunk và cartSaga đều gọi qua các hàm này — business logic gọi API
// chỉ viết 1 lần ở đây, thunk/saga chỉ khác nhau ở cách ĐIỀU PHỐI
// (orchestration), không phải ở cách gọi API.
export const cartApi = {
  fetchCart: () => request<CartDTO>("/api/cart"),

  addItem: (productId: number, quantity = 1) =>
    request<CartDTO>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),

  updateItemQuantity: (itemId: number, quantity: number) =>
    request<CartDTO>(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (itemId: number) =>
    request<CartDTO>(`/api/cart/items/${itemId}`, { method: "DELETE" }),

  clearCart: () => request<CartDTO>("/api/cart", { method: "DELETE" }),
};