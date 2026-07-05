import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import appReducer from "./appSlice";
import { rootSaga } from "./rootSaga";

export function makeStore() {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      app: appReducer,
      // cart: cartReducer,        // Phase 2
      // notification: notificationReducer, // Phase 2
    },
    middleware: (getDefault) =>
      getDefault({
        // Cart items chứa Decimal từ Prisma khi serialize qua API có thể
        // biến thành string, nên tạm thời không cần tắt serializableCheck.
        // Sẽ revisit nếu Phase 2 gặp warning.
        thunk: true,
      }).concat(sagaMiddleware),
  });

  sagaMiddleware.run(rootSaga);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
