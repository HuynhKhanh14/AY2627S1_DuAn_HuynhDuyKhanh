/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { DatasetService } from '../services/dataset.service';

export class DatasetController {
  /**
   * GET /api/dataset/sample
   */
  static async getSampleDataset(_req: Request, res: Response) {
    try {
      const result = await DatasetService.loadSampleDataset();
      res.status(200).json({
        success: result.success,
        transactions: result.transactions,
        stats: result.stats,
        previewRows: result.previewRows,
        itemMetadata: Array.from(result.itemMetadataMap.entries()),
        rawRowsCount: result.stats.rawRowsCount,
      });
    } catch (err: unknown) {
      console.error('DatasetController getSampleDataset error:', err);
      res.status(500).json({
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu mẫu từ server.',
      });
    }
  }

  /**
   * POST /api/dataset/preprocess
   */
  static preprocessUploadedData(req: Request, res: Response) {
    try {
      const { rows } = req.body;
      if (!rows || !Array.isArray(rows)) {
        res.status(400).json({ success: false, errorMessage: 'Dữ liệu hàng không hợp lệ.' });
        return;
      }

      const result = DatasetService.preprocessRawRows(rows);
      res.status(200).json({
        success: result.success,
        errorMessage: result.errorMessage,
        transactions: result.transactions,
        stats: result.stats,
        previewRows: result.previewRows,
        itemMetadata: Array.from(result.itemMetadataMap.entries()),
      });
    } catch (err: unknown) {
      console.error('DatasetController preprocessUploadedData error:', err);
      res.status(500).json({ success: false, errorMessage: 'Lỗi tiền xử lý dữ liệu.' });
    }
  }
}
