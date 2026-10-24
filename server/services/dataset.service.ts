/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCSVContent, preprocessData, ParseResult } from '../../src/lib/dataProcessor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatasetService {
  /**
   * Tải và làm sạch tập dữ liệu mẫu chuẩn UCI Online Retail II từ file trên server
   */
  static async loadSampleDataset(): Promise<ParseResult> {
    const samplePath = path.resolve(__dirname, '../../public/data/online_retail_sample.csv');
    if (!fs.existsSync(samplePath)) {
      throw new Error('Tập dữ liệu mẫu public/data/online_retail_sample.csv không tồn tại trên server.');
    }

    const csvContent = fs.readFileSync(samplePath, 'utf-8');
    return parseCSVContent(csvContent);
  }

  /**
   * Tiền xử lý dữ liệu hàng tải lên từ client theo quy tắc UCI
   */
  static preprocessRawRows(rows: Record<string, unknown>[]): ParseResult {
    return preprocessData(rows);
  }
}
