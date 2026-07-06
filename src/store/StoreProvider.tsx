"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "./index";

// App Router render trên server trước, nên không thể tạo store ở
// module scope (sẽ bị share giữa các request khác nhau). useState với
// initializer function đảm bảo makeStore() chỉ chạy đúng 1 lần/client,
// và không vi phạm rule "không đọc ref trong lúc render".
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState<AppStore>(() => makeStore());

  return <Provider store={store}>{children}</Provider>;
}
