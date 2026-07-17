import cartReducer, {
  CartState,
  updateQuantityRequested,
  updateQuantityConfirmed,
  updateQuantityRollback,
  fetchCart,
  removeCartItem,
  itemRemovedExternally,
} from "./cartSlice";
import type { CartItemDTO } from "@/types/cart";

function makeItem(overrides: Partial<CartItemDTO> = {}): CartItemDTO {
  return {
    id: 1,
    productId: 10,
    quantity: 2,
    product: {
      id: 10,
      name: "Áo thun basic",
      price: "150000",
      stock: 50,
      image: null,
    },
    ...overrides,
  };
}

function makeState(overrides: Partial<CartState> = {}): CartState {
  return {
    items: [makeItem()],
    status: "idle",
    error: null,
    mutatingItemIds: [],
    ...overrides,
  };
}

describe("cartSlice reducers", () => {
  it("updateQuantityRequested: cập nhật quantity ngay lập tức (optimistic) và đánh dấu item đang mutate", () => {
    const state = makeState();
    const next = cartReducer(
      state,
      updateQuantityRequested({ itemId: 1, quantity: 5 }),
    );

    expect(next.items[0].quantity).toBe(5);
    expect(next.mutatingItemIds).toEqual([1]);
    expect(next.error).toBeNull();
  });

  it("updateQuantityRequested: không thêm trùng itemId vào mutatingItemIds nếu bấm nhiều lần liên tiếp", () => {
    let state = makeState();
    state = cartReducer(
      state,
      updateQuantityRequested({ itemId: 1, quantity: 3 }),
    );
    state = cartReducer(
      state,
      updateQuantityRequested({ itemId: 1, quantity: 4 }),
    );

    expect(state.mutatingItemIds).toEqual([1]);
    expect(state.items[0].quantity).toBe(4);
  });

  it("updateQuantityConfirmed: xoá itemId khỏi mutatingItemIds sau khi server xác nhận", () => {
    const state = makeState({ mutatingItemIds: [1, 2] });
    const next = cartReducer(state, updateQuantityConfirmed({ itemId: 1 }));

    expect(next.mutatingItemIds).toEqual([2]);
  });

  it("updateQuantityRollback: revert quantity về giá trị cũ và set error message", () => {
    const state = makeState({
      items: [makeItem({ quantity: 9 })],
      mutatingItemIds: [1],
    });
    const next = cartReducer(
      state,
      updateQuantityRollback({
        itemId: 1,
        quantity: 2,
        error: "Chỉ còn 2 sản phẩm trong kho",
      }),
    );

    expect(next.items[0].quantity).toBe(2);
    expect(next.mutatingItemIds).toEqual([]);
    expect(next.error).toBe("Chỉ còn 2 sản phẩm trong kho");
  });

  it("fetchCart.fulfilled: ghi đè items bằng dữ liệu mới nhất từ server", () => {
    const state = makeState({ status: "loading" });
    const serverCart = { id: 1, items: [makeItem({ id: 2, quantity: 7 })] };
    const next = cartReducer(
      state,
      fetchCart.fulfilled(serverCart, "requestId"),
    );

    expect(next.status).toBe("succeeded");
    expect(next.items).toEqual(serverCart.items);
  });

  it("removeCartItem.rejected: set status failed và giữ nguyên error message từ thunk", () => {
    const state = makeState({ status: "loading" });
    const action = removeCartItem.rejected(
      new Error("Không tìm thấy item trong giỏ hàng"),
      "requestId",
      { itemId: 1 },
    );
    const next = cartReducer(state, action);

    expect(next.status).toBe("failed");
    expect(next.error).toBe("Không tìm thấy item trong giỏ hàng");
  });

  it("itemRemovedExternally: xoá hẳn item khỏi state (KHÔNG rollback quantity) khi item đã bị xoá do race condition", () => {
    const state = makeState({
      items: [makeItem({ id: 1 }), makeItem({ id: 2, productId: 20 })],
      mutatingItemIds: [1],
    });
    const next = cartReducer(
      state,
      itemRemovedExternally({
        itemId: 1,
        error: "Sản phẩm này đã bị xoá khỏi giỏ trước đó",
      }),
    );

    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe(2);
    expect(next.mutatingItemIds).toEqual([]);
    expect(next.error).toBe("Sản phẩm này đã bị xoá khỏi giỏ trước đó");
  });
});
