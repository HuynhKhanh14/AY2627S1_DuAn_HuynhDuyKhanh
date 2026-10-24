/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { MiningService } from '../services/mining.service';
import { MiningAlgorithm } from '../../shared/types';

export class MiningController {
  /**
   * POST /api/mine
   */
  static runMining(req: Request, res: Response) {
    try {
      const {
        transactions,
        algorithm = 'branch_and_bound',
        maxSupportRatio = 0.01,
        minSupportCount = 1,
        itemNames = [],
        maxItemsetSize = 3,
      } = req.body;

      if (!transactions || !Array.isArray(transactions)) {
        res.status(400).json({ success: false, errorMessage: 'Danh sách giao dịch không hợp lệ.' });
        return;
      }

      const { itemsets, executionTime } = MiningService.executeMining(
        transactions,
        algorithm as MiningAlgorithm,
        parseFloat(maxSupportRatio),
        parseInt(minSupportCount, 10),
        itemNames,
        parseInt(maxItemsetSize, 10)
      );

      res.status(200).json({
        success: true,
        algorithm,
        itemsets,
        executionTime,
        totalFound: itemsets.length,
      });
    } catch (err: unknown) {
      console.error('MiningController runMining error:', err);
      res.status(500).json({ success: false, errorMessage: 'Lỗi trong quá trình khai thác tập hiếm.' });
    }
  }
}
