/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Itemset, MiningAlgorithm } from '../../shared/types';
import { mineRareItemsets } from '../../src/lib/algorithms';

export class MiningService {
  /**
   * Khai thác tập hiếm phía Backend
   * Hỗ trợ Branch-and-Bound, Apriori, FP-Growth
   */
  static executeMining(
    transactions: Transaction[],
    algorithm: MiningAlgorithm,
    maxSupportRatio: number,
    minSupportCount: number = 1,
    itemNamesEntries: [string, string][] = [],
    maxItemsetSize: number = 3
  ): { itemsets: Itemset[]; executionTime: number } {
    const itemNamesMap = new Map<string, string>(itemNamesEntries);
    return mineRareItemsets(
      transactions,
      algorithm,
      maxSupportRatio,
      minSupportCount,
      itemNamesMap,
      maxItemsetSize
    );
  }
}
