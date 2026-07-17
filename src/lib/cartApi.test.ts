// Mock cartSession — getCartSessionId() thật sẽ throw vì Jest chạy ở
// testEnvironment "node" (không có window/localStorage). Test này chỉ
// quan tâm hành vi xử lý response của request(), không quan tâm session
// id thật sự là gì.
jest.mock("./cartSession", () => ({
  getCartSessionId: () => "test-session-id",
}));

import { cartApi, ApiClientError } from "./cartApi";

function mockFetchOnce(response: {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}) {
  global.fetch = jest.fn().mockResolvedValueOnce(response);
}

describe("cartApi — xử lý lỗi HTTP qua ApiClientError", () => {
  it("request thành công: trả về đúng JSON body, không throw", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, items: [] }),
    });

    const result = await cartApi.fetchCart();

    expect(result).toEqual({ id: 1, items: [] });
  });

  it("request thất bại: throw ApiClientError giữ ĐÚNG status code từ response", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({
        message: "Sản phẩm này đã bị xoá khỏi giỏ trước đó",
      }),
    });

    await expect(cartApi.updateItemQuantity(1, 5)).rejects.toMatchObject({
      status: 404,
      message: "Sản phẩm này đã bị xoá khỏi giỏ trước đó",
    });
  });

  it("throw đúng instance ApiClientError (không phải Error thường) để cartSaga phân biệt được bằng instanceof", async () => {
    mockFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: "Hết hàng" }),
    });

    await expect(cartApi.addItem(1, 2)).rejects.toBeInstanceOf(ApiClientError);
  });

  it("response body không parse được JSON (vd server trả HTML lỗi 500) -> vẫn có message fallback hợp lý", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("Unexpected token < in JSON");
      },
    });

    await expect(cartApi.clearCart()).rejects.toMatchObject({
      status: 500,
      message: "HTTP 500",
    });
  });
});
