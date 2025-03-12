// 导入React核心库
import React from 'react'
// 导入ReactDOM客户端渲染API
import ReactDOM from 'react-dom/client'
// 导入根组件App
import App from './App.tsx'
// 导入全局样式表
import './styles/index.css'

/**
 * 应用入口文件
 * 
 * 主要功能：
 * 1. 初始化React根节点
 * 2. 渲染应用组件树
 * 3. 设置严格模式检查
 * 4. 添加DOM加载状态类
 */

// 获取DOM根节点并使用非空断言(!)确保元素存在
const rootElement = document.getElementById('root')!

// 创建React根实例并渲染应用
ReactDOM.createRoot(rootElement).render(
  // 启用严格模式（开发环境生效）
  <React.StrictMode>
    {/* 应用根组件 */}
    <App />
  </React.StrictMode>,
)

// 在根元素添加加载完成类（可选链操作符?.确保安全访问）
rootElement?.classList.add('loaded')
