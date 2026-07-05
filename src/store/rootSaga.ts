import { all } from "redux-saga/effects";

// Phase 2 sẽ fork thêm: cartSaga (xử lý addItem/updateQuantity/removeItem
// gọi API + debounce), notificationSaga (eventChannel lắng nghe socket.io).
export function* rootSaga() {
  yield all([
    // watchCartSaga(),
    // watchNotificationSaga(),
  ]);
}
