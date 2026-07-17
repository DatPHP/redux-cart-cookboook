import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { cartApi } from "@/lib/cartApi";
import type { CartDTO, CartItemDTO } from "@/types/cart";

export interface CartState {
  items: CartItemDTO[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  // itemId nào đang có 1 update-quantity chưa được server xác nhận —
  // UI dùng để hiện spinner nhỏ trên đúng dòng đó, không phải cả cart.
  mutatingItemIds: number[];
}

const initialState: CartState = {
  items: [],
  status: "idle",
  error: null,
  mutatingItemIds: [],
};

// ============================================================
// THUNKS — dùng cho các luồng "gọi 1 lần, chờ, xong", không cần
// debounce/huỷ giữa chừng. Cả 4 thunk đều trả về CartDTO mới nhất
// từ server, nên chỉ cần 1 cách xử lý fulfilled: ghi đè state.items.
// ============================================================

export const fetchCart = createAsyncThunk<CartDTO>("cart/fetchCart", () =>
  cartApi.fetchCart(),
);

export const addItemToCart = createAsyncThunk<
  CartDTO,
  { productId: number; quantity?: number }
>("cart/addItemToCart", ({ productId, quantity }) =>
  cartApi.addItem(productId, quantity),
);

export const removeCartItem = createAsyncThunk<CartDTO, { itemId: number }>(
  "cart/removeCartItem",
  ({ itemId }) => cartApi.removeItem(itemId),
);

export const clearCart = createAsyncThunk<CartDTO>("cart/clearCart", () =>
  cartApi.clearCart(),
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Dispatch từ UI mỗi khi user bấm +/- số lượng. Reducer này CHỈ lo phần
    // optimistic UI (update ngay lập tức, không đợi API) — việc gọi API
    // (có debounce 400ms) là trách nhiệm của cartSaga, saga lắng nghe ĐÚNG
    // action type này qua take(updateQuantityRequested.type).
    updateQuantityRequested(
      state,
      action: PayloadAction<{ itemId: number; quantity: number }>,
    ) {
      const item = state.items.find((i) => i.id === action.payload.itemId);
      if (item) item.quantity = action.payload.quantity;
      if (!state.mutatingItemIds.includes(action.payload.itemId)) {
        state.mutatingItemIds.push(action.payload.itemId);
      }
      state.error = null;
    },

    // Saga dispatch action này sau khi API xác nhận thành công.
    updateQuantityConfirmed(state, action: PayloadAction<{ itemId: number }>) {
      state.mutatingItemIds = state.mutatingItemIds.filter(
        (id) => id !== action.payload.itemId,
      );
    },

    // Saga dispatch action này khi API thất bại — revert lại quantity
    // về giá trị server-confirmed gần nhất (không phải giá trị bấm gần nhất).
    updateQuantityRollback(
      state,
      action: PayloadAction<{
        itemId: number;
        quantity: number;
        error: string;
      }>,
    ) {
      const item = state.items.find((i) => i.id === action.payload.itemId);
      if (item) item.quantity = action.payload.quantity;
      state.mutatingItemIds = state.mutatingItemIds.filter(
        (id) => id !== action.payload.itemId,
      );
      state.error = action.payload.error;
    },
    // Saga dispatch action này khi PATCH quantity thất bại vì item ĐÃ BỊ
    // XOÁ bởi 1 request khác trong lúc debounce đang chờ (race condition
    // giữa update-quantity có debounce và remove-item tức thời). KHÔNG dùng
    // updateQuantityRollback ở đây — rollback sẽ "hồi sinh" 1 item ma đã
    // xoá thật ở DB. Thay vào đó xoá hẳn item khỏi state để khớp thực tế.
    itemRemovedExternally(
      state,
      action: PayloadAction<{ itemId: number; error: string }>,
    ) {
      state.items = state.items.filter((i) => i.id !== action.payload.itemId);
      state.mutatingItemIds = state.mutatingItemIds.filter(
        (id) => id !== action.payload.itemId,
      );
      state.error = action.payload.error;
    },
  },
  extraReducers: (builder) => {
    const setSucceeded = (state: CartState, action: PayloadAction<CartDTO>) => {
      state.status = "succeeded";
      state.items = action.payload.items;
      state.error = null;
    };
    const setFailed = (
      state: CartState,
      action: { error: { message?: string } },
    ) => {
      state.status = "failed";
      state.error = action.error.message ?? "Đã có lỗi xảy ra";
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, setSucceeded)
      .addCase(fetchCart.rejected, setFailed)

      .addCase(addItemToCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addItemToCart.fulfilled, setSucceeded)
      .addCase(addItemToCart.rejected, setFailed)

      .addCase(removeCartItem.pending, (state) => {
        state.status = "loading";
      })
      .addCase(removeCartItem.fulfilled, setSucceeded)
      .addCase(removeCartItem.rejected, setFailed)

      .addCase(clearCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(clearCart.fulfilled, setSucceeded)
      .addCase(clearCart.rejected, setFailed);
  },
});

export const {
  updateQuantityRequested,
  updateQuantityConfirmed,
  updateQuantityRollback,
  itemRemovedExternally,
} = cartSlice.actions;
export default cartSlice.reducer;
