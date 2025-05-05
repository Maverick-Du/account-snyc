//@ts-nocheck
export function debounce(func, delay: number) {
  let timerId: number;
  return function (...args: Parameters<typeof func>) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
