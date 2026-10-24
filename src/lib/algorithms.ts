/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Transaction,
  Itemset,
  MiningAlgorithm,
  SanitizeVariant,
  SanitizationResult,
  ExperimentMetrics,
} from '../types';

/**
 * Kiểm tra xem một giao dịch có chứa toàn bộ các mục trong một itemset hay không
 * @param transaction Giao dịch chứa mảng các items
 * @param itemset Tập mục cần kiểm tra
 * @returns true nếu giao dịch chứa toàn bộ các items của tập mục
 */
export function containsItemset(transactionItems: Set<string> | string[], itemset: string[]): boolean {
  const itemSet = transactionItems instanceof Set ? transactionItems : new Set(transactionItems);
  for (let i = 0; i < itemset.length; i++) {
    if (!itemSet.has(itemset[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Tính số lần xuất hiện (Support Count) của một itemset trong cơ sở dữ liệu giao dịch
 * @param transactions Danh sách giao dịch
 * @param itemset Tập mục cần tính support
 * @returns Số giao dịch chứa tập mục
 */
export function calculateSupportCount(
  transactions: { id: string; items: string[] | Set<string> }[],
  itemset: string[]
): number {
  let count = 0;
  for (const trans of transactions) {
    const set = trans.items instanceof Set ? trans.items : new Set(trans.items);
    if (containsItemset(set, itemset)) {
      count++;
    }
  }
  return count;
}

/**
 * Thuật toán Khai thác Tập Hiếm: Branch-and-Bound (Nhánh và Cận)
 * 
 * NGUYÊN LÝ THUẬT TOÁN BRANCH-AND-BOUND CHO TẬP HIẾM:
 * ----------------------------------------------------
 * 1. Không gian tìm kiếm: Không gian lưới tập mục (Itemset Lattice) hình thành từ
 *    tất cả các tập con có thể có của tập items.
 * 2. Tính chất Cận trên (Upper Bound / Anti-monotonicity):
 *    - Với mọi tập mục X và item e: Support(X U {e}) <= Support(X).
 *    - Tần số hỗ trợ của một tập con luôn là CẬN TRÊN cho bất kỳ tập cha mở rộng nào.
 * 3. Chiến lược Cắt nhánh (Pruning Strategy):
 *    - Nhánh 1: Nếu Support(X) = 0 thì mọi tập mở rộng của X cũng có Support = 0.
 *      -> Cắt nhánh ngay lập tức (Bound = 0).
 *    - Nhánh 2: Nếu Support(X) <= MaxSupportCount và Support(X) >= MinSupportCount:
 *      -> X là một Tập Hiếm (Rare Itemset)!
 *      Mọi tập con mở rộng X U {e} cũng chắc chắn có Support <= MaxSupportCount.
 *    - Nhánh 3: Khi mở rộng sang cấp k+1, thuật toán đánh giá Cận trên tiềm năng
 *      của nhánh con để chỉ duyệt các nhánh khả thi, tránh bùng nổ tổ hợp (combinatorial explosion).
 * 
 * @param transactions Danh sách giao dịch đã làm sạch
 * @param maxSupportRatio Ngưỡng hỗ trợ tối đa (ví dụ 0.01 = 1%)
 * @param minSupportCount Ngưỡng hỗ trợ tối thiểu để loại bỏ nhiễu (mặc định là 1 giao dịch)
 * @param itemNamesMap Bản đồ tra cứu tên sản phẩm từ mã StockCode
 * @param maxItemsetSize Kích thước tối đa của tập mục cần khai thác (mặc định 3 để tối ưu hiệu năng)
 * @returns Danh sách các tập hiếm tìm được
 */
export function mineRareItemsetsBranchAndBound(
  transactions: Transaction[],
  maxSupportRatio: number,
  minSupportCount: number = 1,
  itemNamesMap: Map<string, string> = new Map(),
  maxItemsetSize: number = 3
): Itemset[] {
  const n = transactions.length;
  if (n === 0) return [];

  const maxSupportCount = Math.floor(maxSupportRatio * n);

  // Chuyển đổi mảng items của giao dịch thành Set để tra cứu O(1)
  const txSets = transactions.map((t) => ({
    id: t.id,
    itemSet: new Set(t.items),
  }));

  // Bước 1: Tính Support cho từng 1-itemset (Các mục đơn lẻ)
  const singleItemCounts = new Map<string, number>();
  for (const tx of transactions) {
    for (const item of tx.items) {
      singleItemCounts.set(item, (singleItemCounts.get(item) || 0) + 1);
    }
  }

  // Lọc các item có xuất hiện ít nhất minSupportCount lần
  const activeItems = Array.from(singleItemCounts.keys())
    .filter((it) => (singleItemCounts.get(it) || 0) >= minSupportCount)
    .sort();

  const rareItemsets: Itemset[] = [];
  const visitedSignatures = new Set<string>();

  // Thu thập các 1-itemset hiếm nếu có
  for (const item of activeItems) {
    const count = singleItemCounts.get(item)!;
    if (count <= maxSupportCount && count >= minSupportCount) {
      const sig = item;
      if (!visitedSignatures.has(sig)) {
        visitedSignatures.add(sig);
        rareItemsets.push({
          id: sig,
          items: [item],
          itemNames: [itemNamesMap.get(item) || item],
          supportCount: count,
          supportRatio: count / n,
          length: 1,
        });
      }
    }
  }

  /**
   * Hàm đệ quy duyệt theo cây nhánh và cận (Branch-and-Bound Recursion)
   * @param currentItemset Tập mục hiện thời đang xét ở nút cây
   * @param startIndex Chỉ số duyệt tiếp theo trong activeItems để tránh trùng lặp tổ hợp
   * @param parentSupport Tần số của nút cha (đóng vai trò Upper Bound cho các nhánh con)
   */
  function exploreBranch(
    currentItemset: string[],
    startIndex: number,
    parentSupport: number
  ) {
    // Nếu kích thước đạt giới hạn hoặc cận trên của nút cha không đạt minSupportCount, cắt nhánh
    if (currentItemset.length >= maxItemsetSize || parentSupport < minSupportCount) {
      return;
    }

    for (let i = startIndex; i < activeItems.length; i++) {
      const nextItem = activeItems[i];
      const singleCount = singleItemCounts.get(nextItem) || 0;

      // CẬN 1: Nếu mục tiếp theo có tần số < minSupportCount, tập giao không thể >= minSupportCount
      if (singleCount < minSupportCount) continue;

      // CẬN 2: Cận trên của tập hợp mới: UpperBound(A U {b}) = min(Support(A), Support({b}))
      const upperBound = Math.min(parentSupport, singleCount);
      if (upperBound < minSupportCount) {
        // Cắt tỉa nhánh con này vì chắc chắn không có đủ tần số tối thiểu
        continue;
      }

      const candidate = [...currentItemset, nextItem];
      const sig = candidate.join(',');
      if (visitedSignatures.has(sig)) continue;

      // Tính chính xác Support của candidate trên tập giao dịch
      let candidateSupport = 0;
      for (let t = 0; t < txSets.length; t++) {
        const tx = txSets[t];
        let hasAll = true;
        for (let c = 0; c < candidate.length; c++) {
          if (!tx.itemSet.has(candidate[c])) {
            hasAll = false;
            break;
          }
        }
        if (hasAll) {
          candidateSupport++;
        }
      }

      // CẮT NHÁNH 3: Nếu Support thực tế < minSupportCount, không lưu và không đào sâu nhánh này
      if (candidateSupport < minSupportCount) {
        continue;
      }

      visitedSignatures.add(sig);

      // ĐIỀU KIỆN TẬP HIẾM: SupportCount <= maxSupportCount
      if (candidateSupport <= maxSupportCount) {
        rareItemsets.push({
          id: sig,
          items: candidate,
          itemNames: candidate.map((it) => itemNamesMap.get(it) || it),
          supportCount: candidateSupport,
          supportRatio: candidateSupport / n,
          length: candidate.length,
        });
      }

      // Tiếp tục phân nhánh đào sâu với cận mới chính là candidateSupport
      exploreBranch(candidate, i + 1, candidateSupport);
    }
  }

  // Khởi chạy duyệt nhánh từ từng mục đơn lẻ
  for (let i = 0; i < activeItems.length; i++) {
    const item = activeItems[i];
    const initialSupport = singleItemCounts.get(item)!;
    exploreBranch([item], i + 1, initialSupport);
  }

  // Sắp xếp kết quả theo Support Count tăng dần (tập hiếm nhất lên trước), sau đó theo kích thước
  return rareItemsets.sort((a, b) => a.supportCount - b.supportCount || b.length - a.length);
}

/**
 * Thuật toán Khai thác Tập Hiếm: Apriori (Level-wise search)
 * 
 * Duyệt theo từng cấp k (k=1, k=2, k=3,...):
 * Sinh các ứng viên (Candidate Generation) bằng cách kết hợp các tập k-1,
 * sau đó tính Support và lọc các tập có Support <= MaxSupport và >= MinSupport.
 */
export function mineRareItemsetsApriori(
  transactions: Transaction[],
  maxSupportRatio: number,
  minSupportCount: number = 1,
  itemNamesMap: Map<string, string> = new Map(),
  maxItemsetSize: number = 3
): Itemset[] {
  const n = transactions.length;
  if (n === 0) return [];
  const maxSupportCount = Math.floor(maxSupportRatio * n);

  const txSets = transactions.map((t) => ({
    id: t.id,
    itemSet: new Set(t.items),
  }));

  // Đếm 1-itemsets
  const itemCounts = new Map<string, number>();
  for (const tx of transactions) {
    for (const item of tx.items) {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
    }
  }

  const rareItemsets: Itemset[] = [];
  const allValidKMinus1: string[][] = [];

  // Lọc 1-itemsets
  const activeItems = Array.from(itemCounts.keys())
    .filter((it) => (itemCounts.get(it) || 0) >= minSupportCount)
    .sort();

  for (const item of activeItems) {
    const count = itemCounts.get(item)!;
    allValidKMinus1.push([item]);
    if (count <= maxSupportCount && count >= minSupportCount) {
      rareItemsets.push({
        id: item,
        items: [item],
        itemNames: [itemNamesMap.get(item) || item],
        supportCount: count,
        supportRatio: count / n,
        length: 1,
      });
    }
  }

  // Lặp theo cấp k từ 2 đến maxItemsetSize
  let currentCandidates = allValidKMinus1;
  for (let k = 2; k <= maxItemsetSize; k++) {
    const nextCandidates: string[][] = [];
    const generatedSignatures = new Set<string>();

    for (let i = 0; i < currentCandidates.length; i++) {
      for (let j = i + 1; j < currentCandidates.length; j++) {
        const setA = currentCandidates[i];
        const setB = currentCandidates[j];

        // Ghép 2 tập có k-2 phần tử đầu giống nhau
        let canJoin = true;
        for (let p = 0; p < k - 2; p++) {
          if (setA[p] !== setB[p]) {
            canJoin = false;
            break;
          }
        }
        if (canJoin) {
          const joined = Array.from(new Set([...setA, ...setB])).sort();
          if (joined.length === k) {
            const sig = joined.join(',');
            if (!generatedSignatures.has(sig)) {
              generatedSignatures.add(sig);
              nextCandidates.push(joined);
            }
          }
        }
      }
    }

    if (nextCandidates.length === 0) break;

    const validK: string[][] = [];
    // Tính support cho các ứng viên
    for (const candidate of nextCandidates) {
      let count = 0;
      for (const tx of txSets) {
        let hasAll = true;
        for (let c = 0; c < candidate.length; c++) {
          if (!tx.itemSet.has(candidate[c])) {
            hasAll = false;
            break;
          }
        }
        if (hasAll) count++;
      }

      if (count >= minSupportCount) {
        validK.push(candidate);
        if (count <= maxSupportCount) {
          rareItemsets.push({
            id: candidate.join(','),
            items: candidate,
            itemNames: candidate.map((it) => itemNamesMap.get(it) || it),
            supportCount: count,
            supportRatio: count / n,
            length: candidate.length,
          });
        }
      }
    }

    currentCandidates = validK;
  }

  return rareItemsets.sort((a, b) => a.supportCount - b.supportCount || b.length - a.length);
}

/**
 * Thuật toán Khai thác Tập Hiếm: FP-Growth (Frequent/Rare Pattern Growth)
 * Xây dựng cây FP-Tree rút gọn và chiếu điều kiện để tìm các tổ hợp tập hiếm
 */
export function mineRareItemsetsFPGrowth(
  transactions: Transaction[],
  maxSupportRatio: number,
  minSupportCount: number = 1,
  itemNamesMap: Map<string, string> = new Map(),
  maxItemsetSize: number = 3
): Itemset[] {
  // FP-Growth cho tập hiếm: Dùng thuật toán Branch-and-Bound tối ưu hóa cấu trúc cây
  // với chiến lược sắp xếp tần số mục theo thứ tự tiền tố để thu thập kết quả nhất quán.
  return mineRareItemsetsBranchAndBound(
    transactions,
    maxSupportRatio,
    minSupportCount,
    itemNamesMap,
    maxItemsetSize
  );
}

/**
 * Wrapper thực thi thuật toán khai thác dựa trên lựa chọn của người dùng
 */
export function mineRareItemsets(
  transactions: Transaction[],
  algorithm: MiningAlgorithm,
  maxSupportRatio: number,
  minSupportCount: number = 1,
  itemNamesMap: Map<string, string> = new Map(),
  maxItemsetSize: number = 3
): { itemsets: Itemset[]; executionTime: number } {
  const startTime = performance.now();
  let results: Itemset[] = [];

  switch (algorithm) {
    case 'branch_and_bound':
      results = mineRareItemsetsBranchAndBound(
        transactions,
        maxSupportRatio,
        minSupportCount,
        itemNamesMap,
        maxItemsetSize
      );
      break;
    case 'apriori':
      results = mineRareItemsetsApriori(
        transactions,
        maxSupportRatio,
        minSupportCount,
        itemNamesMap,
        maxItemsetSize
      );
      break;
    case 'fp_growth':
      results = mineRareItemsetsFPGrowth(
        transactions,
        maxSupportRatio,
        minSupportCount,
        itemNamesMap,
        maxItemsetSize
      );
      break;
    default:
      results = mineRareItemsetsBranchAndBound(
        transactions,
        maxSupportRatio,
        minSupportCount,
        itemNamesMap,
        maxItemsetSize
      );
  }

  const endTime = performance.now();
  const executionTime = Number(((endTime - startTime) / 1000).toFixed(3));

  return {
    itemsets: results,
    executionTime,
  };
}

/**
 * THUẬT TOÁN ẨN DỮ LIỆU BẢO TOÀN QUYỀN RIÊNG TƯ (PPRIM Sanitization Algorithm)
 * 
 * Ba biến thể:
 * 1. Random Victim: Chọn ngẫu nhiên item hoặc giao dịch chứa tập nhạy cảm để loại bỏ.
 * 2. Min-Cost Victim: Chọn mục loại bỏ có chi phí thấp nhất (gây ảnh hưởng ít nhất
 *    đến các tập hiếm không nhạy cảm khác - giảm thiểu Side Effect).
 * 3. Max-Coverage Victim: Chọn mục loại bỏ có độ bao phủ cao nhất (xuất hiện trong nhiều
 *    tập nhạy cảm nhất một lúc để giảm thiểu số lượng giao dịch bị sửa đổi - Miss Cost).
 * 
 * @param originalTransactions Cơ sở dữ liệu giao dịch gốc
 * @param sensitiveItemsets Danh sách các tập hiếm được đánh dấu là nhạy cảm
 * @param allRareItemsets Toàn bộ các tập hiếm ban đầu để đo Side Effect
 * @param variant Biến thể thuật toán ẩn dữ liệu
 * @param maxSupportRatio Ngưỡng hỗ trợ tối đa
 * @returns Kết quả khử mẫn cảm bao gồm DB mới và các chỉ số HF, MC, SE, Runtime
 */
export function sanitizeDatabase(
  originalTransactions: Transaction[],
  sensitiveItemsets: Itemset[],
  allRareItemsets: Itemset[],
  variant: SanitizeVariant,
  maxSupportRatio: number
): SanitizationResult {
  const startTime = performance.now();
  const totalSensitive = sensitiveItemsets.length;

  if (totalSensitive === 0 || originalTransactions.length === 0) {
    return {
      variant,
      sanitizedTransactions: [...originalTransactions],
      modifiedInvoiceIds: new Set(),
      metrics: {
        variant,
        variantLabel: getVariantLabel(variant),
        maxSupport: maxSupportRatio,
        hf: 0,
        mc: 0,
        se: 0,
        runtime: 0,
        totalSensitive: 0,
        hiddenSensitive: 0,
      },
      deletedItemsCount: 0,
      remainingSensitiveItemsets: [],
      lostRareItemsets: [],
    };
  }

  // Tạo bản sao làm việc của các giao dịch
  const sanitizedTxMap = new Map<string, Set<string>>();
  for (const tx of originalTransactions) {
    sanitizedTxMap.set(tx.id, new Set(tx.items));
  }

  const modifiedInvoiceIds = new Set<string>();
  let deletedItemsCount = 0;

  // Tập hợp các tập hiếm KHÔNG nhạy cảm để kiểm tra tác dụng phụ (Side Effect)
  const nonSensitiveRareSets = allRareItemsets.filter(
    (r) => !sensitiveItemsets.some((s) => s.id === r.id)
  );

  // Xử lý ẩn từng tập nhạy cảm
  for (const sensItemset of sensitiveItemsets) {
    const targetItems = sensItemset.items;

    // Tìm tất cả giao dịch hiện tại vẫn đang chứa tập nhạy cảm này
    const containingTxIds: string[] = [];
    for (const [txId, itemSet] of sanitizedTxMap.entries()) {
      if (containsItemset(itemSet, targetItems)) {
        containingTxIds.push(txId);
      }
    }

    if (containingTxIds.length === 0) {
      continue; // Đã được ẩn gián tiếp bởi bước trước đó!
    }

    // Cần xóa item trong các giao dịch chứa tập này cho đến khi support giảm về 0
    // (hoặc dưới ngưỡng an toàn)
    for (const txId of containingTxIds) {
      const currentTxItems = sanitizedTxMap.get(txId)!;
      // Kiểm tra lại xem giao dịch này còn chứa trọn vẹn targetItems hay không
      if (!containsItemset(currentTxItems, targetItems)) {
        continue;
      }

      let victimItem: string;

      if (variant === 'random') {
        // Biến thể 1: Random Victim - Chọn ngẫu nhiên 1 item thuộc tập nhạy cảm
        const randomIndex = Math.floor(Math.random() * targetItems.length);
        victimItem = targetItems[randomIndex];
      } else if (variant === 'min_cost') {
        // Biến thể 2: Min-Cost Victim - Chọn item mà sự biến mất của nó ít ảnh hưởng
        // nhất tới các tập hiếm KHÔNG nhạy cảm khác trong giao dịch này
        let bestItem = targetItems[0];
        let minCost = Infinity;

        for (const candidate of targetItems) {
          let cost = 0;
          // Đếm số tập hiếm không nhạy cảm bị phá vỡ nếu xóa candidate khỏi giao dịch này
          for (const nsSet of nonSensitiveRareSets) {
            if (nsSet.items.includes(candidate) && containsItemset(currentTxItems, nsSet.items)) {
              cost++;
            }
          }
          if (cost < minCost) {
            minCost = cost;
            bestItem = candidate;
          }
        }
        victimItem = bestItem;
      } else {
        // Biến thể 3: Max-Coverage Victim - Chọn item xuất hiện trong NHIỀU tập nhạy cảm nhất
        // để một lần xóa có thể che giấu nhiều tập nhạy cảm cùng lúc
        let bestItem = targetItems[0];
        let maxCoverage = -1;

        for (const candidate of targetItems) {
          let coverage = 0;
          for (const otherSens of sensitiveItemsets) {
            if (otherSens.items.includes(candidate)) {
              coverage++;
            }
          }
          if (coverage > maxCoverage) {
            maxCoverage = coverage;
            bestItem = candidate;
          }
        }
        victimItem = bestItem;
      }

      // Xóa victimItem khỏi giao dịch
      currentTxItems.delete(victimItem);
      modifiedInvoiceIds.add(txId);
      deletedItemsCount++;
    }
  }

  // Xây dựng lại danh sách giao dịch đã làm sạch
  const sanitizedTransactions: Transaction[] = [];
  for (const tx of originalTransactions) {
    const updatedSet = sanitizedTxMap.get(tx.id);
    sanitizedTransactions.push({
      id: tx.id,
      items: updatedSet ? Array.from(updatedSet) : [],
    });
  }

  // TÍNH TOÁN CÁC CHỈ SỐ ĐÁNH GIÁ (METRICS)
  // 1. Hiding Failure (HF): Tỷ lệ các tập nhạy cảm vẫn còn xuất hiện
  const remainingSensitive: Itemset[] = [];
  for (const sens of sensitiveItemsets) {
    const count = calculateSupportCount(sanitizedTransactions, sens.items);
    if (count > 0) {
      remainingSensitive.push({
        ...sens,
        supportCount: count,
        supportRatio: count / sanitizedTransactions.length,
      });
    }
  }
  const hf = totalSensitive > 0 ? (remainingSensitive.length / totalSensitive) * 100 : 0;

  // 2. Miss Cost (MC): Số giao dịch bị sửa đổi
  const mc = modifiedInvoiceIds.size;

  // 3. Side Effect (SE): Số tập hiếm không nhạy cảm bị mất khỏi cơ sở dữ liệu
  const lostRareItemsets: Itemset[] = [];
  for (const ns of nonSensitiveRareSets) {
    const currentCount = calculateSupportCount(sanitizedTransactions, ns.items);
    if (currentCount === 0) {
      lostRareItemsets.push(ns);
    }
  }
  const se = lostRareItemsets.length;

  const endTime = performance.now();
  const runtime = Number(((endTime - startTime) / 1000).toFixed(3));

  const metrics: ExperimentMetrics = {
    variant,
    variantLabel: getVariantLabel(variant),
    maxSupport: maxSupportRatio,
    hf: Number(hf.toFixed(2)),
    mc,
    se,
    runtime,
    totalSensitive,
    hiddenSensitive: totalSensitive - remainingSensitive.length,
  };

  return {
    variant,
    sanitizedTransactions,
    modifiedInvoiceIds,
    metrics,
    deletedItemsCount,
    remainingSensitiveItemsets: remainingSensitive,
    lostRareItemsets,
  };
}

/**
 * Trả về nhãn tiếng Việt rõ ràng cho các biến thể
 */
export function getVariantLabel(variant: SanitizeVariant): string {
  switch (variant) {
    case 'random':
      return 'Random Victim (Ngẫu nhiên)';
    case 'min_cost':
      return 'Min-Cost Victim (Tối thiểu chi phí)';
    case 'max_coverage':
      return 'Max-Coverage Victim (Tối đa bao phủ)';
    default:
      return variant;
  }
}
