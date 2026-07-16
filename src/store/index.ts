import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import appReducer from "./appSlice";
import cartReducer from "@/features/cart/cartSlice";
import notificationReducer from "@/features/notification/notificationSlice";
import { rootSaga } from "./rootSaga";

export function makeStore() {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      app: appReducer,
      cart: cartReducer,
      notification: notificationReducer,
    },
    middleware: (getDefault) =>
      getDefault({
        thunk: true,
      }).concat(sagaMiddleware),
  });

  sagaMiddleware.run(rootSaga);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];