import { createSlice } from "@reduxjs/toolkit";

// Slice tạm thời chỉ để verify store + saga middleware chạy đúng
// ở Phase 1. Phase 2 sẽ thay bằng cartSlice + notificationSlice thật.
const appSlice = createSlice({
  name: "app",
  initialState: { bootstrapped: true },
  reducers: {},
});

export default appSlice.reducer;
