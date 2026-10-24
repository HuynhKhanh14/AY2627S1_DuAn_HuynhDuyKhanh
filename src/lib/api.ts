/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Transaction,
  DatasetStats,
  RawDataRow,
  ItemMetadata,
  Itemset,
  MiningAlgorithm,
  SanitizeVariant,
  SanitizationResult,
  ExperimentMetrics,
} from '../types';
import { mineRareItemsets, sanitizeDatabase } from './algorithms';
import { parseCSVContent } from './dataProcessor';

/**
 * Tải dataset mẫu từ Backend API (hoặc fallback về local file nếu offline)
 */
export async function fetchSampleDataset(): Promise<{
  success: boolean;
  transactions: Transaction[];
  stats: DatasetStats;
  previewRows: RawDataRow[];
  itemMetadataMap: Map<string, ItemMetadata>;
  rawRows: RawDataRow[];
}> {
  try {
    const res = await fetch('/api/dataset/sample');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const itemMetadataMap = new Map<string, ItemMetadata>(data.itemMetadata || []);
        return {
          success: true,
          transactions: data.transactions,
          stats: data.stats,
          previewRows: data.previewRows,
          itemMetadataMap,
          rawRows: [],
        };
      }
    }
  } catch (err) {
    console.warn('Backend API /api/dataset/sample unavailable, using local fallback:', err);
  }

  // Fallback sang đọc file tĩnh public/data
  const response = await fetch('/data/online_retail_sample.csv');
  const csvText = await response.text();
  const result = await parseCSVContent(csvText);
  return {
    success: result.success,
    transactions: result.transactions,
    stats: result.stats,
    previewRows: result.previewRows,
    itemMetadataMap: result.itemMetadataMap,
    rawRows: result.rawRows,
  };
}

/**
 * Khai thác tập hiếm qua Backend API (với fallback local)
 */
export async function executeMiningAPI(
  transactions: Transaction[],
  algorithm: MiningAlgorithm,
  maxSupportRatio: number,
  minSupportCount: number = 1,
  itemNamesMap: Map<string, string> = new Map(),
  maxItemsetSize: number = 3
): Promise<{ itemsets: Itemset[]; executionTime: number }> {
  try {
    const res = await fetch('/api/mine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions,
        algorithm,
        maxSupportRatio,
        minSupportCount,
        itemNames: Array.from(itemNamesMap.entries()),
        maxItemsetSize,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          itemsets: data.itemsets,
          executionTime: data.executionTime,
        };
      }
    }
  } catch (err) {
    console.warn('Backend API /api/mine unavailable, executing locally in browser:', err);
  }

  // Fallback chạy trực tiếp trên client
  return mineRareItemsets(
    transactions,
    algorithm,
    maxSupportRatio,
    minSupportCount,
    itemNamesMap,
    maxItemsetSize
  );
}

/**
 * Thực thi thuật toán ẩn dữ liệu qua Backend API (với fallback local)
 */
export async function executeSanitizeAPI(
  originalTransactions: Transaction[],
  sensitiveItemsets: Itemset[],
  allRareItemsets: Itemset[],
  variant: SanitizeVariant,
  maxSupportRatio: number
): Promise<SanitizationResult> {
  try {
    const res = await fetch('/api/sanitize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalTransactions,
        sensitiveItemsets,
        allRareItemsets,
        variant,
        maxSupportRatio,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          variant: data.variant,
          sanitizedTransactions: data.sanitizedTransactions,
          modifiedInvoiceIds: new Set<string>(data.modifiedInvoiceIds || []),
          metrics: data.metrics,
          deletedItemsCount: data.deletedItemsCount,
          remainingSensitiveItemsets: [],
          lostRareItemsets: [],
        };
      }
    }
  } catch (err) {
    console.warn('Backend API /api/sanitize unavailable, executing locally in browser:', err);
  }

  // Fallback chạy trực tiếp trên client
  return sanitizeDatabase(
    originalTransactions,
    sensitiveItemsets,
    allRareItemsets,
    variant,
    maxSupportRatio
  );
}

/**
 * Chạy benchmark so sánh 3 biến thể qua Backend API (với fallback local)
 */
export async function executeBenchmarkAPI(
  originalTransactions: Transaction[],
  sensitiveItemsets: Itemset[],
  allRareItemsets: Itemset[],
  maxSupportRatio: number
): Promise<ExperimentMetrics[]> {
  try {
    const res = await fetch('/api/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalTransactions,
        sensitiveItemsets,
        allRareItemsets,
        maxSupportRatio,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.benchmarks)) {
        return data.benchmarks;
      }
    }
  } catch (err) {
    console.warn('Backend API /api/benchmark unavailable, executing locally:', err);
  }

  // Fallback
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
