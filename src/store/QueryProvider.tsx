"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Cùng lý do như StoreProvider: tạo QueryClient bên trong useState lazy-init
// để mỗi client (browser) chỉ có đúng 1 instance, không share giữa các
// request khác nhau trên server.
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
