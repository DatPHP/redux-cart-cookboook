"use client";

import { useProducts } from "@/features/products/useProducts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItemToCart } from "@/features/cart/cartSlice";
import { formatCurrency } from "@/lib/formatCurrency";

export default function ProductList() {
  const { data: products, isLoading, isError, error } = useProducts();
  const dispatch = useAppDispatch();
  const cartStatus = useAppSelector((state) => state.cart.status);

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500">Đang tải danh sách sản phẩm...</p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : "Không tải được sản phẩm"}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products?.map((product) => (
        <div
          key={product.id}
          className="flex flex-col justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Còn {product.stock} sản phẩm
            </p>
            <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(product.price)}
            </p>
          </div>
          <button
            type="button"
            disabled={product.stock === 0 || cartStatus === "loading"}
            onClick={() =>
              dispatch(addItemToCart({ productId: product.id, quantity: 1 }))
            }
            className="mt-4 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white
              transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40
              dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      ))}
    </div>
  );
}
