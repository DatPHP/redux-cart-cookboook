import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { throwError, dynamic } from "redux-saga-test-plan/providers";
import { watchUpdateQuantity } from "./cartSaga";
import {
  updateQuantityRequested,
  updateQuantityConfirmed,
  updateQuantityRollback,
  itemRemovedExternally,
} from "./cartSlice";
import { cartApi, ApiClientError } from "@/lib/cartApi";

describe("cartSaga — watchUpdateQuantity", () => {
  it("gọi API đúng 1 lần sau debounce và dispatch updateQuantityConfirmed khi thành công", () => {
    return expectSaga(watchUpdateQuantity)
      .provide([[matchers.call.fn(cartApi.updateItemQuantity), { id: 1, items: [] }]])
      .put(updateQuantityConfirmed({ itemId: 1 }))
      .dispatch(updateQuantityRequested({ itemId: 1, quantity: 5 }))
      .silentRun(1000);
  });

  it("debounce theo TỪNG itemId: đổi quantity item A rồi item B liên tiếp -> cả 2 đều được gọi API riêng biệt", () => {
    return expectSaga(watchUpdateQuantity)
      .provide([[matchers.call.fn(cartApi.updateItemQuantity), { id: 1, items: [] }]])
      .put(updateQuantityConfirmed({ itemId: 1 }))
      .put(updateQuantityConfirmed({ itemId: 2 }))
      .dispatch(updateQuantityRequested({ itemId: 1, quantity: 3 }))
      .dispatch(updateQuantityRequested({ itemId: 2, quantity: 4 }))
      .silentRun(1000);
  });

  it("bấm nhiều lần liên tiếp trên CÙNG 1 item trong lúc debounce -> chỉ gọi API đúng 1 lần với giá trị cuối cùng", () => {
    let callCount = 0;
    return expectSaga(watchUpdateQuantity)
      .provide([
        [
          matchers.call.fn(cartApi.updateItemQuantity),
          dynamic(() => {
            callCount += 1;
            return { id: 1, items: [] };
          }),
        ],
      ])
      .put(updateQuantityConfirmed({ itemId: 1 }))
      .dispatch(updateQuantityRequested({ itemId: 1, quantity: 2 }))
      .dispatch(updateQuantityRequested({ itemId: 1, quantity: 3 }))
      .dispatch(updateQuantityRequested({ itemId: 1, quantity: 4 }))
      .silentRun(1000)
      .then(() => {
        // Chỉ task cuối cùng (quantity=4) sống sót sau khi 2 task trước bị cancel.
        expect(callCount).toBe(1);
      });
  });

  it("API lỗi -> dispatch updateQuantityRollback với quantity TRƯỚC ĐÓ và error message", () => {
    return expectSaga(watchUpdateQuantity)
      .provide([
        [matchers.call.fn(cartApi.updateItemQuantity), throwError(new Error("Chỉ còn 2 sản phẩm trong kho"))],
      ])
      .put(
        updateQuantityRollback({
          itemId: 1,
          quantity: 5, // giá trị request đầu tiên = mốc rollback vì chưa từng confirm lần nào
          error: "Chỉ còn 2 sản phẩm trong kho",
        })
      )
      .dispatch(updateQuantityRequested({ itemId: 1, quantity: 5 }))
      .silentRun(1000);
  });

  it("race condition: PATCH thất bại với lỗi 404 (item đã bị DELETE bởi request khác) -> itemRemovedExternally, KHÔNG rollback", () => {
    // Mô phỏng đúng bug thực tế đã gặp: user giảm quantity xuống 0 (dispatch
    // removeCartItem ở nơi khác, xoá item khỏi DB) TRONG LÚC 1 task debounce
    // update-quantity trước đó vẫn đang chờ — khi task đó thức dậy và gọi
    // API, server trả 404 vì item không còn tồn tại.
    return expectSaga(watchUpdateQuantity)
      .provide([
        [
          matchers.call.fn(cartApi.updateItemQuantity),
          throwError(new ApiClientError(404, "Sản phẩm này đã bị xoá khỏi giỏ trước đó")),
        ],
      ])
      .not.put(
        updateQuantityRollback({
          itemId: 1,
          quantity: 5,
          error: "Sản phẩm này đã bị xoá khỏi giỏ trước đó",
        })
      )
      .put(
        itemRemovedExternally({
          itemId: 1,
          error: "Sản phẩm này đã bị xoá khỏi giỏ trước đó",
        })
      )
      .dispatch(updateQuantityRequested({ itemId: 1, quantity: 5 }))
      .silentRun(1000);
  });
});