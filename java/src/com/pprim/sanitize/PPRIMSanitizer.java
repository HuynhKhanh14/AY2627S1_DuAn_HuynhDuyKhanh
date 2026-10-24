package com.pprim.sanitize;

import com.pprim.model.Itemset;
import com.pprim.model.Metrics;
import com.pprim.model.Transaction;

import java.util.*;

/**
 * Thuật toán Khử Mẫn Cảm Dữ Liệu Giao Dịch Bảo Toàn Quyền Riêng Tư (PPRIM Sanitization)
 * 100% PURE JAVA SE - Chuẩn Java SE, KHÔNG DÙNG BẤT KỲ THƯ VIỆN NGOÀI NÀO.
 *
 * Hỗ trợ 3 biến thể chọn phần tử loại bỏ (Victim Selection):
 * 1. Random Victim: Lựa chọn ngẫu nhiên đồng đều một phần tử trong tập nhạy cảm.
 * 2. Min-Cost Victim: Chọn phần tử có chi phí tác dụng phụ (Side Effect) nhỏ nhất tới các tập hiếm không nhạy cảm.
 * 3. Max-Coverage Victim: Chọn phần tử có tần số xuất hiện cao nhất trong các tập nhạy cảm còn lại để tối đa hóa số tập nhạy cảm bị che giấu cùng lúc.
 */
public class PPRIMSanitizer {

    public static class SanitizationResult {
        private final List<Transaction> sanitizedTransactions;
        private final Metrics metrics;
        private final Set<String> modifiedTransactionIds;
        private final int deletedItemsCount;

        public SanitizationResult(
            List<Transaction> sanitizedTransactions,
            Metrics metrics,
            Set<String> modifiedTransactionIds,
            int deletedItemsCount
        ) {
            this.sanitizedTransactions = sanitizedTransactions;
            this.metrics = metrics;
            this.modifiedTransactionIds = modifiedTransactionIds;
            this.deletedItemsCount = deletedItemsCount;
        }

        public List<Transaction> getSanitizedTransactions() {
            return sanitizedTransactions;
        }

        public Metrics getMetrics() {
            return metrics;
        }

        public Set<String> getModifiedTransactionIds() {
            return modifiedTransactionIds;
        }

        public int getDeletedItemsCount() {
            return deletedItemsCount;
        }
    }

    public static SanitizationResult sanitize(
        List<Transaction> originalTransactions,
        List<Itemset> sensitiveItemsets,
        List<Itemset> allRareItemsets,
        String variant,
        double maxSupportRatio
    ) {
        long startTime = System.nanoTime();

        // 1. Phân loại tập hiếm không nhạy cảm
        Set<String> sensitiveSignatures = new HashSet<>();
        for (Itemset s : sensitiveItemsets) {
            sensitiveSignatures.add(s.getSignature());
        }

        List<Itemset> nonSensitiveRareSets = new ArrayList<>();
        for (Itemset r : allRareItemsets) {
            if (!sensitiveSignatures.contains(r.getSignature())) {
                nonSensitiveRareSets.add(r);
            }
        }

        // 2. Tạo bản sao làm việc của các giao dịch
        Map<String, Set<String>> workingTx = new HashMap<>();
        for (Transaction tx : originalTransactions) {
            workingTx.put(tx.getId(), new HashSet<>(tx.getItems()));
        }

        Set<String> modifiedTxIds = new HashSet<>();
        int deletedItemsCount = 0;
        Random rng = new Random(42); // Seed cố định để kết quả có thể tái lập chính xác (deterministic)

        // 3. Tiến hành khử mẫn cảm từng tập nhạy cảm
        for (Itemset sens : sensitiveItemsets) {
            List<String> targetItems = sens.getItems();
            Set<String> targetSet = sens.getItemSet();

            // Tìm các giao dịch chứa tập này
            List<String> containingTxIds = new ArrayList<>();
            for (Map.Entry<String, Set<String>> entry : workingTx.entrySet()) {
                if (entry.getValue().containsAll(targetSet)) {
                    containingTxIds.add(entry.getKey());
                }
            }

            for (String txId : containingTxIds) {
                Set<String> currentItems = workingTx.get(txId);
                if (!currentItems.containsAll(targetSet)) {
                    continue; // Đã bị phá vỡ từ trước bởi việc xóa item của tập nhạy cảm khác
                }

                String victimItem;

                if ("random".equalsIgnoreCase(variant)) {
                    // Biến thể 1: Random Victim
                    int idx = rng.nextInt(targetItems.size());
                    victimItem = targetItems.get(idx);
                } else if ("min_cost".equalsIgnoreCase(variant)) {
                    // Biến thể 2: Min-Cost Victim
                    String bestItem = targetItems.get(0);
                    int minCost = Integer.MAX_VALUE;

                    for (String candidate : targetItems) {
                        int cost = 0;
                        for (Itemset ns : nonSensitiveRareSets) {
                            if (ns.getItemSet().contains(candidate) && currentItems.containsAll(ns.getItemSet())) {
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
                    // Biến thể 3: Max-Coverage Victim
                    String bestItem = targetItems.get(0);
                    int maxCoverage = -1;

                    for (String candidate : targetItems) {
                        int coverage = 0;
                        for (Itemset otherSens : sensitiveItemsets) {
                            if (otherSens.getItemSet().contains(candidate)) {
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

                // Thực hiện xóa victimItem khỏi giao dịch
                currentItems.remove(victimItem);
                modifiedTxIds.add(txId);
                deletedItemsCount++;
            }
        }

        // 4. Xây dựng danh sách giao dịch đã làm sạch
        List<Transaction> sanitizedList = new ArrayList<>();
        for (Transaction tx : originalTransactions) {
            sanitizedList.add(new Transaction(tx.getId(), workingTx.get(tx.getId())));
        }

        // 5. Tính toán chỉ số đánh giá
        // HF (Hiding Failure): Tỷ lệ các tập nhạy cảm còn sót lại
        int remainingSensitiveCount = 0;
        for (Itemset sens : sensitiveItemsets) {
            int count = 0;
            for (Transaction tx : sanitizedList) {
                if (tx.containsItemset(sens.getItemSet())) {
                    count++;
                }
            }
            if (count > 0) {
                remainingSensitiveCount++;
            }
        }
        double hf = sensitiveItemsets.isEmpty() ? 0.0 : ((double) remainingSensitiveCount / sensitiveItemsets.size()) * 100.0;

        // MC (Misses Cost): Số giao dịch bị sửa đổi
        int mc = modifiedTxIds.size();

        // SE (Side Effect): Số tập hiếm không nhạy cảm bị biến mất hoàn toàn
        int se = 0;
        for (Itemset ns : nonSensitiveRareSets) {
            int count = 0;
            for (Transaction tx : sanitizedList) {
                if (tx.containsItemset(ns.getItemSet())) {
                    count++;
                }
            }
            if (count == 0) {
                se++;
            }
        }

        long endTime = System.nanoTime();
        double runtimeSeconds = (endTime - startTime) / 1_000_000_000.0;

        Metrics metrics = new Metrics(
            variant,
            maxSupportRatio,
            Math.round(hf * 100.0) / 100.0,
            mc,
            se,
            Math.round(runtimeSeconds * 10000.0) / 10000.0,
            sensitiveItemsets.size(),
            sensitiveItemsets.size() - remainingSensitiveCount
        );

        return new SanitizationResult(sanitizedList, metrics, modifiedTxIds, deletedItemsCount);
    }
}
