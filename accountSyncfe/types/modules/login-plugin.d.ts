// 增加属性

// import "@ecis/jssdk";
// declare module "@ecis/jssdk" {
//   class EcisSdk {
//     wudi: "";
//   }
//   export function init(): EcisSdk;
// }


/// <reference types="@ecis/jssdk" />

declare namespace ecissdk {
  class EcisSdk {
    get abcd(): any
  }
  export function init(): EcisSdk
}
