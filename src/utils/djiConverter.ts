/**
 * 加载SQL.js并初始化数据库
 * @param file 要加载的数据库文件
 * @returns 返回初始化后的SQL.js数据库实例
 */
async function loadDatabase(file: File) {
  // 动态导入sql.js模块
  const initSqlJsModule = await import("sql.js");
  // 获取初始化函数(兼容不同的导入方式)
  const initSqlJsFn = initSqlJsModule.default || initSqlJsModule;
  // 初始化SQL.js，配置wasm文件的位置
  const SQL = await initSqlJsFn({
    locateFile: (fileName) => `/${fileName}`
  });
  // 将文件转换为ArrayBuffer
  const buffer = await file.arrayBuffer();
  // 创建并返回数据库实例
  return new SQL.Database(new Uint8Array(buffer));
}

/**
 * CSV字段值转义处理
 * 处理包含逗号、双引号或换行符的字段，确保CSV格式正确
 * @param value 需要转义的字段值
 * @returns 转义后的字符串
 */
function csvEscape(value: any): string {
  // 处理空值
  if (value === null || value === undefined) return "";
  // 转换为字符串
  const str = String(value);
  // 如果包含特殊字符，需要用双引号包裹并转义内部的双引号
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  // 不包含特殊字符则直接返回
  return str;
}

/**
 * 将SQL查询结果转换为CSV格式字符串
 * @param result SQL.js执行查询后的结果
 * @returns 格式化后的CSV内容字符串
 */
function convertResultToCSV(result: any): string {
  // 检查结果是否为空
  if (!result || result.length === 0) return "";
  // 获取查询结果(列名和数据行)
  const queryResult: { columns: string[]; values: any[][] } = result[0];
  const columns = queryResult.columns;
  const rows = queryResult.values;
  // 创建CSV行数组
  const csvLines: string[] = [];
  // 添加生成器信息和网站信息作为注释行
  csvLines.push("# Generator: 哆啦Ahua 🌱");
  csvLines.push("#Site: https://djirun.ahua.space");
  // 添加列标题行
  csvLines.push(columns.join(","));
  // 处理每一行数据
  rows.forEach((row: any[]) => {
    // 对每个字段值进行转义处理并用逗号连接
    const line = row.map((val: any) => csvEscape(val)).join(",");
    csvLines.push(line);
  });
  // 用换行符连接所有行，形成最终的CSV内容
  return csvLines.join("\n");
}

/**
 * 将DJI数据库文件转换为合并的CSV文件
 * @param file DJI数据库文件(.db)
 * @returns 包含文件名和Blob数据的对象
 */
export async function convertDBtoMergedCSV(file: File): Promise<{ filename: string; data: Blob }> {
  // 加载数据库
  const db = await loadDatabase(file);

  // 动态确定项目帧率字段
  let projectFrameField = "";
  // 查询video_info_table表的字段信息
  const pragmaResult = db.exec("PRAGMA table_info(video_info_table);");
  if (pragmaResult && pragmaResult.length > 0 && pragmaResult[0].values) {
    // 解析表字段信息
    const columnsInfo: any[] = pragmaResult[0].values;
    // 提取所有列名
    const columnNames = columnsInfo.map(row => row[1]);

    // 根据不同版本的DJI数据库结构选择合适的帧率计算字段
    if (columnNames.includes("project_frame_num")) {
      // 较新版本使用project_frame_num和project_frame_den
      projectFrameField = "CAST(v.project_frame_num AS FLOAT) / CAST(v.project_frame_den AS FLOAT)";
    } else if (columnNames.includes("project_frame")) {
      // 旧版本使用project_frame和frame_den
      projectFrameField = "CAST(v.project_frame AS FLOAT) / CAST(v.frame_den AS FLOAT)";
    } else {
      // 如果都不存在，则设为NULL
      projectFrameField = "NULL";
    }
  } else {
    // 查询失败或没有结果，设为NULL
    projectFrameField = "NULL";
  }

  // 构建SQL查询语句，合并video_info_table和gis_info_table的数据
  const query = `
    SELECT
      g.file_name,
      ${projectFrameField} AS "project_fps",
      CAST(v.frame_num AS FLOAT) / CAST(v.frame_den AS FLOAT) AS "sensor_fps",
      v.duration,
      v.resolution_width,
      v.resolution_height,
      '1/' || v.shutter_integer AS shutter_integer,
      v.ei_value,
      v.wb_count,
      v.wb_tint,
      CAST(v.shutter_angle AS FLOAT) / 10.0 AS shutter_angle,
      CASE 
        WHEN v.nd_value = 0 THEN 'Clear'
        ELSE ROUND(LOG10(v.nd_value), 1)
      END AS nd_value,
      CAST(v.aperture AS FLOAT) / 100.0 AS aperture,
      v.model_name
    FROM video_info_table v
    JOIN gis_info_table g ON v.ID = g.video_index
    ORDER BY v.ID;
  `;

  // 执行查询
  const result = db.exec(query);
  let csvContent = "";
  if (result.length > 0) {
    // 处理查询结果，优化输出格式
    const processedResult = {
      columns: result[0].columns,
      values: result[0].values.map(row => {
        // 从完整路径中提取文件名
        const filePath = row[0] != null ? String(row[0]) : "";
        const parts = filePath.split('/');
        const lastPart = parts[parts.length - 1];

        // 格式化快门角度，保留一位小数
        const shutterAngle = row[10];
        const formattedShutterAngle = typeof shutterAngle === 'number' 
          ? shutterAngle.toFixed(1)
          : shutterAngle;

        // 格式化光圈值，为标准光圈值添加"F"前缀
        const aperture = row[12];
        let formattedAperture = aperture;
        if (typeof aperture === 'number') {
          // 移除不必要的零小数
          const apertureStr = aperture.toFixed(1).replace(/\.0$/, '');
          // 标准光圈值列表
          const standardApertureValues = ['2.8', '3.2', '3.5', '4', '5.6', '8', '11', '16'];
          // 根据是否为标准光圈值决定格式
          if (standardApertureValues.includes(apertureStr)) {
            formattedAperture = `F${apertureStr}`;
          } else {
            formattedAperture = `F ${apertureStr}`;
          }
        }

        // 构建新的处理后的行数据
        return [
          lastPart, // 使用提取的文件名替代完整路径
          row[1],   // project_fps
          row[2],   // sensor_fps
          row[3],   // duration
          ...row.slice(4, 10), // 其他原始字段
          formattedShutterAngle, // 格式化的快门角度
          row[11],  // nd_value
          formattedAperture, // 格式化的光圈值
          ...row.slice(13) // 剩余字段
        ];
      })
    };
    // 转换为CSV格式
    csvContent = convertResultToCSV([processedResult]);

    // 生成输出文件名，默认为merged.csv
    let outputFileName = "merged.csv";
    // 尝试从第一行的文件路径提取文件夹名作为输出文件名
    const firstRowPath = result[0].values[0]?.[0];
    if (firstRowPath != null) {
      const filePath = String(firstRowPath);
      const parts = filePath.split('/');
      if (parts.length >= 2) {
        // 使用倒数第二部分(通常是文件夹名)作为输出文件名
        outputFileName = `${parts[parts.length - 2]}.csv`;
      }
    }

    // 关闭数据库连接
    db.close();
    // 创建包含CSV内容的Blob对象
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    // 返回文件名和数据
    return { filename: outputFileName, data: blob };
  }

  // 如果没有查询结果，抛出错误
  throw new Error('合并查询无有效数据');
}