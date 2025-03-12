import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

/**
 * Vite配置文件
 * 用于配置PWA应用、构建优化、开发服务器等
 */
export default defineConfig({
  // 插件配置
  plugins: [
    // React插件，提供React项目支持
    react(),
    
    // 自定义插件：配置响应头
    // 主要用于配置跨域资源共享策略
    {
      name: 'configure-response-headers',
      configureServer: server => {
        server.middlewares.use((_req, res, next) => {
          // 设置跨源打开者策略为同源
          // 用于提高网站安全性，限制跨源窗口交互
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          // 设置跨源嵌入者策略为require-corp
          // 配合COOP使用，防止敏感信息泄露
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          next();
        });
      },
    },
    
    // PWA插件配置
    // 用于将应用转换为渐进式Web应用
    VitePWA({
      // 注册类型：自动更新
      // 当有新版本时自动在后台更新
      registerType: 'autoUpdate',
      
      // 需要缓存的静态资源
      includeAssets: [
        'favicon.ico',            // 网站图标
        'apple-touch-icon.png',   // iOS设备上的应用图标
        'sql-wasm.wasm',          // SQL.js的WebAssembly文件
        // 不同尺寸和类型的应用图标
        'DJI-Run_96_any.png', 
        'DJI-Run_192_any.png', 
        'DJI-Run_512_any.png', 
        'DJI-Run_96_maskable.png', 
        'DJI-Run_192_maskable.png', 
        'DJI-Run_512_maskable.png'
      ],
      
      // PWA清单文件配置
      // 定义应用在安装时的行为和外观
      manifest: {
        name: 'DJI-Run',                  // 应用全名
        short_name: 'DJI-Run',            // 应用简称(用于主屏幕)
        description: '为每一帧元数据保驾护航', // 应用描述
        theme_color: '#171717',           // 主题色(影响浏览器UI)
        background_color: '#171717',      // 背景色(启动画面背景)
        display: 'standalone',            // 显示模式(独立应用而非浏览器)
        id: "/?source=pwa",               // 应用ID
        start_url: '/?source=pwa',        // 启动URL
        scope: '/',                       // 应用作用域
        orientation: 'any',               // 支持的屏幕方向
        categories: ['productivity', 'utilities'], // 应用类别
        
        // 应用图标配置
        // 不同设备和场景下使用的图标
        icons: [
          // Apple设备图标
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          // 通用图标(不同尺寸)
          {
            src: 'DJI-Run_96_any.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'          // 用途：任何场景
          },
          {
            src: 'DJI-Run_192_any.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'DJI-Run_512_any.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          // 可遮罩图标(用于自适应图标的系统)
          {
            src: 'DJI-Run_96_maskable.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable'     // 用途：可遮罩(适配圆形等形状)
          },
          {
            src: 'DJI-Run_192_maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'DJI-Run_512_maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      
      // Workbox配置(Service Worker的核心库)
      workbox: {
        skipWaiting: true,         // 新SW立即接管，不等待旧SW终止
        clientsClaim: true,        // SW激活后立即控制所有客户端
        
        // 全局匹配模式：定义哪些文件需要缓存
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,jpg,jpeg,gif,json,webp,wasm}'
        ],
        
        // 运行时缓存策略
        runtimeCaching: [
          {
            // 匹配来自cloudflare CDN的资源
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            // 缓存优先策略：优先使用缓存，减少网络请求
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',   // 缓存名称
              expiration: {
                maxEntries: 20,         // 最多缓存20个条目
                maxAgeSeconds: 60 * 60 * 24 * 365  // 缓存有效期：1年
              },
              cacheableResponse: {
                statuses: [0, 200]      // 缓存状态码为0或200的响应
              }
            }
          }
        ]
      }
    })
  ],
  
  // 依赖优化配置
  optimizeDeps: {
    exclude: ['sql.js']  // 排除sql.js不进行依赖优化，因为它需要特殊处理
  },

  // 构建配置
  build: {
    target: 'esnext',      // 目标环境：最新的ECMAScript标准
    sourcemap: true,       // 生成源映射，便于调试
    
    // Rollup打包选项
    rollupOptions: {
      output: {
        // 手动分块配置：将特定库分离到独立的块中
        manualChunks: {
          sqljs: ['sql.js'],              // SQL.js单独打包
          vendor: ['react', 'react-dom']  // React相关库单独打包
        }
      }
    },
    chunkSizeWarningLimit: 1000  // 块大小警告限制(KB)
  },
  
  // 路径解析配置
  resolve: {
    // 路径别名：简化导入路径
    alias: {
      '@': '/src',                // @指向src目录
      '@components': '/src/components',  // 组件目录别名
      '@assets': '/src/assets'    // 资源目录别名
    }
  },
  
  // 开发服务器配置
  server: {
    // 安全相关的HTTP响应头
    headers: {
      // 跨源打开者策略：同源
      'Cross-Origin-Opener-Policy': 'same-origin',
      // 跨源嵌入者策略：要求资源明确允许跨源使用
      'Cross-Origin-Embedder-Policy': 'require-corp',
      // 内容安全策略：控制资源加载
      'Content-Security-Policy': [
        "default-src 'self'",                           // 默认只允许同源资源
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",  // 脚本来源限制
        "style-src 'self' 'unsafe-inline'",             // 样式来源限制
        "img-src 'self' data: blob:",                   // 图片来源限制
        "font-src 'self'",                              // 字体来源限制
        "connect-src 'self' blob:"                      // 连接来源限制
      ].join('; '),
      // 阻止MIME类型嗅探
      'X-Content-Type-Options': 'nosniff',
      // 阻止网站被嵌入iframe
      'X-Frame-Options': 'DENY',
      // XSS保护
      'X-XSS-Protection': '1; mode=block',
      // 控制Referer头的发送策略
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    // HTTPS配置：本地开发使用自签名证书
    https: {
      key: fs.readFileSync('localhost-key.pem'),    // 私钥文件
      cert: fs.readFileSync('localhost.pem'),       // 证书文件
    }
  }
})