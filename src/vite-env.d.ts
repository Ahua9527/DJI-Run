/// <reference types="vite/client" />

// 声明CSS模块类型
declare module '*.css' {
  const css: { [key: string]: string }
  export default css
}
