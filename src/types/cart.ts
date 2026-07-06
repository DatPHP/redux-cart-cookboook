// Kiểu dữ liệu dùng chung giữa API route (server) và Redux (client).
// price là string vì Prisma Decimal serialize qua JSON thành string
// (tránh mất độ chính xác số thập phân khi truyền qua network).

export interface CartItemDTO {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    stock: number;
    image: string | null;
  };
}

export interface CartDTO {
  id: number;
  items: CartItemDTO[];
}
