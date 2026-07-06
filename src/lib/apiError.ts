export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Dùng chung ở mọi route handler: try { ... } catch (err) { return handleApiError(err) }
// -> đảm bảo mọi lỗi (biết trước hay không) đều trả về đúng format { message } + status code,
// thay vì để Next.js tự trả HTML error page mặc định.
export function handleApiError(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ message: err.message }, { status: err.status });
  }
  console.error("[api/cart] Unexpected error:", err);
  return Response.json(
    { message: "Đã có lỗi xảy ra ở server" },
    { status: 500 },
  );
}
