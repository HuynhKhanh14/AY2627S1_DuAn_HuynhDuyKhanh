/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import {
  SanitizeVariant,
  SanitizationResult,
  Itemset,
  Transaction,
} from '../types';
import { executeSanitizeAPI } from '../lib/api';

interface Step4SanitizeProps {
  originalTransactions: Transaction[];
  sensitiveItemsets: Itemset[];
  allRareItemsets: Itemset[];
  maxSupportRatio: number;
  lastSanitizationResult: SanitizationResult | null;
  onSanitizeCompleted: (result: SanitizationResult) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step4Sanitize: React.FC<Step4SanitizeProps> = ({
  originalTransactions,
  sensitiveItemsets,
  allRareItemsets,
  maxSupportRatio,
  lastSanitizationResult,
  onSanitizeCompleted,
  onNext,
  onPrev,
}) => {
  const [variant, setVariant] = useState<SanitizeVariant>('min_cost');
  const [isSanitizing, setIsSanitizing] = useState<boolean>(false);

  const handleStartSanitizing = async () => {
    setIsSanitizing(true);

    try {
      const result = await executeSanitizeAPI(
        originalTransactions,
        sensitiveItemsets,
        allRareItemsets,
        variant,
        maxSupportRatio
      );
      onSanitizeCompleted(result);
    } catch (err) {
      console.error('Lỗi khi khử mẫn cảm:', err);
    } finally {
      setIsSanitizing(false);
    }
  };

  const hasResult = lastSanitizationResult !== null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">BƯỚC 4</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            ẨN DỮ LIỆU BẢO TOÀN RIÊNG TƯ (SANITIZE DATABASE)
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Lựa chọn chiến lược khử mẫn cảm (Variant) để che giấu các tập nhạy cảm đã chọn mà vẫn bảo tồn tối đa tính toàn vẹn và tri thức của cơ sở dữ liệu.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 text-base">Chọn biến thể thuật toán khử mẫn cảm (Variant)</h3>
          </div>
          <span className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-700 rounded-full border border-red-200">
            {sensitiveItemsets.length} tập nhạy cảm cần xử lý
          </span>
        </div>

        {/* Variant Dropdown & Explanations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card Random */}
          <div
            onClick={() => setVariant('random')}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              variant === 'random'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">Random Victim</span>
                <input
                  type="radio"
                  name="variant_radio"
                  checked={variant === 'random'}
                  onChange={() => setVariant('random')}
                  className="accent-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chọn ngẫu nhiên một mục thuộc tập nhạy cảm trong các giao dịch chứa nó để loại bỏ. Phương pháp cơ sở (baseline) có chi phí tính toán thấp.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              ⚡ Tốc độ nhanh nhất &bull; Dễ triển khai
            </div>
          </div>

          {/* Card Min-Cost */}
          <div
            onClick={() => setVariant('min_cost')}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              variant === 'min_cost'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">Min-Cost Victim</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                    Khuyên dùng
                  </span>
                </div>
                <input
                  type="radio"
                  name="variant_radio"
                  checked={variant === 'min_cost'}
                  onChange={() => setVariant('min_cost')}
                  className="accent-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tối thiểu chi phí tác động phụ: Chọn mục loại bỏ mà sự biến mất của nó ít gây phá vỡ các tập hiếm không nhạy cảm khác nhất (giảm Side Effect SE).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold">
              🛡️ Giảm thiểu Side Effect (SE) tối ưu
            </div>
          </div>

          {/* Card Max-Coverage */}
          <div
            onClick={() => setVariant('max_coverage')}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              variant === 'max_coverage'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">Max-Coverage Victim</span>
                <input
                  type="radio"
                  name="variant_radio"
                  checked={variant === 'max_coverage'}
                  onChange={() => setVariant('max_coverage')}
                  className="accent-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tối đa hóa độ bao phủ: Chọn mục xuất hiện trong nhiều tập nhạy cảm nhất một lúc, giúp che giấu hàng loạt tập với số giao dịch sửa đổi ít nhất (giảm Miss Cost MC).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-blue-700 font-semibold">
              📉 Tối thiểu hóa Miss Cost (MC)
            </div>
          </div>
        </div>

        {/* Action Button: Nút màu đỏ cảnh báo theo đặc tả trang 7 */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Thao tác sẽ tạo cơ sở dữ liệu làm sạch mới <code>sanitized_transactions</code></span>
          </div>

          <button
            onClick={handleStartSanitizing}
            disabled={isSanitizing || sensitiveItemsets.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSanitizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang thực thi thuật toán ẩn dữ liệu...
              </>
            ) : (
              <>
                <EyeOff className="w-5 h-5" />
                Bắt đầu ẩn dữ liệu
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông báo sau khi ẩn xong (Đặc tả trang 7) */}
      {hasResult && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950 text-base sm:text-lg">
                  Đã ẩn thành công {lastSanitizationResult.metrics.hiddenSensitive}/{lastSanitizationResult.metrics.totalSensitive} tập nhạy cảm
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Biến thể: <strong>{lastSanitizationResult.metrics.variantLabel}</strong> &bull; Đã sửa đổi{' '}
                  <strong>{lastSanitizationResult.metrics.mc} giao dịch</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-mono font-bold text-xs sm:text-sm border border-emerald-200 shadow-xs">
                <Clock className="w-4 h-4 text-emerald-600" />
                Thời gian chạy: {lastSanitizationResult.metrics.runtime} giây
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Bước 3</span>
        </button>

        <button
          onClick={onNext}
          disabled={!hasResult}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Xem báo cáo & Xuất kết quả (Bước 5)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
