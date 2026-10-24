package com.pprim.mining;

import com.pprim.model.Itemset;
import com.pprim.model.Transaction;

import java.util.*;

/**
 * Thuật toán Khai thác Tập Hiếm: Apriori
 * 100% PURE JAVA SE - Không dùng bất kỳ thư viện ngoài nào.
 *
 * Chiến lược:
 * 1. Khởi tạo tập ứng viên C_1.
 * 2. Lặp theo từng cấp độ k:
 *    - Tạo C_{k} từ L_{k-1} x L_{k-1} (Apriori Join Step).
 *    - Đếm support qua cơ sở dữ liệu.
 *    - Lọc các tập có support nằm trong khoảng [minSupportCount, maxSupportCount] -> Thu thập tập hiếm.
 */
public class AprioriMiner {

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

        List<Itemset> rareResults = new ArrayList<>();
        List<List<String>> currentFrequentOrViable = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : itemCounts.entrySet()) {
            int count = entry.getValue();
            if (count >= minSupportCount) {
                currentFrequentOrViable.add(Collections.singletonList(entry.getKey()));
                if (count <= maxSupportCount) {
                    rareResults.add(new Itemset(Collections.singletonList(entry.getKey()), count, (double) count / n));
                }
            }
        }

        int k = 2;
        while (k <= maxItemsetSize && !currentFrequentOrViable.isEmpty()) {
            List<List<String>> candidates = generateCandidates(currentFrequentOrViable, k);
            if (candidates.isEmpty()) break;

            List<List<String>> nextLevelViable = new ArrayList<>();

            for (List<String> cand : candidates) {
                Set<String> candSet = new HashSet<>(cand);
                int count = 0;
                for (Transaction tx : transactions) {
                    if (tx.containsItemset(candSet)) {
                        count++;
                    }
                }

                if (count >= minSupportCount) {
                    nextLevelViable.add(cand);
                    if (count <= maxSupportCount) {
                        rareResults.add(new Itemset(cand, count, (double) count / n));
                    }
                }
            }

            currentFrequentOrViable = nextLevelViable;
            k++;
        }

        Collections.sort(rareResults);
        return rareResults;
    }

    private static List<List<String>> generateCandidates(List<List<String>> prevItemsets, int targetSize) {
        List<List<String>> candidates = new ArrayList<>();
        int len = prevItemsets.size();

        for (int i = 0; i < len; i++) {
            List<String> setA = prevItemsets.get(i);
            for (int j = i + 1; j < len; j++) {
                List<String> setB = prevItemsets.get(j);

                // Kiểm tra (k-2) phần tử đầu tiên trùng nhau
                boolean prefixMatch = true;
                for (int m = 0; m < targetSize - 2; m++) {
                    if (!setA.get(m).equals(setB.get(m))) {
                        prefixMatch = false;
                        break;
                    }
                }

                if (prefixMatch) {
                    String lastA = setA.get(targetSize - 2);
                    String lastB = setB.get(targetSize - 2);
                    if (lastA.compareTo(lastB) < 0) {
                        List<String> newCand = new ArrayList<>(setA);
                        newCand.add(lastB);
                        candidates.add(newCand);
                    }
                }
            }
        }
        return candidates;
    }
}
