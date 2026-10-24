/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Kiểu dữ liệu một dòng dữ liệu thô từ file CSV/Excel UCI Online Retail II
 */
export interface RawDataRow {
  InvoiceNo: string;
  StockCode: string;
  Description?: string;
  Quantity: number | string;
  InvoiceDate?: string;
  UnitPrice?: number | string;
  CustomerID?: string;
  Country?: string;
  [key: string]: unknown;
}

/**
 * Một giao dịch đã được tiền xử lý và gộp theo InvoiceNo
 */
export interface Transaction {
  /** Mã hóa đơn (InvoiceNo) */
  id: string;
  /** Danh sách các mã sản phẩm duy nhất trong giao dịch */
  items: string[];
}

/**
 * Thông tin mô tả sản phẩm để hiển thị trực quan
 */
export interface ItemMetadata {
  code: string;
  description: string;
  price?: number;
  frequency?: number;
}

/**
 * Thống kê tổng quan dữ liệu tải lên
 */
export interface DatasetStats {
  /** Tổng số giao dịch hợp lệ sau khi gộp */
  totalTransactions: number;
  /** Tổng số mặt hàng duy nhất */
  totalItems: number;
  /** Mật độ trung bình: Số mặt hàng trung bình trên mỗi giao dịch */
  avgDensity: number;
  /** Số dòng giao dịch bị hủy hoặc không hợp lệ đã lọc bỏ */
  cancelledCount: number;
  /** Tổng số dòng thô ban đầu */
  rawRowsCount: number;
}

/**
 * Cấu trúc một tập mục khai thác được (Itemset)
 */
export interface Itemset {
  /** Định danh duy nhất của tập mục */
  id: string;
  /** Danh sách các item code trong tập */
  items: string[];
  /** Tên hoặc mô tả tóm tắt của các item */
  itemNames: string[];
  /** Tần số xuất hiện (Support Count) */
  supportCount: number;
  /** Tỷ lệ hỗ trợ (Support Ratio: supportCount / totalTransactions) */
  supportRatio: number;
  /** Kích thước của tập mục */
  length: number;
  /** Đánh dấu có phải tập nhạy cảm không */
  isSensitive?: boolean;
}

/**
 * Thuật toán khai thác tập hiếm
 */
export type MiningAlgorithm = 'branch_and_bound' | 'apriori' | 'fp_growth';

/**
 * Biến thể thuật toán ẩn dữ liệu
 */
export type SanitizeVariant = 'random' | 'min_cost' | 'max_coverage';

/**
 * Kết quả đo lường và đánh giá ẩn dữ liệu (Privacy Preservation Metrics)
 */
export interface ExperimentMetrics {
  variant: SanitizeVariant;
  variantLabel: string;
  maxSupport: number;
  /** Hiding Failure (HF): Tỷ lệ phần trăm các tập nhạy cảm chưa được ẩn thành công (0% là hoàn hảo) */
  hf: number;
  /** Miss Cost (MC): Số lượng giao dịch bị sửa đổi trong cơ sở dữ liệu */
  mc: number;
  /** Side Effect (SE): Số lượng tập hiếm không nhạy cảm bị mất do quá trình ẩn */
  se: number;
  /** Thời gian chạy thuật toán ẩn dữ liệu (giây) */
  runtime: number;
  /** Tổng số tập nhạy cảm cần ẩn */
  totalSensitive: number;
  /** Số tập nhạy cảm đã ẩn thành công */
  hiddenSensitive: number;
}

/**
 * Kết quả tổng thể sau quá trình khử mẫn cảm (Sanitization)
 */
export interface SanitizationResult {
  variant: SanitizeVariant;
  sanitizedTransactions: Transaction[];
  modifiedInvoiceIds: Set<string>;
  metrics: ExperimentMetrics;
  deletedItemsCount: number;
  remainingSensitiveItemsets: Itemset[];
  lostRareItemsets: Itemset[];
}
