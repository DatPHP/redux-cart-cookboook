const STORAGE_KEY = "cart_session_id";

// Dự án chưa có hệ thống auth, nên cart được định danh bằng 1 session id
// ngẫu nhiên lưu trong localStorage của trình duyệt (giống cách nhiều
// e-commerce xử lý "giỏ hàng khách vãng lai"). Khi Phase sau có auth thật,
// chỉ cần đổi cách lấy id này (vd lấy từ user.id) mà không cần sửa lại
// cartApi/cartSlice/cartSaga.
export function getCartSessionId(): string {
  if (typeof window === "undefined") {
    throw new Error("getCartSessionId() chỉ được gọi ở phía client");
  }
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
