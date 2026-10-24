/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, Download, Database, BookOpen, X, CheckCircle2 } from 'lucide-react';
import { exportProjectZip } from '../lib/exportUtils';

interface HeaderProps {
  onOpenGuide: () => void;
}

/**
 * Component Header chính của ứng dụng
 */
export const Header: React.FC<HeaderProps> = ({ onOpenGuide }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      await exportProjectZip();
    } catch (err) {
      console.error('Lỗi khi xuất ZIP:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                PPRIM-Explorer
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
                v1.0
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Full-Stack Express &bull; Docker Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Privacy-Preserving Rare Itemset Mining &bull; REST API Backend
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Xem hướng dẫn sử dụng chi tiết"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Hướng dẫn sử dụng</span>
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Xuất mã nguồn đồ án dạng ZIP để đưa lên GitHub"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">{isExporting ? 'Đang đóng gói...' : 'Xuất mã nguồn (ZIP)'}</span>
            <span className="md:hidden">ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal hiển thị tài liệu hướng dẫn sử dụng và thuyết minh đề tài
 */
export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-200" />
            <div>
              <h2 className="text-lg font-bold">Hướng Dẫn Sử Dụng & Thuyết Minh Đồ Án</h2>
              <p className="text-xs text-blue-100">Hệ thống Khai thác Tập hiếm Bảo toàn Quyền riêng tư (PPRIM)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Sinh viên & Giảng viên */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-800 block">Sinh viên thực hiện</span>
              <span className="font-bold text-slate-900 text-base">Huỳnh Duy Khánh</span>
              <span className="text-slate-600 text-xs block">Lớp / MSSV: DA139</span>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-800 block">Giảng viên hướng dẫn</span>
              <span className="font-bold text-slate-900 text-base">ThS. Nguyễn Chí Thiện</span>
              <span className="text-slate-600 text-xs block">Học phần: Đồ án tốt nghiệp / Chuyên đề</span>
            </div>
          </div>

          {/* Tổng quan */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              1. Khái niệm Khai thác Tập hiếm & Bảo toàn riêng tư
            </h3>
            <p>
              <strong>Tập hiếm (Rare Itemset):</strong> Là các tập mục có tần số xuất hiện thấp trong cơ sở dữ liệu
              (nhỏ hơn hoặc bằng ngưỡng <em>Max Support</em>). Mặc dù ít xảy ra, các tập hiếm lại mang giá trị đặc biệt quan trọng:
              phát hiện giao dịch gian lận ngân hàng, phản ứng phụ hiếm gặp của thuốc hoặc hành vi mua sắm độc đáo.
            </p>
            <p>
              <strong>Bảo toàn quyền riêng tư (Privacy Preservation):</strong> Khi chia sẻ dữ liệu cho bên thứ ba, một số tập hiếm
              có thể chứa thông tin bí mật thương mại hoặc danh tính nhạy cảm. Quá trình <em>Sanitization</em> (khử mẫn cảm)
              sẽ loại bỏ chọn lọc một số mục nhằm che giấu các tập nhạy cảm mà vẫn giữ nguyên tối đa độ hữu dụng của dữ liệu.
            </p>
          </div>

          {/* Quy trình 5 bước */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base">2. Quy trình làm việc 5 bước (Stepper)</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900">Bước 1: Tải dữ liệu:</strong> Sử dụng dữ liệu mẫu có sẵn (1000 dòng từ UCI Online Retail II) hoặc kéo thả file CSV/Excel của bạn. Dữ liệu sẽ tự động được lọc bỏ các đơn hủy (InvoiceNo bắt đầu bằng 'C'), Quantity &le; 0 và nhóm theo từng giao dịch.
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900">Bước 2: Cấu hình & Khai thác:</strong> Tùy chỉnh Max Support (0.001 - 0.1), lựa chọn thuật toán (Branch-and-Bound, Apriori, hoặc FP-Growth) và nhấn nút để tìm kiếm tất cả các tập mục hiếm.
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900">Bước 3: Chọn tập nhạy cảm:</strong> Đánh dấu các tập hiếm mà bạn xem là bí mật cần che giấu trước khi xuất bản dữ liệu.
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-900">Bước 4: Ẩn dữ liệu:</strong> Lựa chọn một trong 3 biến thể:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600 text-xs">
                    <li><strong>Random Victim:</strong> Xóa ngẫu nhiên một mục trong giao dịch chứa tập nhạy cảm.</li>
                    <li><strong>Min-Cost Victim:</strong> Chọn mục mà việc xóa ít gây mất mát các tập hiếm không nhạy cảm khác nhất (giảm Side Effect).</li>
                    <li><strong>Max-Coverage Victim:</strong> Chọn mục xuất hiện trong nhiều tập nhạy cảm nhất để ẩn nhiều tập cùng lúc (giảm Miss Cost).</li>
                  </ul>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-slate-900">Bước 5: Báo cáo & Xuất kết quả:</strong> Xem 4 chỉ số đo lường (HF, MC, SE, Runtime), biểu đồ trực quan, tải về file CSV đã làm sạch hoặc xuất file Báo cáo PDF chuyên nghiệp.
                </div>
              </div>
            </div>
          </div>

          {/* Các chỉ số đánh giá */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base">3. Các chỉ số đo lường đánh giá chất lượng</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Hiding Failure (HF):</strong> Tỷ lệ phần trăm tập nhạy cảm chưa ẩn được thành công. Mục tiêu lý tưởng là HF = 0%.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Miss Cost (MC):</strong> Số lượng giao dịch trong tập dữ liệu gốc bị sửa đổi. MC càng thấp chứng tỏ dữ liệu ít bị can thiệp.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Side Effect (SE):</strong> Số lượng tập hiếm lành tính (không nhạy cảm) bị vô tình phá vỡ. SE càng thấp chứng tỏ bảo toàn tri thức tốt.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đã hiểu & Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
};
