/**
   * 获取n位随机字符串
   * @param length 字符串位数
   * @returns
   */
export function str(length: number) {
  const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let randomStr = ''
  let random
  for (let i = 0; i < length; i++) {
    random = Math.floor(Math.random() * str.length)
    randomStr += str.charAt(random)
  }
  return randomStr
}

export function num(max: number) {
  let random
  while (true) {
    random = Math.floor(Math.random() * max)
    // 需满足条件：max/10 < random < max
    if (random < max && random >= max / 10) {
      break
    }
  }
  return random
}
