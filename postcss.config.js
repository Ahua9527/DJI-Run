/**
 * PostCSS配置文件
 * PostCSS是一个用JavaScript转换CSS的工具
 * 它允许使用各种插件来转换样式
 */
export default {
  /**
   * 插件配置
   * 定义了处理CSS时要使用的PostCSS插件
   */
  plugins: {
    /**
     * Tailwind CSS插件
     * 用于处理Tailwind指令并生成对应的CSS
     * 将@tailwind指令转换为实际的工具类CSS
     * 空对象{}表示使用默认配置，会自动读取tailwind.config.js文件
     */
    tailwindcss: {},
    
    /**
     * Autoprefixer插件
     * 用于自动添加浏览器前缀，确保CSS兼容不同浏览器
     * 例如将transform属性自动扩展为:
     * -webkit-transform, -moz-transform, -ms-transform等
     * 空对象{}表示使用默认配置，会根据browserslist来确定需要添加哪些前缀
     */
    autoprefixer: {},
  },
}