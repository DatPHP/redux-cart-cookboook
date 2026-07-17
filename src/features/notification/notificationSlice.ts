import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { notificationApi } from "@/lib/notificationApi";
import type { NotificationDTO } from "@/types/notification";

export interface NotificationState {
  items: NotificationDTO[];
  unreadCount: number;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  status: "idle",
};

export const fetchNotifications = createAsyncThunk<NotificationDTO[]>(
  "notification/fetchNotifications",
  () => notificationApi.fetchRecent(),
);

export const markAllNotificationsRead = createAsyncThunk<void>(
  "notification/markAllRead",
  () => notificationApi.markAllRead(),
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // Dispatch bởi notificationSaga mỗi khi socket bắn sự kiện "notification"
    // mới — đây là action DUY NHẤT trong cả app không đến từ user bấm nút,
    // mà đến từ 1 nguồn hoàn toàn bên ngoài (server, qua WebSocket).
    notificationReceived(state, action: PayloadAction<NotificationDTO>) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const { notificationReceived } = notificationSlice.actions;
export default notificationSlice.reducer;
