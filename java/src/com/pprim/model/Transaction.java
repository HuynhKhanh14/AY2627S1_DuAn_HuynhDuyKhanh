package com.pprim.model;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Lớp đại diện cho một giao dịch (Transaction) trong cơ sở dữ liệu.
 * HOÀN TOÀN KHÔNG DÙNG THƯ VIỆN NGOÀI (Chỉ dùng chuẩn Java SE java.util.*)
 */
public class Transaction {
    private final String id;
    private final Set<String> items;

    public Transaction(String id, List<String> itemsList) {
        this.id = id;
        this.items = new HashSet<>(itemsList);
    }

    public Transaction(String id, Set<String> itemsSet) {
        this.id = id;
        this.items = new HashSet<>(itemsSet);
    }

    public String getId() {
        return id;
    }

    public Set<String> getItems() {
        return Collections.unmodifiableSet(items);
    }

    public boolean containsItemset(Set<String> itemset) {
        return items.containsAll(itemset);
    }

    public boolean containsItem(String item) {
        return items.contains(item);
    }

    public void removeItem(String item) {
        items.remove(item);
    }

    public Transaction copy() {
        return new Transaction(this.id, new HashSet<>(this.items));
    }
}
