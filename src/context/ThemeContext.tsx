import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * 主题类型定义
 * 限制主题只能是'light'或'dark'两种值
 */
type Theme = 'light' | 'dark';

/**
 * 主题上下文类型定义
 * 包含当前主题状态
 */
type ThemeContext = { theme: Theme };

/**
 * 创建主题上下文
 * 初始值为undefined，在Provider中提供实际值
 */
const ThemeContext = createContext<ThemeContext | undefined>(undefined);

/**
 * 主题提供者组件
 * 负责管理主题状态并将其提供给子组件
 * @param children 子组件
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 使用useState钩子管理主题状态，默认为'light'
  const [theme, setTheme] = useState<Theme>('light');

  // 使用useEffect钩子在组件挂载时设置主题并监听系统主题变化
  useEffect(() => {
    // 获取系统主题偏好的媒体查询
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    /**
     * 更新主题的函数
     * 根据媒体查询结果设置主题
     * @param e 媒体查询事件或媒体查询列表对象
     */
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      // 如果系统偏好深色模式，则设置为'dark'，否则设置为'light'
      const newTheme = e.matches ? 'dark' : 'light';
      // 更新React状态
      setTheme(newTheme);
      // 更新文档类名以应用对应的CSS样式
      updateDocumentClass(newTheme);
    };

    // 初始化时立即检查并应用系统主题
    updateTheme(mediaQuery);

    // 添加事件监听器，当系统主题变化时更新应用主题
    mediaQuery.addEventListener('change', updateTheme);
    // 组件卸载时移除事件监听器
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []); // 空依赖数组表示此effect只在组件挂载和卸载时执行

  /**
   * 更新文档根元素类名的辅助函数
   * 通过添加或移除'dark'类来控制深色模式
   * @param newTheme 新的主题值
   */
  const updateDocumentClass = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      // 深色模式：添加dark类
      document.documentElement.classList.add('dark');
    } else {
      // 浅色模式：移除dark类
      document.documentElement.classList.remove('dark');
    }
  };

  // 渲染ThemeContext.Provider，提供主题值给所有子组件
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 自定义钩子：使用主题
 * 允许组件方便地访问和使用当前主题
 * @returns 主题上下文对象
 * @throws 如果在ThemeProvider外部使用则抛出错误
 */
export function useTheme() {
  // 使用React的useContext钩子获取主题上下文
  const context = useContext(ThemeContext);
  // 如果上下文未定义（即未在ThemeProvider内使用），则抛出错误
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  // 返回主题上下文供组件使用
  return context;
}