// 导入DJI设备数据上传组件
import DJIUploader from './components/DJIUploader'
// 导入PWA应用更新提示组件
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
// 导入主题上下文提供者
import { ThemeProvider } from './context/ThemeContext'

/**
 * 应用根组件
 * 
 * 功能：
 * 1. 提供全局主题上下文
 * 2. 布局基础页面结构
 * 3. 集成主要功能组件
 */
function App() {
  return (
    // 使用主题上下文提供者包裹整个应用
    <ThemeProvider>
      {/* 主容器：设置最小视口高度、背景色和主题切换动画 */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* DJI设备数据上传功能模块 */}
        <DJIUploader />
        
        {/* PWA应用更新提示组件 */}
        <PWAUpdatePrompt />
      </div>
    </ThemeProvider>
  )
}

export default App
