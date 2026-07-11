import type { ProductDTO } from "@/types/product";

// Không cần x-cart-session-id vì đây là dữ liệu công khai (server state),
// khác hẳn cartApi vốn luôn gắn với 1 session cụ thể.
export async function fetchProducts(): Promise<ProductDTO[]> {
  const res = await fetch("/api/products");
  if (!res.ok) {
    throw new Error(`Không tải được danh sách sản phẩm (${res.status})`);
  }
  return res.json();
}
