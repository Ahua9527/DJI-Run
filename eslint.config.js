// 导入ESLint的JavaScript配置
import js from '@eslint/js'
// 导入全局变量定义
import globals from 'globals'
// 导入React Hooks的ESLint插件
import reactHooks from 'eslint-plugin-react-hooks'
// 导入React Fast Refresh的ESLint插件
import reactRefresh from 'eslint-plugin-react-refresh'
// 导入TypeScript ESLint配置
import tseslint from 'typescript-eslint'

/**
 * ESLint配置文件
 * 使用typescript-eslint的平面配置格式
 */
export default tseslint.config(
  // 第一个配置对象：全局忽略设置
  { ignores: ['dist'] }, // 忽略dist目录下的所有文件，这些通常是构建输出文件
  
  // 第二个配置对象：主要的代码检查规则
  {
    // 继承的配置
    extends: [
      js.configs.recommended, // 继承ESLint推荐的JavaScript规则
      ...tseslint.configs.recommended // 展开并继承TypeScript ESLint推荐的规则集
    ],
    
    // 要检查的文件类型匹配模式
    files: ['**/*.{ts,tsx}'], // 只检查所有.ts和.tsx文件(TypeScript和TSX文件)
    
    // 语言选项
    languageOptions: {
      ecmaVersion: 2020, // 指定ECMAScript版本为2020
      globals: globals.browser, // 添加浏览器环境的全局变量(如window, document等)
    },
    
    // 插件配置
    plugins: {
      'react-hooks': reactHooks, // 添加React Hooks的规则检查插件
      'react-refresh': reactRefresh, // 添加React Fast Refresh的规则检查插件
    },
    
    // 具体规则配置
    rules: {
      // 展开并使用React Hooks推荐的规则集
      ...reactHooks.configs.recommended.rules,
      
      // 自定义React Refresh规则
      'react-refresh/only-export-components': [
        'warn', // 设置为警告级别而非错误
        { allowConstantExport: true }, // 允许导出常量而不触发警告
      ],
    },
  },
)