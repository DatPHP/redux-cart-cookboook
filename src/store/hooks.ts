import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// Dùng 2 hook này thay cho useDispatch/useSelector thô ở mọi nơi trong app
// — TypeScript sẽ tự biết đúng kiểu RootState/AppDispatch mà không cần
// generic thủ công mỗi lần gọi.
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
