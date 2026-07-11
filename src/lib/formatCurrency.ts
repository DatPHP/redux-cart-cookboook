const formatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

// price từ API luôn là string (Prisma Decimal serialize qua JSON) nên
// phải Number() trước khi format — làm tập trung ở đây để không lặp lại
// logic parse ở từng component.
export function formatCurrency(price: string | number): string {
  return formatter.format(Number(price));
}
