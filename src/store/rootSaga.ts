import { all } from "redux-saga/effects";
import { watchUpdateQuantity } from "@/features/cart/cartSaga";

export function* rootSaga() {
  yield all([watchUpdateQuantity()]);
}
