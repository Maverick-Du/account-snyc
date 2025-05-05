import { camel, getEnumKeyByValue } from "@/utils";

describe("驼峰转换", () => {
  test("正常情况", () => {
    expect(camel({ a_b: 1, c_d: { e_f: 2 } })).toEqual({ aB: 1, cD: { eF: 2 } });
  });

  test("数据为空情况", () => {
    // @ts-ignore
    expect(camel()).toBeUndefined();
  });

  test("数据为数组情况", () => {
    expect(camel([{ a_b: 1 }, { c_d: 2 }])).toEqual([{ aB: 1 }, { cD: 2 }]);
  });
});

describe("根据值获取枚举键", () => {
  enum TestEnum {
    A = 1,
    B = 2,
  }

  test("正常情况", () => {
    expect(getEnumKeyByValue(TestEnum, 2)).toBe("B");
  });

  test("值不存在情况", () => {
    expect(getEnumKeyByValue(TestEnum, 3)).toBeUndefined();
  });
});
