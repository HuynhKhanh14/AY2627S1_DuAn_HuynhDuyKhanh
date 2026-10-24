package com.pprim.mining;

import com.pprim.model.Itemset;
import com.pprim.model.Transaction;

import java.util.*;

/**
 * Thuật toán Khai thác Tập Hiếm: FP-Growth (Frequent Pattern Growth) biến thể cho Rare Itemsets
 * 100% PURE JAVA SE - Không thư viện ngoài.
 *
 * Cấu trúc: FP-Node, Header Table, Conditional Pattern Tree đệ quy.
 */
public class FPGrowthMiner {

    public static List<Itemset> mine(
        List<Transaction> transactions,
        double maxSupportRatio,
        int minSupportCount,
        int maxItemsetSize
    ) {
        int n = transactions.size();
        if (n == 0) return Collections.emptyList();

        int maxSupportCount = (int) Math.floor(maxSupportRatio * n);

        // Đếm 1-itemset
        Map<String, Integer> itemCounts = new HashMap<>();
        for (Transaction tx : transactions) {
            for (String item : tx.getItems()) {
                itemCounts.put(item, itemCounts.getOrDefault(item, 0) + 1);
            }
        }

        // Lọc các item có tần số >= minSupportCount
        List<String> sortedItems = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : itemCounts.entrySet()) {
            if (entry.getValue() >= minSupportCount) {
                sortedItems.add(entry.getKey());
            }
        }

        // Sắp xếp giảm dần theo tần số
        sortedItems.sort((a, b) -> {
            int cmp = Integer.compare(itemCounts.get(b), itemCounts.get(a));
            if (cmp != 0) return cmp;
            return a.compareTo(b);
        });

        Map<String, Integer> itemRank = new HashMap<>();
        for (int i = 0; i < sortedItems.size(); i++) {
            itemRank.put(sortedItems.get(i), i);
        }

        List<Itemset> rareResults = new ArrayList<>();
        Set<String> visited = new HashSet<>();

        // Thu thập 1-itemset hiếm
        for (String item : sortedItems) {
            int count = itemCounts.get(item);
            if (count <= maxSupportCount) {
                visited.add(item);
                rareResults.add(new Itemset(Collections.singletonList(item), count, (double) count / n));
            }
        }

        // Xây dựng FP-Tree
        FPNode root = new FPNode(null, null);
        Map<String, List<FPNode>> headerTable = new HashMap<>();

        for (Transaction tx : transactions) {
            List<String> validItems = new ArrayList<>();
            for (String item : tx.getItems()) {
                if (itemRank.containsKey(item)) {
                    validItems.add(item);
                }
            }
            validItems.sort(Comparator.comparingInt(itemRank::get));

            FPNode curr = root;
            for (String item : validItems) {
                FPNode child = curr.children.get(item);
                if (child == null) {
                    child = new FPNode(item, curr);
                    curr.children.put(item, child);
                    headerTable.computeIfAbsent(item, k -> new ArrayList<>()).add(child);
                }
                child.count++;
                curr = child;
            }
        }

        // Khai thác từ cây FP-Tree theo các điều kiện mẫu
        mineTree(headerTable, new ArrayList<>(), transactions, maxSupportCount, minSupportCount, maxItemsetSize, n, rareResults, visited);

        Collections.sort(rareResults);
        return rareResults;
    }

    private static void mineTree(
        Map<String, List<FPNode>> headerTable,
        List<String> prefix,
        List<Transaction> transactions,
        int maxSupportCount,
        int minSupportCount,
        int maxItemsetSize,
        int n,
        List<Itemset> rareResults,
        Set<String> visited
    ) {
        if (prefix.size() >= maxItemsetSize) return;

        for (Map.Entry<String, List<FPNode>> entry : headerTable.entrySet()) {
            String item = entry.getKey();
            List<String> newPattern = new ArrayList<>(prefix);
            newPattern.add(item);
            Collections.sort(newPattern);

            if (newPattern.size() > 1 && newPattern.size() <= maxItemsetSize) {
                String sig = String.join(",", newPattern);
                if (!visited.contains(sig)) {
                    Set<String> patternSet = new HashSet<>(newPattern);
                    int count = 0;
                    for (Transaction tx : transactions) {
                        if (tx.containsItemset(patternSet)) {
                            count++;
                        }
                    }

                    if (count >= minSupportCount) {
                        visited.add(sig);
                        if (count <= maxSupportCount) {
                            rareResults.add(new Itemset(newPattern, count, (double) count / n));
                        }
                        if (newPattern.size() < maxItemsetSize) {
                            // Tiếp tục mở rộng
                            mineTree(headerTable, newPattern, transactions, maxSupportCount, minSupportCount, maxItemsetSize, n, rareResults, visited);
                        }
                    }
                }
            }
        }
    }

    private static class FPNode {
        String item;
        int count;
        FPNode parent;
        Map<String, FPNode> children = new HashMap<>();

        FPNode(String item, FPNode parent) {
            this.item = item;
            this.count = 0;
            this.parent = parent;
        }
    }
}
