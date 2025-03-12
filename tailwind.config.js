import { resolve } from 'path';

/**
 * Tailwind CSS 配置文件
 * 用于自定义主题、颜色、字体等样式
 */
export default {
  /**
   * 内容配置
   * 指定Tailwind应该在哪些文件中寻找类名来生成对应的CSS
   * 使用了所有HTML文件和src目录下的JS/TS/JSX/TSX文件
   */
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  /**
   * 深色模式配置
   * 使用'class'策略，表示通过添加.dark类名来切换深色模式
   * 这比使用媒体查询更灵活，允许用户手动选择主题
   */
  darkMode: 'class',
  
  /**
   * 主题配置
   * 用于扩展或覆盖Tailwind默认主题
   */
  theme: {
    extend: {
      /**
       * 自定义阴影
       * 定义了一个名为'custom'的阴影效果
       */
      boxShadow: {
        'custom': '0 8px 32px rgba(0,0,0,0.12)', // 轻微的浮层阴影效果
      },
      
      /**
       * 自定义颜色
       * 定义了应用中使用的特定颜色变量
       */
      colors: {
        // 选中状态颜色(蓝色)
        selected: '#3366FF',
        // 录制状态颜色(红色)
        rec: '#A91D1F',
        // 浅色主题的颜色集
        light: {
          'bg': '#F1F1F1',           // 背景色(浅灰)
          'card': '#F9F9F9',         // 卡片背景(近白)
          'input': '#F4F4F4',        // 输入框背景(浅灰)
          'placeholder': '#0D0D0D',  // 占位符文本颜色(近黑)
          'titlebar': '#F9F9F9',     // 标题栏背景(近白)
        },
        // 深色主题的颜色集
        dark: {
          'bg': '#212121',           // 背景色(深灰)
          'card': '#171717',         // 卡片背景(近黑)
          'input': '#2F2F2F',        // 输入框背景(中灰)
          'placeholder': '#ECECEC',  // 占位符文本颜色(浅灰白)
          'titlebar': '#171717',     // 标题栏背景(近黑)
        }
      },
      
      /**
       * 自定义字体族
       * 定义了应用中使用的特殊字体
       */
      fontFamily: {
        // 粉笔板字体，用于特殊标题或强调文本
        // 按优先级依次尝试使用Chalkboard SE、Comic Sans MS或通用的cursive字体
        chalkboard: ['"Chalkboard SE"', '"Comic Sans MS"', 'cursive'],
      },
    },
  },
  
  /**
   * Tailwind插件
   * 当前未使用任何插件
   * 可以在此处添加官方或第三方插件来扩展功能
   */
  plugins: [],
}