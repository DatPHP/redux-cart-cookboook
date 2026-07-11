"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCart,
  removeCartItem,
  clearCart,
  updateQuantityRequested,
} from "@/features/cart/cartSlice";
import { formatCurrency } from "@/lib/formatCurrency";

export default function CartPanel() {
  const dispatch = useAppDispatch();
  const { items, status, error, mutatingItemIds } = useAppSelector(
    (state) => state.cart,
  );

  // Load giỏ hàng 1 lần khi panel mount — đây là thunk fetchCart (Phase 2),
  // không phải saga, vì đây là luồng "gọi 1 lần, chờ, xong" kinh điển.
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  function handleChangeQuantity(itemId: number, nextQuantity: number) {
    if (nextQuantity <= 0) {
      // Số lượng về 0 -> xoá hẳn item, KHÔNG dispatch updateQuantityRequested(0)
      // vì backend validate quantity phải > 0 (xem PATCH /api/cart/items/:id).
      dispatch(removeCartItem({ itemId }));
      return;
    }
    // Action này có 2 người lắng nghe: cartSlice reducer (optimistic UI ngay
    // lập tức) và cartSaga (debounce 400ms rồi mới thật sự gọi API).
    dispatch(updateQuantityRequested({ itemId, quantity: nextQuantity }));
  }

  if (status === "loading" && items.length === 0) {
    return <p className="text-sm text-zinc-500">Đang tải giỏ hàng...</p>;
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Giỏ hàng
        </h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="text-sm text-red-600 hover:underline"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Giỏ hàng đang trống.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const isMutating = mutatingItemIds.includes(item.id);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatCurrency(item.product.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Giảm số lượng ${item.product.name}`}
                    onClick={() =>
                      handleChangeQuantity(item.id, item.quantity - 1)
                    }
                    className="h-7 w-7 rounded-md border border-zinc-300 text-zinc-700 transition
                      hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Tăng số lượng ${item.product.name}`}
                    disabled={item.quantity >= item.product.stock}
                    onClick={() =>
                      handleChangeQuantity(item.id, item.quantity + 1)
                    }
                    className="h-7 w-7 rounded-md border border-zinc-300 text-zinc-700 transition
                      hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40
                      dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    +
                  </button>
                </div>

                {/* Chấm nhỏ báo "đang đồng bộ với server" — chỉ hiện đúng dòng
                    này đang mutate, không ảnh hưởng các dòng khác nhờ
                    mutatingItemIds là mảng riêng (xem Phase 2, mục 3.2). */}
                <span
                  className={`h-2 w-2 rounded-full transition-opacity ${
                    isMutating ? "bg-amber-500 opacity-100" : "opacity-0"
                  }`}
                  title={isMutating ? "Đang lưu..." : undefined}
                />

                <button
                  type="button"
                  aria-label={`Xoá ${item.product.name} khỏi giỏ`}
                  onClick={() => dispatch(removeCartItem({ itemId: item.id }))}
                  className="text-sm text-zinc-400 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <span className="text-sm text-zinc-500">Tổng cộng</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(total)}
          </span>
        </div>
      )}
    </div>
  );
}
