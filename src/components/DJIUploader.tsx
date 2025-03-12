import React, { useState, useRef } from 'react';
import { Database, X, Github } from 'lucide-react';
import { convertDBtoMergedCSV } from '../utils/djiConverter';

/**
 * DJIUploader组件
 * 用于上传DJI数据库文件并转换为CSV格式
 * 支持拖放和文件选择功能
 */
const DJIUploader = () => {
  // 状态管理
  const [files, setFiles] = useState<File[]>([]); // 存储上传的文件列表
  const [isDragging, setIsDragging] = useState(false); // 拖拽状态标识
  const [processing, setProcessing] = useState(false); // 文件处理状态
  const [currentFile, setCurrentFile] = useState<string>(''); // 当前正在处理的文件名
  const [progress, setProgress] = useState<number>(0); // 处理进度(0-100)
  const fileInputRef = useRef<HTMLInputElement>(null); // 文件输入框的引用

  /**
   * 处理拖拽进入事件
   * 当文件被拖入上传区域时触发
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 阻止事件冒泡
    setIsDragging(true); // 设置拖拽状态为true
  };

  /**
   * 处理拖拽离开事件
   * 当拖拽离开上传区域时触发
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // 设置拖拽状态为false
  };

  /**
   * 处理拖拽悬停事件
   * 当文件悬停在上传区域上时触发
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * 处理文件放置事件
   * 当文件被放置在上传区域时触发
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // 重置拖拽状态
    
    const droppedFiles = Array.from(e.dataTransfer.files); // 获取拖放的文件
    handleFiles(droppedFiles); // 处理拖放的文件
  };

  /**
   * 处理添加的文件
   * 验证文件类型和大小，并添加到文件列表
   * @param newFiles 新添加的文件数组
   */
  const handleFiles = (newFiles: File[]) => {
    // 检查文件总数限制
    if (files.length + newFiles.length > 99) {
      alert('最多只能上传99个文件');
      return;
    }

    // 过滤出有效的DB文件（扩展名为.db且大小不超过100MB）
    const validFiles = newFiles.filter(file => {
      const isDB = file.name.toLowerCase().endsWith('.db');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB
      return isDB && isValidSize;
    });

    // 如果没有有效文件，显示提示信息
    if (validFiles.length === 0) {
      alert('请上传数据库文件（.db），且文件大小不超过100MB');
      return;
    }

    // 添加有效文件到状态
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  /**
   * 从文件列表中移除指定索引的文件
   * @param index 要移除的文件索引
   */
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 清空所有已上传的文件
   */
  const clearFiles = () => {
    setFiles([]);
  };

  /**
   * 格式化文件大小显示
   * 根据字节数转换为合适的单位(B, KB, MB)
   * @param bytes 文件大小（字节）
   * @returns 格式化后的文件大小字符串
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  /**
   * 下载Blob数据为文件
   * @param blob 要下载的Blob数据
   * @param filename 下载的文件名
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob); // 创建Blob URL
    const a = document.createElement('a'); // 创建一个a标签
    a.href = url; // 设置链接
    a.download = filename; // 设置下载文件名
    document.body.appendChild(a); // 添加到DOM
    a.click(); // 触发下载
    document.body.removeChild(a); // 从DOM移除
    URL.revokeObjectURL(url); // 释放URL对象
  };

  /**
   * 处理文件转换过程
   * 将所有数据库文件转换为CSV并下载
   */
  const handleProcess = async () => {
    if (!files.length) return; // 如果没有文件，则不执行任何操作
    setProcessing(true); // 设置为处理状态
    setProgress(0); // 重置进度
    
    /**
     * 内部函数：处理所有文件并返回结果
     * @returns 处理结果数组
     */
    const processFiles = async () => {
      const results = [];
      
      // 遍历所有文件进行处理
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name); // 更新当前处理的文件名
        
        try {
          // 调用转换函数处理文件
          const result = await convertDBtoMergedCSV(file);
          results.push(result);
          setProgress(((i + 1) / files.length) * 100); // 更新进度
        } catch (error) {
          console.error('处理文件时出错:', file.name, error);
          throw error; // 抛出错误以便外部处理
        }
      }
      
      return results;
    };

    try {
      // 处理所有文件
      const results = await processFiles();
      // 逐个下载转换后的文件
      for (const result of results) {
        downloadBlob(result.data, result.filename);
        await new Promise(resolve => setTimeout(resolve, 300)); // 下载间隔延迟
      }
    } catch (error) {
      // 处理错误并显示给用户
      alert(`处理文件时发生错误: ${(error as Error).message}`);
    } finally {
      // 无论成功或失败，都重置处理状态
      setProcessing(false);
      setCurrentFile('');
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg transition-all duration-500 ease-in-out">
      {/* 主要内容区域 */}
      <main className="flex-grow flex items-center justify-center p-6 pb-32 bg-light-bg dark:bg-dark-bg">
        <div className="w-full max-w-2xl bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-10 min-h-[400px] transition-all duration-500 ease-in-out">
          {/* 标题和副标题 */}
          <h1 className="text-4xl font-chalkboard font-bold text-gray-900 dark:text-white mt-8 mb-2 text-center tracking-wide transition-colors duration-500 ease-in-out [filter:drop-shadow(4px_8px_12px_rgba(0,0,0,0.3))]">
            DJI<span className="text-rec">Run</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-12 text-center">
            为每一帧元数据保驾护航
          </p>

          {/* 文件上传区域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              上传数据库文件
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
                ${isDragging 
                  ? 'border-selected bg-cyan-50 dark:bg-cyan-900' // 拖拽时的样式
                  : 'border-gray-300 dark:border-gray-600 hover:bg-light-bg dark:hover:bg-dark-bg' // 默认样式
                }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()} // 点击触发文件选择
            >
              {/* 隐藏的文件输入框 */}
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept=".db" // 只接受.db文件
                multiple // 允许多选
                onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              />
              <div className="text-center">
                {/* 数据库图标 */}
                <Database className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-1 text-sm text-blue-500 hover:text-blue-500">
                  点击或拖拽数据库文件到此处
                </p>
              </div>
            </div>
          </div>

          {/* 文件列表和处理按钮（仅当有文件时显示） */}
          {files.length > 0 && (
            <div className="space-y-4 mt-4">
              {/* 文件计数和清空按钮 */}
              <div className="flex justify-between items-center my-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  已上传文件 ({files.length})
                </h3>
                <button
                  onClick={clearFiles}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  清空
                </button>
              </div>
              
              {/* 文件列表 */}
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 
                           border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
                >
                  {/* 文件图标和信息 */}
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  {/* 删除按钮 */}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              ))}

              {/* 处理进度显示（仅当正在处理时显示） */}
              {processing && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    正在处理: {currentFile}
                  </div>
                  {/* 进度条 */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-selected h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }} // 动态设置进度条宽度
                    />
                  </div>
                </div>
              )}

              {/* 处理按钮 */}
              <div className="space-y-4">
                <button
                  onClick={handleProcess}
                  disabled={processing} // 处理中禁用按钮
                  className={`w-full py-2 px-4 rounded-md font-medium transition-all
                    ${processing 
                      ? 'bg-selected/70 cursor-not-allowed' // 处理中的样式
                      : 'bg-selected hover:bg-blue-600 text-white shadow-md hover:shadow-lg' // 默认样式
                    }`}
                >
                  {processing ? '处理中...' : `处理 ${files.length} 个文件`}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 页脚区域 */}
      <footer className="fixed bottom-0 w-full bg-gradient-to-t from-light-bg/95 via-light-bg/80 to-light-bg/0 dark:from-dark-bg/95 dark:via-dark-bg/80 dark:to-dark-bg/0">
        <div className="container mx-auto px-4 py-4">
          {/* GitHub链接 */}
          <div className="flex items-center justify-center space-x-6">
            <a
              href="https://github.com/Ahua9527/DJI-Run"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-selected"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
          {/* 版权信息 */}
          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            DJI-Run © 2025 | Designed & Developed by 哆啦Ahua🌱
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DJIUploader;