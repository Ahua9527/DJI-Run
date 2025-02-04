// src/utils/djiConverter.ts

// 动态导入 sql.js，确保获得正确的初始化函数
async function loadDatabase(file: File) {
  const initSqlJsModule = await import("sql.js");
  const initSqlJsFn = initSqlJsModule.default || initSqlJsModule;
  const SQL = await initSqlJsFn({
    // public 目录下的文件在部署后直接映射到根路径
    locateFile: (fileName) => `/${fileName}`
  });
  const buffer = await file.arrayBuffer();
  return new SQL.Database(new Uint8Array(buffer));
}

// CSV 转义函数：处理包含逗号、双引号或换行符的字段
function csvEscape(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 将 db.exec 查询结果转换为 CSV 格式字符串
function convertResultToCSV(result: any): string {
  if (!result || result.length === 0) return "";
  const queryResult: { columns: string[]; values: any[][] } = result[0];
  const columns = queryResult.columns;
  const rows = queryResult.values;
  const csvLines: string[] = [];
  csvLines.push(columns.join(","));
  rows.forEach((row: any[]) => {
    const line = row.map((val: any) => csvEscape(val)).join(",");
    csvLines.push(line);
  });
  return csvLines.join("\n");
}

/**
 * 合并 video_info_table 与 gis_info_table 表
 * 合并规则：
 *   - 先过滤 video_info_table 中 duration <= 0 的记录
 *   - INNER JOIN 两表，连接条件：v.ID = g.ID
 *   - 验证有效数据条数匹配
 */
export async function convertDBtoMergedCSV(file: File): Promise<{ filename: string; data: Blob }> {
  const db = await loadDatabase(file);

  // 1. 检查字段并构建动态字段
  let projectFrameField = "";
  let digitalEffectField = "";
  const pragmaResult = db.exec("PRAGMA table_info(video_info_table);");
  if (pragmaResult && pragmaResult.length > 0 && pragmaResult[0].values) {
    const columnsInfo: any[] = pragmaResult[0].values;
    const columnNames = columnsInfo.map(row => row[1]);

    if (columnNames.includes("project_frame_num")) {
      projectFrameField = "CAST(v.project_frame_num AS FLOAT) / CAST(v.project_frame_den AS FLOAT)";
    } else if (columnNames.includes("project_frame")) {
      projectFrameField = "CAST(v.project_frame AS FLOAT) / CAST(v.frame_den AS FLOAT)";
    } else {
      projectFrameField = "NULL";
    }

    if (columnNames.includes("digital_effect")) {
      digitalEffectField = "v.digital_effect";
    } else {
      digitalEffectField = "''";
    }
  } else {
    projectFrameField = "NULL";
    digitalEffectField = "''";
  }

  // 2. 验证数据完整性
  const validationQuery = `
    SELECT 
      (SELECT COUNT(*) FROM video_info_table WHERE duration > 0) as valid_video_count,
      (SELECT COUNT(*) FROM video_info_table) as total_video_count,
      (SELECT COUNT(*) FROM gis_info_table) as gis_count,
      (
        SELECT COUNT(*)
        FROM video_info_table v
        JOIN gis_info_table g ON v.ID = g.video_index
        WHERE v.duration > 0
      ) as matched_count;
  `;
  
  const validationResult = db.exec(validationQuery);
  if (!validationResult || !validationResult[0] || !validationResult[0].values || !validationResult[0].values[0]) {
    throw new Error('无法验证数据表完整性');
  }

  const [validVideoCount, totalVideoCount, gisCount, matchedCount] = validationResult[0].values[0];

  // 3. 验证数据
  if (validVideoCount === 0) {
    throw new Error('没有有效的视频记录(所有 duration 均为 0 或 -1)');
  }

  if (validVideoCount !== gisCount) {
    throw new Error(
      `数据不匹配: 有效视频记录数(${validVideoCount}) 与 GIS记录数(${gisCount}) 不一致。\n` +
      `总视频记录数: ${totalVideoCount}, 有效视频记录数: ${validVideoCount}, GIS记录数: ${gisCount}`
    );
  }

  if (matchedCount !== validVideoCount) {
    throw new Error(
      `基于video_index的匹配记录数(${matchedCount})与有效视频记录数(${validVideoCount})不一致\n` +
      `这可能表明video_index与ID不完全匹配`
    );
  }

  // 4. 执行合并查询，添加 ND 值转换
  const query = `
    SELECT
      g.file_name,
      ${projectFrameField} AS "Project FPS",
      CAST(v.frame_num AS FLOAT) / CAST(v.frame_den AS FLOAT) AS "Sensor FPS",
      v.resolution_width,
      v.resolution_height,
      v.rotation,
      v.encode_format,
      v.shutter_integer,
      v.ei_value,
      v.wb_count,
      v.wb_tint,
      v.shutter_angle,
      CASE 
        WHEN v.nd_value = 0 THEN 'Clear'
        ELSE ROUND(LOG10(v.nd_value), 1)
      END AS nd_value,
      v.aperture,
      v.ev_bias,
      v.shutter_type,
      v.venc_type,
      v.model_name,
      ${digitalEffectField} AS digital_effect,
      v.duration
    FROM video_info_table v
    JOIN gis_info_table g ON v.ID = g.video_index
    WHERE v.duration > 0
    ORDER BY v.ID;
  `;

  const result = db.exec(query);
  let csvContent = "";
  if (result.length > 0) {
    // 处理文件名，只保留最后一部分
    const processedResult = {
      columns: result[0].columns,
      values: result[0].values.map(row => {
        if (row[0] != null) {
          const filePath = String(row[0]);
          const parts = filePath.split('/');
          const lastPart = parts[parts.length - 1];
          return [lastPart, ...row.slice(1)];
        }
        return row;
      })
    };
    csvContent = convertResultToCSV([processedResult]);

    // 使用第一行的完整路径来生成输出文件名
    let outputFileName = "merged.csv";
    const firstRowPath = result[0].values[0]?.[0];
    if (firstRowPath != null) {
      const filePath = String(firstRowPath);
      const parts = filePath.split('/');
      if (parts.length >= 2) {
        outputFileName = `${parts[parts.length - 2]}.csv`;
      }
    }

    db.close();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    return { filename: outputFileName, data: blob };
  }

  throw new Error('合并查询无有效数据');
}