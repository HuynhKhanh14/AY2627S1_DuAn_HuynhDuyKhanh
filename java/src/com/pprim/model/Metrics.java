package com.pprim.model;

/**
 * Lớp chứa 4 chỉ số đánh giá thực nghiệm:
 * 1. HF (Hiding Failure %): Tỷ lệ phần trăm tập nhạy cảm chưa được ẩn
 * 2. MC (Misses Cost): Số giao dịch bị sửa đổi trong cơ sở dữ liệu
 * 3. SE (Side Effect): Số tập hiếm không nhạy cảm bị mất do khử mẫn cảm
 * 4. Runtime (s): Thời gian thực thi
 */
public class Metrics {
    private final String variant;
    private final double maxSupport;
    private final double hf;
    private final int mc;
    private final int se;
    private final double runtimeSeconds;
    private final int totalSensitive;
    private final int hiddenSensitive;

    public Metrics(String variant, double maxSupport, double hf, int mc, int se, double runtimeSeconds, int totalSensitive, int hiddenSensitive) {
        this.variant = variant;
        this.maxSupport = maxSupport;
        this.hf = hf;
        this.mc = mc;
        this.se = se;
        this.runtimeSeconds = runtimeSeconds;
        this.totalSensitive = totalSensitive;
        this.hiddenSensitive = hiddenSensitive;
    }

    public String getVariant() {
        return variant;
    }

    public double getMaxSupport() {
        return maxSupport;
    }

    public double getHf() {
        return hf;
    }

    public int getMc() {
        return mc;
    }

    public int getSe() {
        return se;
    }

    public double getRuntimeSeconds() {
        return runtimeSeconds;
    }

    public int getTotalSensitive() {
        return totalSensitive;
    }

    public int getHiddenSensitive() {
        return hiddenSensitive;
    }

    @Override
    public String toString() {
        return String.format(
            "[%s] HF=%.2f%%, MC=%d, SE=%d, Runtime=%.4fs (Hidden: %d/%d)",
            variant, hf, mc, se, runtimeSeconds, hiddenSensitive, totalSensitive
        );
    }
}
