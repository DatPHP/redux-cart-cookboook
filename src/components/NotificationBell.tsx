"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNotifications, markAllNotificationsRead } from "@/features/notification/notificationSlice";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function NotificationBell() {
  const dispatch = useAppDispatch();
  const { items, unreadCount } = useAppSelector((state) => state.notification);
  const [open, setOpen] = useState(false);

  // Load lịch sử thông báo 1 lần khi mount — những notification bắn ra SAU
  // thời điểm này sẽ tới qua socket (notificationSaga), không qua thunk này.
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100
          dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center
              rounded-full bg-red-600 px-1 text-[10px] font-medium text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white
            shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Thông báo</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllNotificationsRead())}
                className="text-xs text-blue-600 hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-zinc-500">
                Chưa có thông báo nào.
              </li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-zinc-100 px-3 py-2 text-sm last:border-0 dark:border-zinc-800 ${
                    n.isRead ? "text-zinc-500" : "text-zinc-900 dark:text-zinc-50"
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{formatTime(n.createdAt)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}