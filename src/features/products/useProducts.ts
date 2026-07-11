import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/productApi";

// Đây là ví dụ rõ nhất cho nguyên tắc "server state dùng react-query":
// danh sách Product không nằm trong Redux store — component nào cần thì
// tự gọi useProducts(), react-query lo cache/refetch/stale, Redux không
// biết gì về Product cả (chỉ biết về CartItem tham chiếu tới productId).
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 60_000, // danh sách sản phẩm ít đổi, cache 1 phút là hợp lý
  });
}
