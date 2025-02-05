// src/utils/djiConverter.ts

// 动态导入 sql.js，确保获得正确的初始化函数
async function loadDatabase(file: File) {
  const initSqlJsModule = await import("sql.js");
  const initSqlJsFn = initSqlJsModule.default || initSqlJsModule;
  const SQL = await initSqlJsFn({
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

export async function convertDBtoMergedCSV(file: File): Promise<{ filename: string; data: Blob }> {
  const db = await loadDatabase(file);

  // 1. 检查字段并构建动态字段
  let projectFrameField = "";
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
  } else {
    projectFrameField = "NULL";
  }

  // 2. 执行合并查询
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

  const result = db.exec(query);
  let csvContent = "";
  if (result.length > 0) {
    // 处理文件名和格式化数值
    const processedResult = {
      columns: result[0].columns,
      values: result[0].values.map(row => {
        // 处理文件名
        const filePath = row[0] != null ? String(row[0]) : "";
        const parts = filePath.split('/');
        const lastPart = parts[parts.length - 1];

        // 处理 shutter_angle（在第10列）
        const shutterAngle = row[10];
        const formattedShutterAngle = typeof shutterAngle === 'number' 
          ? shutterAngle.toFixed(1)
          : shutterAngle;

        // 处理 aperture（在第12列）
        const aperture = row[12];
        let formattedAperture = aperture;
        if (typeof aperture === 'number') {
          const apertureStr = aperture.toFixed(1).replace(/\.0$/, '');
          const standardApertureValues = ['2.8', '3.2', '3.5', '4', '5.6', '8', '11', '16'];
          if (standardApertureValues.includes(apertureStr)) {
            formattedAperture = `F${apertureStr}`;
          } else {
            formattedAperture = `F ${apertureStr}`;
          }
        }

        return [
          lastPart,
          row[1],
          row[2],
          row[3],  // 直接使用原始帧数
          ...row.slice(4, 10),
          formattedShutterAngle,
          row[11],
          formattedAperture,
          ...row.slice(13)
        ];
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