import ProductList from "@/components/ProductList";
import CartPanel from "@/components/CartPanel";
import NotificationBell from "@/components/NotificationBell";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            🛒 Cart Redux Practice
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Phase 4 — WebSocket notification (Socket.io + eventChannel)
          </p>
        </div>
        <NotificationBell />
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Sản phẩm</h2>
          <ProductList />
        </section>

        <aside>
          <CartPanel />
        </aside>
      </div>
    </div>
  );
}