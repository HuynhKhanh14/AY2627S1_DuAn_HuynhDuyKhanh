package com.pprim.model;

import java.util.*;

/**
 * Lớp biểu diễn tập mục (Itemset) cùng các thông số Support.
 * Chuẩn Java SE - Không thư viện ngoài.
 */
public class Itemset implements Comparable<Itemset> {
    private final List<String> items;
    private final Set<String> itemSet;
    private int supportCount;
    private double supportRatio;

    public Itemset(Collection<String> items, int supportCount, double supportRatio) {
        List<String> sorted = new ArrayList<>(items);
        Collections.sort(sorted);
        this.items = Collections.unmodifiableList(sorted);
        this.itemSet = new HashSet<>(sorted);
        this.supportCount = supportCount;
        this.supportRatio = supportRatio;
    }

    public List<String> getItems() {
        return items;
    }

    public Set<String> getItemSet() {
        return itemSet;
    }

    public int getSupportCount() {
        return supportCount;
    }

    public void setSupportCount(int count) {
        this.supportCount = count;
    }

    public double getSupportRatio() {
        return supportRatio;
    }

    public void setSupportRatio(double ratio) {
        this.supportRatio = ratio;
    }

    public int size() {
        return items.size();
    }

    public String getSignature() {
        return String.join(",", items);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Itemset)) return false;
        Itemset itemset = (Itemset) o;
        return Objects.equals(items, itemset.items);
    }

    @Override
    public int hashCode() {
        return Objects.hash(items);
    }

    @Override
    public int compareTo(Itemset other) {
        // Sắp xếp theo kích thước tăng dần, sau đó theo support tăng dần (hiếm nhất lên đầu)
        if (this.size() != other.size()) {
            return Integer.compare(this.size(), other.size());
        }
        if (this.supportCount != other.supportCount) {
            return Integer.compare(this.supportCount, other.supportCount);
        }
        return this.getSignature().compareTo(other.getSignature());
    }

    @Override
    public String toString() {
        return "{" + String.join(", ", items) + "} (count=" + supportCount + ", supp=" + String.format("%.4f", supportRatio) + ")";
    }
}
