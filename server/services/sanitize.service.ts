/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Transaction,
  Itemset,
  SanitizeVariant,
  SanitizationResult,
  ExperimentMetrics,
} from '../../shared/types';
import { sanitizeDatabase } from '../../src/lib/algorithms';

export class SanitizeService {
  /**
   * Khử mẫn cảm cơ sở dữ liệu giao dịch theo biến thể (Random, Min-Cost, Max-Coverage)
   */
  static executeSanitization(
    originalTransactions: Transaction[],
    sensitiveItemsets: Itemset[],
    allRareItemsets: Itemset[],
    variant: SanitizeVariant,
    maxSupportRatio: number
  ): SanitizationResult {
    return sanitizeDatabase(
      originalTransactions,
      sensitiveItemsets,
      allRareItemsets,
      variant,
      maxSupportRatio
    );
  }

  /**
   * Chạy benchmark đồng thời 3 biến thể
   */
  static executeBenchmark(
    originalTransactions: Transaction[],
    sensitiveItemsets: Itemset[],
    allRareItemsets: Itemset[],
    maxSupportRatio: number
  ): ExperimentMetrics[] {
    const variants: SanitizeVariant[] = ['random', 'min_cost', 'max_coverage'];
    const results: ExperimentMetrics[] = [];

    for (const v of variants) {
      const res = sanitizeDatabase(
        originalTransactions,
        sensitiveItemsets,
        allRareItemsets,
        v,
        maxSupportRatio
      );
      results.push(res.metrics);
    }

    return results;
  }
}
