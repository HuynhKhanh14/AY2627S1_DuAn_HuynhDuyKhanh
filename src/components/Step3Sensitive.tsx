/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckSquare,
  Square,
  Search,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Itemset } from '../types';

interface Step3SensitiveProps {
  allRareItemsets: Itemset[];
  selectedSensitiveIds: Set<string>;
  onToggleSensitive: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectTopRare: (count: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3Sensitive: React.FC<Step3SensitiveProps> = ({
  allRareItemsets,
  selectedSensitiveIds,
  onToggleSensitive,
  onSelectAll,
  onDeselectAll,
  onSelectTopRare,
  onNext,
  onPrev,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Lọc theo từ khóa tìm kiếm
  const filteredItemsets = allRareItemsets.filter((itemset) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      itemset.items.some((code) => code.toLowerCase().includes(q)) ||
      itemset.itemNames.some((name) => name.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItemsets.length / itemsPerPage));
  const paginatedItemsets = filteredItemsets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedCount = selectedSensitiveIds.size;
  const isAllSelected = allRareItemsets.length > 0 && selectedCount === allRareItemsets.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">BƯỚC 3</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            CHỌN TẬP NHẠY CẢM (SELECT SENSITIVE ITEMSETS)
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Chọn các tập mục hiếm mà bạn coi là bí mật kinh doanh hoặc thông tin nhạy cảm cần được bảo vệ trước khi chia sẻ dữ liệu.
        </p>
      </div>

      {/* Selected Indicator Banner & Quick Tools */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              selectedCount > 0 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                Đã chọn <span className="text-amber-600 font-extrabold">{selectedCount}</span> tập nhạy cảm
              </span>
              {selectedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-md">
                  Sẵn sàng khử mẫn cảm
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cần chọn ít nhất 1 tập để áp dụng thuật toán ẩn dữ liệu ở Bước 4.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectTopRare(5)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Chọn Top 5 hiếm nhất
          </button>

          <button
            onClick={() => onSelectTopRare(10)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Chọn Top 10
          </button>

          <button
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {isAllSelected ? (
              <>
                <Square className="w-3.5 h-3.5" />
                Bỏ chọn tất cả
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                Chọn tất cả
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table of Itemsets with Checkboxes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Counter */}
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

          <div className="text-xs text-slate-500">
            Hiển thị {paginatedItemsets.length} / {filteredItemsets.length} tập mục
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">
                  <span className="sr-only">Chọn</span>
                </th>
                <th className="py-3 px-3 w-16 text-center">STT</th>
                <th className="py-3 px-4">Tập mục (Itemset)</th>
                <th className="py-3 px-4 text-center w-28">Kích thước</th>
                <th className="py-3 px-4 text-right w-32">Support Count</th>
                <th className="py-3 px-4 text-right w-32">Support %</th>
                <th className="py-3 px-4 text-center w-32">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItemsets.length > 0 ? (
                paginatedItemsets.map((itemset, idx) => {
                  const absoluteIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isChecked = selectedSensitiveIds.has(itemset.id);

                  return (
                    <tr
                      key={itemset.id}
                      onClick={() => onToggleSensitive(itemset.id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleSensitive(itemset.id)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{absoluteIndex}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {itemset.items.map((code) => (
                              <span
                                key={code}
                                className={`px-2 py-0.5 rounded-md font-mono text-xs font-semibold border ${
                                  isChecked
                                    ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
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
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                        {(itemset.supportRatio * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            Nhạy cảm
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Bình thường</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy tập mục nào phù hợp.
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

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Bước 2</span>
        </button>

        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Tiếp tục sang Bước 4 (Ẩn dữ liệu)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
