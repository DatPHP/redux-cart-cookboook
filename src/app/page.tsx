export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        🛒 Cart Redux Practice
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Phase 1 (setup) đã xong. Phase 2 (cartSlice + thunk + saga) sẽ thêm
        UI danh sách sản phẩm và giỏ hàng ở đây.
      </p>
    </div>
  );
}
