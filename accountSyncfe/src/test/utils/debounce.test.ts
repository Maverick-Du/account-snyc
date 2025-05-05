import { debounce } from "@/utils";

describe("防抖", () => {
  test("正常情况", () => {
    jest.useFakeTimers();
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 1000);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.runAllTimers();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
