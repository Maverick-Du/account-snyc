import { formatTime } from "@/utils";

describe("时间格式化", () => {
  test("小于1分钟", () => {
    expect(formatTime(30)).toBe("30 秒 ");
  });

  test("小于1小时", () => {
    expect(formatTime(90)).toBe("1 分钟 30 秒");
    expect(formatTime(120)).toBe("2 分钟 ");
  });

  test("小于1天", () => {
    expect(formatTime(3600)).toBe("1 小时 ");
    expect(formatTime(3661)).toBe("1 小时 1 分钟");
  });

  test("大于1天", () => {
    expect(formatTime(86400)).toBe("1 天 ");
    expect(formatTime(90001)).toBe("1 天 1 小时");
  });
});
