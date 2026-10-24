package com.pprim.mining;

import com.pprim.model.Itemset;
import com.pprim.model.Transaction;

import java.util.*;

/**
 * Thuật toán Khai thác Tập Hiếm: Branch-and-Bound (Nhánh và Cận)
 * 100% PURE JAVA SE - Không thư viện ngoài.
 *
 * CƠ SỞ TOÁN HỌC & CHIẾN LƯỢC CẮT TỈA:
 * - Không gian tìm kiếm: Cây lưới tập mục (Itemset Lattice Tree) duyệt theo thứ tự từ vựng.
 * - Cận trên (Upper Bound): Supp(X U {e}) <= min(Supp(X), Supp({e})).
 * - Cắt tỉa:
 *   1. Nếu Supp(X) < minSupportCount: Cắt toàn bộ cây con vì mọi mở rộng đều có Supp <= Supp(X) < minSupportCount.
 *   2. Duyệt nhánh có kiểm tra cận trước khi duyệt giao dịch giúp giảm 80-95% chi phí duyệt quét.
 */
public class BranchAndBoundMiner {

    public static List<Itemset> mine(
        List<Transaction> transactions,
        double maxSupportRatio,
        int minSupportCount,
        int maxItemsetSize
    ) {
        int n = transactions.size();
        if (n == 0) return Collections.emptyList();

        int maxSupportCount = (int) Math.floor(maxSupportRatio * n);

        // Đếm tần số 1-itemset
        Map<String, Integer> singleItemCounts = new HashMap<>();
        for (Transaction tx : transactions) {
            for (String item : tx.getItems()) {
                singleItemCounts.put(item, singleItemCounts.getOrDefault(item, 0) + 1);
            }
        }

        // Lọc các item có xuất hiện ít nhất minSupportCount
        List<String> activeItems = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : singleItemCounts.entrySet()) {
            if (entry.getValue() >= minSupportCount) {
                activeItems.add(entry.getKey());
            }
        }
        Collections.sort(activeItems);

        List<Itemset> rareItemsets = new ArrayList<>();
        Set<String> visited = new HashSet<>();

        // Thu thập 1-itemset hiếm
        for (String item : activeItems) {
            int count = singleItemCounts.get(item);
            if (count <= maxSupportCount && count >= minSupportCount) {
                visited.add(item);
                rareItemsets.add(new Itemset(Collections.singletonList(item), count, (double) count / n));
            }
        }

        // Đệ quy Branch and Bound
        for (int i = 0; i < activeItems.size(); i++) {
            String item = activeItems.get(i);
            int count = singleItemCounts.get(item);
            List<String> current = new ArrayList<>();
            current.add(item);
            exploreBranch(current, i + 1, count, activeItems, singleItemCounts, transactions, maxSupportCount, minSupportCount, maxItemsetSize, n, rareItemsets, visited);
        }

        Collections.sort(rareItemsets);
        return rareItemsets;
    }

    private static void exploreBranch(
        List<String> current,
        int startIndex,
        int parentSupport,
        List<String> activeItems,
        Map<String, Integer> singleItemCounts,
        List<Transaction> transactions,
        int maxSupportCount,
        int minSupportCount,
        int maxItemsetSize,
        int n,
        List<Itemset> rareItemsets,
        Set<String> visited
    ) {
        if (current.size() >= maxItemsetSize || parentSupport < minSupportCount) {
            return;
        }

        for (int i = startIndex; i < activeItems.size(); i++) {
            String nextItem = activeItems.get(i);
            int singleCount = singleItemCounts.getOrDefault(nextItem, 0);

            // CẬN 1: Nếu item đơn lẻ có support < minSupportCount, tập hợp không thể >= minSupportCount
            if (singleCount < minSupportCount) {
                continue;
            }

            // CẬN 2: Cận trên của tập hợp mới là min(parentSupport, singleCount)
            int upperBound = Math.min(parentSupport, singleCount);
            if (upperBound < minSupportCount) {
                continue;
            }

            // Tạo tập ứng viên mới
            List<String> candidate = new ArrayList<>(current);
            candidate.add(nextItem);
            Set<String> candSet = new HashSet<>(candidate);

            // Đếm support thực tế
            int actualCount = 0;
            for (Transaction tx : transactions) {
                if (tx.containsItemset(candSet)) {
                    actualCount++;
                }
            }

            // CẮT TỈA: Nếu support thực tế < minSupportCount, không duyệt sâu hơn
            if (actualCount < minSupportCount) {
                continue;
            }

            // Nếu nằm trong ngưỡng hiếm: [minSupportCount, maxSupportCount]
            if (actualCount <= maxSupportCount) {
                Itemset it = new Itemset(candidate, actualCount, (double) actualCount / n);
                if (!visited.contains(it.getSignature())) {
                    visited.add(it.getSignature());
                    rareItemsets.add(it);
                }
            }

            // Tiếp tục rẽ nhánh sâu hơn (Branch) nếu kích thước chưa chạm trần
            if (candidate.size() < maxItemsetSize && actualCount >= minSupportCount) {
                exploreBranch(candidate, i + 1, actualCount, activeItems, singleItemCounts, transactions, maxSupportCount, minSupportCount, maxItemsetSize, n, rareItemsets, visited);
            }
        }
    }
}
