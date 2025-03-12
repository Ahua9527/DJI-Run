import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

/**
 * PWA更新提示组件
 * 当PWA有新版本可用时，显示更新提示对话框
 * 用户可以选择更新应用或忽略更新
 */
const PWAUpdatePrompt = () => {
  // 控制是否需要显示更新提示的状态
  const [needRefresh, setNeedRefresh] = useState(false)

  useEffect(() => {
    /**
     * 处理PWA更新可用事件的回调函数
     * 当接收到pwa-update-available事件时，显示更新提示
     * @param event 事件对象
     */
    const handler = (event: Event) => {
      // 检查事件是否包含newServiceWorker属性且是CustomEvent类型
      // 这表明有新的Service Worker可用，即应用有更新
      if ('newServiceWorker' in event && event instanceof CustomEvent) {
        setNeedRefresh(true) // 设置状态为需要刷新，触发UI显示
      }
    }

    // 添加事件监听器，监听PWA更新可用事件
    window.addEventListener('pwa-update-available', handler)
    
    // 组件卸载时移除事件监听器，防止内存泄漏
    return () => window.removeEventListener('pwa-update-available', handler)
  }, []) // 空依赖数组表示此effect只在组件挂载时运行一次

  /**
   * 处理用户确认更新操作
   * 发送pwa-update-accepted事件通知Service Worker进行更新
   * 然后隐藏更新提示
   */
  const updateApp = () => {
    // 创建一个更新接受事件
    const event = new Event('pwa-update-accepted')
    // 分发事件，这将被Service Worker监听并处理
    window.dispatchEvent(event)
    // 隐藏更新提示
    setNeedRefresh(false)
  }

  // 如果不需要刷新，不渲染任何内容
  if (!needRefresh) return null

  // 渲染更新提示UI
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 
                    rounded-lg shadow-lg p-4 flex items-center justify-between gap-4 z-50
                    border border-gray-200 dark:border-gray-700 max-w-sm w-11/12">
      {/* 提示文本 */}
      <p className="text-sm text-gray-700 dark:text-gray-300">
        新版本可用，是否更新？
      </p>
      {/* 按钮组 */}
      <div className="flex items-center gap-2">
        {/* 确认更新按钮 */}
        <button
          onClick={updateApp}
          className="px-3 py-1 bg-selected text-white rounded-md text-sm hover:bg-blue-600 
                     transition-colors duration-200"
        >
          更新
        </button>
        {/* 关闭提示按钮 */}
        <button
          onClick={() => setNeedRefresh(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full 
                     transition-colors duration-200"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  )
}

export default PWAUpdatePrompt