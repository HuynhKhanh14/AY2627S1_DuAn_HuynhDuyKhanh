/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  Clock,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Database,
  Hash,
  Boxes,
} from 'lucide-react';
import { Transaction, Itemset, MiningAlgorithm, ItemMetadata } from '../types';
import { executeMiningAPI } from '../lib/api';

interface Step2MiningProps {
  transactions: Transaction[];
  itemMetadataMap: Map<string, ItemMetadata>;
  allRareItemsets: Itemset[];
  miningTime: number | null;
  maxSupportRatio: number;
  selectedAlgorithm: MiningAlgorithm;
  onMiningCompleted: (
    itemsets: Itemset[],
    executionTime: number,
    maxSupport: number,
    algorithm: MiningAlgorithm
  ) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2Mining: React.FC<Step2MiningProps> = ({
  transactions,
  itemMetadataMap,
  allRareItemsets,
  miningTime,
  maxSupportRatio: initialMaxSupport,
  selectedAlgorithm: initialAlgorithm,
  onMiningCompleted,
  onNext,
  onPrev,
}) => {
  const [maxSupport, setMaxSupport] = useState<number>(initialMaxSupport || 0.01);
  const [algorithm, setAlgorithm] = useState<MiningAlgorithm>(initialAlgorithm || 'branch_and_bound');
  const [maxTransactionsLimit, setMaxTransactionsLimit] = useState<number>(10000);
  const [minItemsetSize, setMinItemsetSize] = useState<number>(1);
  const [maxItemsetSize, setMaxItemsetSize] = useState<number>(3);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Xây dựng map tên mục
  const itemNamesMap = new Map<string, string>();
  for (const [code, meta] of itemMetadataMap.entries()) {
    itemNamesMap.set(code, meta.description);
  }

  const effectiveTransactions =
    transactions.length > maxTransactionsLimit
      ? transactions.slice(0, maxTransactionsLimit)
      : transactions;

  const maxSupportCount = Math.floor(maxSupport * effectiveTransactions.length);

  /**
   * Kích hoạt chạy thuật toán khai thác tập hiếm qua Backend / Client API
   */
  const handleStartMining = async () => {
    setIsMining(true);
    setCurrentPage(1);

    try {
      const { itemsets, executionTime } = await executeMiningAPI(
        effectiveTransactions,
        algorithm,
        maxSupport,
        1, // min support count
        itemNamesMap,
        maxItemsetSize
      );

      // Lọc kích thước tối thiểu nếu có
      const filtered = itemsets.filter((it) => it.length >= minItemsetSize);

      onMiningCompleted(filtered, executionTime, maxSupport, algorithm);
    } catch (err) {
      console.error('Lỗi khi khai thác:', err);
    } finally {
      setIsMining(false);
    }
  };

  // Tìm kiếm và lọc
  const filteredItemsets = allRareItemsets.filter((itemset) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesCode = itemset.items.some((code) => code.toLowerCase().includes(q));
    const matchesName = itemset.itemNames.some((name) => name.toLowerCase().includes(q));
    return matchesCode || matchesName;
  });

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredItemsets.length / itemsPerPage));
  const paginatedItemsets = filteredItemsets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">BƯỚC 2</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            CẤU HÌNH & KHAI THÁC TẬP HIẾM (CONFIGURE & MINE)
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Thiết lập ngưỡng hỗ trợ tối đa (Max Support) và thuật toán để tìm kiếm các tập mục hiếm (Rare Itemsets) trong cơ sở dữ liệu.
        </p>
      </div>

      {/* Form Cấu Hình */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Tham số cấu hình khai thác</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Max Support */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Max Support
                <span className="text-xs font-normal text-slate-500">(0.001 - 0.1)</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {(maxSupport * 100).toFixed(2)}% ({maxSupportCount} tx)
              </span>
            </div>

            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={maxSupport}
              onChange={(e) => setMaxSupport(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.001"
                max="0.1"
                step="0.001"
                value={maxSupport}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.001 && val <= 0.1) {
                    setMaxSupport(val);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">Tỷ lệ</span>
            </div>
            <p className="text-xs text-slate-500">Mục có tần số &le; ngưỡng này được coi là tập hiếm.</p>
          </div>

          {/* Thuật toán khai thác */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 block">
              Thuật toán khai thác
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as MiningAlgorithm)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-800"
            >
              <option value="branch_and_bound">Branch-and-Bound (Mặc định B&B)</option>
              <option value="apriori">Apriori (Level-wise search)</option>
              <option value="fp_growth">FP-Growth (Frequent/Rare Pattern)</option>
            </select>
            <p className="text-xs text-slate-500">
              {algorithm === 'branch_and_bound' && 'Áp dụng tính chất cận trên để cắt tỉa không gian tìm kiếm.'}
              {algorithm === 'apriori' && 'Sinh tổ hợp ứng viên theo từng cấp k.'}
              {algorithm === 'fp_growth' && 'Khai thác mẫu nén dựa trên cấu trúc cây tiền tố.'}
            </p>
          </div>

          {/* Giới hạn số giao dịch */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 block">
              Số giao dịch tối đa
            </label>
            <input
              type="number"
              min="100"
              max="50000"
              step="500"
              value={maxTransactionsLimit}
              onChange={(e) => setMaxTransactionsLimit(parseInt(e.target.value) || 10000)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">Mặc định 10000 giao dịch. Dùng để giới hạn nếu dữ liệu quá lớn.</p>
          </div>
        </div>

        {/* Nút bắt đầu khai thác (Màu xanh lá nổi bật theo đặc tả) */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Database className="w-4 h-4 text-slate-400" />
            <span>Đang xử lý trên: <strong>{effectiveTransactions.length} giao dịch</strong></span>
          </div>

          <button
            onClick={handleStartMining}
            disabled={isMining}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isMining ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang chạy thuật toán {algorithm.toUpperCase()}...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Bắt đầu khai thác
              </>
            )}
          </button>
        </div>
      </div>

      {/* Kết quả sau khi khai thác xong */}
      {miningTime !== null && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Header kết quả & Thời gian chạy */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950 text-base">
                  Khai thác hoàn tất: Tìm thấy {allRareItemsets.length} tập hiếm
                </h4>
                <p className="text-xs text-emerald-800">
                  Thỏa mãn điều kiện: 1 &le; Support Count &le; {maxSupportCount} (Max Support = {(maxSupport * 100).toFixed(2)}%)
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-mono font-bold shadow-xs">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Thời gian khai thác: {miningTime} giây</span>
            </div>
          </div>

          {/* Bảng kết quả tập hiếm */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Search and Table Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã hoặc tên sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Hiển thị {paginatedItemsets.length} / {filteredItemsets.length} tập mục
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">STT</th>
                    <th className="py-3 px-4">Tập mục (Itemset)</th>
                    <th className="py-3 px-4 text-center w-28">Kích thước</th>
                    <th className="py-3 px-4 text-right w-32">Support Count</th>
                    <th className="py-3 px-4 text-right w-32">Support %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItemsets.length > 0 ? (
                    paginatedItemsets.map((itemset, idx) => {
                      const absoluteIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                      return (
                        <tr key={itemset.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-medium">{absoluteIndex}</td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {itemset.items.map((code) => (
                                  <span
                                    key={code}
                                    className="px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-slate-100 text-blue-700 border border-slate-200"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-slate-600 font-medium line-clamp-1">
                                {itemset.itemNames.join(' + ')}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {itemset.length}-itemset
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                            {itemset.supportCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-blue-700 font-semibold">
                            {(itemset.supportRatio * 100).toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Không tìm thấy tập hiếm nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Trang {currentPage} / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Bước 1</span>
        </button>

        <button
          onClick={onNext}
          disabled={allRareItemsets.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Tiếp tục sang Bước 3 (Chọn tập nhạy cảm)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
