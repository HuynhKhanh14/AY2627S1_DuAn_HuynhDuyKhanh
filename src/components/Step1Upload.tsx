/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { parseCSVContent, parseExcelBuffer } from '../lib/dataProcessor';
import { fetchSampleDataset } from '../lib/api';
import { Transaction, DatasetStats, RawDataRow, ItemMetadata } from '../types';

interface Step1UploadProps {
  transactions: Transaction[];
  stats: DatasetStats | null;
  previewRows: RawDataRow[];
  itemMetadataMap: Map<string, ItemMetadata>;
  onDataLoaded: (
    transactions: Transaction[],
    stats: DatasetStats,
    previewRows: RawDataRow[],
    itemMetadataMap: Map<string, ItemMetadata>,
    rawRows: RawDataRow[]
  ) => void;
  onNext: () => void;
}

export const Step1Upload: React.FC<Step1UploadProps> = ({
  transactions,
  stats,
  previewRows,
  onDataLoaded,
  onNext,
}) => {
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Tải và xử lý file dữ liệu mẫu có sẵn qua API hoặc static fallback
   */
  const handleLoadSample = async () => {
    try {
      setIsLoadingSample(true);
      setErrorMessage(null);
      const result = await fetchSampleDataset();

      if (!result.success) {
        setErrorMessage('File không đúng định dạng. Vui lòng kiểm tra lại.');
        return;
      }

      setSourceName('Online Retail Sample (1000 giao dịch)');
      onDataLoaded(result.transactions, result.stats, result.previewRows, result.itemMetadataMap, result.rawRows);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Không thể tải file mẫu. Vui lòng kiểm tra file trong thư mục public/data/');
    } finally {
      setIsLoadingSample(false);
    }
  };

  /**
   * Xử lý file do người dùng upload (CSV hoặc Excel)
   */
  const processUploadedFile = async (file: File) => {
    // Giới hạn 10MB như đặc tả
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Dung lượng file vượt quá giới hạn cho phép (Tối đa 10MB).');
      return;
    }

    const fileName = file.name.toLowerCase();
    setIsUploading(true);
    setErrorMessage(null);

    try {
      if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const result = await parseCSVContent(text);
        if (!result.success) {
          setErrorMessage(result.errorMessage || 'File không đúng định dạng. Vui lòng kiểm tra lại.');
          return;
        }
        setSourceName(file.name);
        onDataLoaded(result.transactions, result.stats, result.previewRows, result.itemMetadataMap, result.rawRows);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const result = await parseExcelBuffer(buffer);
        if (!result.success) {
          setErrorMessage(result.errorMessage || 'File không đúng định dạng. Vui lòng kiểm tra lại.');
          return;
        }
        setSourceName(file.name);
        onDataLoaded(result.transactions, result.stats, result.previewRows, result.itemMetadataMap, result.rawRows);
      } else {
        setErrorMessage('File không đúng định dạng. Vui lòng chọn file .csv, .xlsx hoặc .xls.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('File không đúng định dạng. Vui lòng kiểm tra lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const hasData = transactions.length > 0 && stats !== null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">BƯỚC 1</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">TẢI DỮ LIỆU GIAO DỊCH (UPLOAD DATA)</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Chọn dữ liệu để phân tích theo 2 cách: sử dụng dataset mẫu trực tiếp từ UCI Online Retail II hoặc tải lên file dữ liệu riêng của bạn.
        </p>
      </div>

      {/* Error Alert / Toast */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-red-900 text-sm">Lỗi định dạng dữ liệu</h4>
            <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2 Upload Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Option 1: Built-in Sample */}
        <div className="relative flex flex-col justify-between p-6 sm:p-7 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" /> Khuyên dùng cho thử nghiệm
              </span>
              <span className="text-xs font-semibold text-slate-500">1000 dòng chuẩn UCI</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              DÙNG DỮ LIỆU MẪU CÓ SẴN
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Tập dữ liệu chuẩn <strong>Online Retail II</strong> được trích xuất sẵn trong hệ thống (<code>public/data/online_retail_sample.csv</code>), chứa các sản phẩm tiêu dùng và các tổ hợp tập hiếm phục vụ đánh giá thuật toán.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-100 flex items-center justify-between">
            <button
              onClick={handleLoadSample}
              disabled={isLoadingSample}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingSample ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang xử lý dữ liệu...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Sử dụng dữ liệu mẫu (Nhấn là chạy ngay)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Option 2: Upload Own File */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col justify-between p-6 sm:p-7 rounded-2xl border-2 border-dashed transition-all ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" /> Hỗ trợ .csv, .xlsx, .xls
              </span>
              <span className="text-xs text-slate-500">Tối đa 10MB</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              TẢI LÊN FILE CỦA RIÊNG MÌNH
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Kéo thả file CSV hoặc Excel vào đây. File cần có tối thiểu 2 cột <code>InvoiceNo</code> và <code>StockCode</code> (theo cấu trúc Online Retail).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md shadow-slate-900/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang phân tích file...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Chọn file từ máy tính
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Display Data Stats (4 Cards) */}
      {hasData && (
        <div className="space-y-6 pt-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                THỐNG KÊ DỮ LIỆU ĐÃ TẢI ({sourceName || 'Dữ liệu giao dịch'})
              </h3>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Quy tắc tiền xử lý đã áp dụng thành công
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng giao dịch
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                  {stats.totalTransactions.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">hóa đơn</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Sau khi nhóm InvoiceNo</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng mặt hàng
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                  {stats.totalItems.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">sản phẩm</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Số mục duy nhất (Items)</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Mật độ trung bình
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-violet-600">
                  {stats.avgDensity}
                </span>
                <span className="text-xs text-slate-500 font-medium">mục / đơn</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Số items trung bình</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Giao dịch bị lọc
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                  {stats.cancelledCount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">dòng</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Hủy ('C') & Qty &le; 0</span>
            </div>
          </div>

          {/* Data Preprocessing Rules Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Quy tắc lọc dữ liệu tự động (Pre-processing rules):</strong> Đã loại bỏ tất cả các dòng có mã hóa đơn bắt đầu bằng chữ 'C' (đơn hủy hàng), loại bỏ các dòng có Quantity &le; 0 hoặc thiếu mã sản phẩm StockCode, và chuyển đổi dữ liệu về dạng giao dịch <code>Map&lt;InvoiceNo, Set&lt;StockCode&gt;&gt;</code>.
            </div>
          </div>

          {/* Preview Table: First 5 rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                PREVIEW 5 DÒNG ĐẦU TIÊN CỦA DỮ LIỆU GỐC
              </h4>
              <span className="text-xs text-slate-500">Trước khi gom nhóm giao dịch</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 w-14 text-center">STT</th>
                    <th className="py-3 px-3">InvoiceNo</th>
                    <th className="py-3 px-3">StockCode</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-3 text-right">UnitPrice</th>
                    <th className="py-3 px-3">CustomerID</th>
                    <th className="py-3 px-3">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.InvoiceNo}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-600">{row.StockCode}</td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">{row.Description || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">{row.Quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{row.UnitPrice ? Number(row.UnitPrice).toFixed(2) : '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.CustomerID || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.Country || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step Footer Navigation */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {hasData ? (
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Dữ liệu đã sẵn sàng để khai thác tập hiếm
            </span>
          ) : (
            'Vui lòng tải hoặc chọn dữ liệu mẫu để tiếp tục'
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!hasData}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Tiếp tục sang Bước 2</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
