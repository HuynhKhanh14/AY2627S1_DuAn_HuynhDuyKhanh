/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { SanitizeService } from '../services/sanitize.service';
import { SanitizeVariant, Transaction, Itemset } from '../../shared/types';

export class SanitizeController {
  /**
   * POST /api/sanitize
   */
  static runSanitize(req: Request, res: Response) {
    try {
      const {
        originalTransactions,
        sensitiveItemsets,
        allRareItemsets,
        variant = 'min_cost',
        maxSupportRatio = 0.01,
      } = req.body;

      if (!originalTransactions || !sensitiveItemsets) {
        res.status(400).json({ success: false, errorMessage: 'Dữ liệu đầu vào không đầy đủ.' });
        return;
      }

      const result = SanitizeService.executeSanitization(
        originalTransactions as Transaction[],
        sensitiveItemsets as Itemset[],
        allRareItemsets as Itemset[],
        variant as SanitizeVariant,
        parseFloat(maxSupportRatio)
      );

      res.status(200).json({
        success: true,
        variant,
        metrics: result.metrics,
        modifiedInvoiceIds: Array.from(result.modifiedInvoiceIds),
        deletedItemsCount: result.deletedItemsCount,
        sanitizedTransactions: result.sanitizedTransactions,
      });
    } catch (err: unknown) {
      console.error('SanitizeController runSanitize error:', err);
      res.status(500).json({ success: false, errorMessage: 'Lỗi trong quá trình khử mẫn cảm.' });
    }
  }

  /**
   * POST /api/benchmark
   */
  static runBenchmark(req: Request, res: Response) {
    try {
      const { originalTransactions, sensitiveItemsets, allRareItemsets, maxSupportRatio = 0.01 } = req.body;

      if (!originalTransactions || !sensitiveItemsets) {
        res.status(400).json({ success: false, errorMessage: 'Dữ liệu đầu vào không đầy đủ.' });
        return;
      }

      const benchmarks = SanitizeService.executeBenchmark(
        originalTransactions as Transaction[],
        sensitiveItemsets as Itemset[],
        allRareItemsets as Itemset[],
        parseFloat(maxSupportRatio)
      );

      res.status(200).json({
        success: true,
        benchmarks,
      });
    } catch (err: unknown) {
      console.error('SanitizeController runBenchmark error:', err);
      res.status(500).json({ success: false, errorMessage: 'Lỗi trong quá trình benchmark.' });
    }
  }
}
