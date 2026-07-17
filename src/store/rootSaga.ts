import { all } from "redux-saga/effects";
import { watchUpdateQuantity } from "@/features/cart/cartSaga";
import { watchSocketNotifications } from "@/features/notification/notificationSaga";

export function* rootSaga() {
  yield all([watchUpdateQuantity(), watchSocketNotifications()]);
}
