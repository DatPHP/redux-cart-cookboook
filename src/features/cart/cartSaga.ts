import { call, cancel, fork, put, take, delay } from "redux-saga/effects";
import type { Task } from "redux-saga";
import { cartApi, ApiClientError } from "@/lib/cartApi";
import {
  updateQuantityRequested,
  updateQuantityConfirmed,
  updateQuantityRollback,
  itemRemovedExternally,
} from "./cartSlice";

export const DEBOUNCE_MS = 400;

// Worker: xử lý 1 lần debounce + gọi API cho 1 itemId cụ thể.
// Tách riêng thành function để redux-saga-test-plan có thể test độc lập
// mà không cần chạy toàn bộ watcher.
export function* handleUpdateQuantity(
  itemId: number,
  quantity: number,
  previousQuantity: number,
  confirmedQuantity: Map<number, number>,
) {
  yield delay(DEBOUNCE_MS);
  try {
    yield call(cartApi.updateItemQuantity, itemId, quantity);
    yield put(updateQuantityConfirmed({ itemId }));
    confirmedQuantity.set(itemId, quantity);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cập nhật số lượng thất bại";

    // 404 ở đây có ý nghĩa ĐẶC BIỆT: item đã bị 1 request DELETE khác xoá
    // mất trong lúc debounce đang chờ (race condition — vd user giảm
    // quantity xuống 0 trong lúc 1 task debounce trước đó của CÙNG item
    // này vẫn đang chờ 400ms). KHÔNG dùng rollback ở đây — rollback sẽ
    // "hồi sinh" 1 item ma đã bị xoá thật ở DB. Thay vào đó xoá hẳn item
    // khỏi state cho khớp thực tế. Mọi lỗi khác (409 hết hàng, mất mạng,
    // 500...) vẫn rollback như bình thường.
    if (err instanceof ApiClientError && err.status === 404) {
      yield put(itemRemovedExternally({ itemId, error: message }));
      return;
    }

    yield put(
      updateQuantityRollback({
        itemId,
        quantity: previousQuantity,
        error: message,
      }),
    );
  }
}

// Watcher: vì sao KHÔNG dùng takeLatest() có sẵn của redux-saga?
// takeLatest() chỉ giữ đúng 1 task cho TOÀN BỘ pattern — nếu user đổi
// quantity của sản phẩm A rồi ngay lập tức đổi quantity sản phẩm B,
// takeLatest sẽ huỷ nhầm task của A (chưa kịp gọi API) để chạy B.
// Ở đây tự quản lý 1 Map<itemId, Task> để mỗi sản phẩm có debounce
// độc lập — đổi quantity của A không ảnh hưởng tới B.
export function* watchUpdateQuantity() {
  const runningTasks = new Map<number, Task>();
  const confirmedQuantity = new Map<number, number>();

  while (true) {
    const action: ReturnType<typeof updateQuantityRequested> = yield take(
      updateQuantityRequested.type,
    );
    const { itemId, quantity } = action.payload;

    const existingTask = runningTasks.get(itemId);
    if (existingTask) {
      yield cancel(existingTask);
    }

    // Lần đầu tiên gặp itemId này trong phiên làm việc: coi quantity hiện tại
    // (trước khi user bấm) là mốc rollback an toàn.
    if (!confirmedQuantity.has(itemId)) {
      confirmedQuantity.set(itemId, quantity);
    }
    const previousQuantity = confirmedQuantity.get(itemId) as number;

    const task: Task = yield fork(
      handleUpdateQuantity,
      itemId,
      quantity,
      previousQuantity,
      confirmedQuantity,
    );
    runningTasks.set(itemId, task);
  }
}