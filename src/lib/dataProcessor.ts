/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { RawDataRow, Transaction, ItemMetadata, DatasetStats } from '../types';

export interface ParseResult {
  success: boolean;
  errorMessage?: string;
  transactions: Transaction[];
  stats: DatasetStats;
  previewRows: RawDataRow[];
  itemMetadataMap: Map<string, ItemMetadata>;
  rawRows: RawDataRow[];
}

/**
 * Chuẩn hóa tên trường trong dữ liệu để hỗ trợ trường hợp sai lệch chữ hoa/thường
 */
function normalizeRowKeys(row: Record<string, unknown>): RawDataRow {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase();
    if (cleanKey === 'invoiceno' || cleanKey === 'invoice_no' || cleanKey === 'invoice') {
      normalized.InvoiceNo = String(row[key] ?? '').trim();
    } else if (cleanKey === 'stockcode' || cleanKey === 'stock_code' || cleanKey === 'itemcode' || cleanKey === 'item_code') {
      normalized.StockCode = String(row[key] ?? '').trim();
    } else if (cleanKey === 'description' || cleanKey === 'desc' || cleanKey === 'item_name') {
      normalized.Description = String(row[key] ?? '').trim();
    } else if (cleanKey === 'quantity' || cleanKey === 'qty') {
      normalized.Quantity = Number(row[key] ?? 0);
    } else if (cleanKey === 'invoicedate' || cleanKey === 'invoice_date' || cleanKey === 'date') {
      normalized.InvoiceDate = String(row[key] ?? '').trim();
    } else if (cleanKey === 'unitprice' || cleanKey === 'unit_price' || cleanKey === 'price') {
      normalized.UnitPrice = Number(row[key] ?? 0);
    } else if (cleanKey === 'customerid' || cleanKey === 'customer_id') {
      normalized.CustomerID = String(row[key] ?? '').trim();
    } else if (cleanKey === 'country') {
      normalized.Country = String(row[key] ?? '').trim();
    } else {
      normalized[key] = row[key];
    }
  }
  return normalized as unknown as RawDataRow;
}

/**
 * Tiền xử lý mảng các dòng dữ liệu thô theo đúng đặc tả:
 * - Loại bỏ InvoiceNo bắt đầu bằng 'C'
 * - Loại bỏ Quantity <= 0
 * - Loại bỏ thiếu StockCode
 * - Chuyển đổi sang Map<InvoiceNo, Set<StockCode>>
 */
export function preprocessData(rawRows: Record<string, unknown>[]): ParseResult {
  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      errorMessage: 'File không có dữ liệu.',
      transactions: [],
      stats: {
        totalTransactions: 0,
        totalItems: 0,
        avgDensity: 0,
        cancelledCount: 0,
        rawRowsCount: 0,
      },
      previewRows: [],
      itemMetadataMap: new Map(),
      rawRows: [],
    };
  }

  // Chuẩn hóa và kiểm tra định dạng
  const normalizedRows: RawDataRow[] = [];
  let hasInvoiceNo = false;
  let hasStockCode = false;

  for (let i = 0; i < Math.min(rawRows.length, 50); i++) {
    const row = normalizeRowKeys(rawRows[i]);
    if (row.InvoiceNo) hasInvoiceNo = true;
    if (row.StockCode) hasStockCode = true;
  }

  if (!hasInvoiceNo || !hasStockCode) {
    return {
      success: false,
      errorMessage: 'File không đúng định dạng. Vui lòng kiểm tra lại.',
      transactions: [],
      stats: {
        totalTransactions: 0,
        totalItems: 0,
        avgDensity: 0,
        cancelledCount: 0,
        rawRowsCount: rawRows.length,
      },
      previewRows: [],
      itemMetadataMap: new Map(),
      rawRows: [],
    };
  }

  // Lưu 5 dòng đầu tiên để preview
  const previewRows: RawDataRow[] = rawRows.slice(0, 5).map((r) => normalizeRowKeys(r));

  let cancelledCount = 0;
  const transactionMap = new Map<string, Set<string>>();
  const itemMetadataMap = new Map<string, ItemMetadata>();
  const allNormalized: RawDataRow[] = [];

  for (const raw of rawRows) {
    const row = normalizeRowKeys(raw);
    allNormalized.push(row);

    const inv = row.InvoiceNo ? String(row.InvoiceNo).trim() : '';
    const stock = row.StockCode ? String(row.StockCode).trim() : '';
    const qty = Number(row.Quantity ?? 0);

    // QUY TẮC TIỀN XỬ LÝ (RẤT QUAN TRỌNG):
    // 1. Loại bỏ dòng có InvoiceNo bắt đầu bằng 'C' (đơn hủy)
    // 2. Loại bỏ dòng có Quantity <= 0
    // 3. Loại bỏ dòng thiếu StockCode
    if (!stock || stock === '' || stock.toLowerCase() === 'undefined' || stock.toLowerCase() === 'null') {
      cancelledCount++;
      continue;
    }

    if (inv.startsWith('C') || inv.startsWith('c') || qty <= 0) {
      cancelledCount++;
      continue;
    }

    // Cập nhật metadata mặt hàng
    if (!itemMetadataMap.has(stock)) {
      itemMetadataMap.set(stock, {
        code: stock,
        description: row.Description ? String(row.Description).trim() : `Mặt hàng ${stock}`,
        price: Number(row.UnitPrice) || undefined,
        frequency: 1,
      });
    } else {
      const meta = itemMetadataMap.get(stock)!;
      meta.frequency = (meta.frequency || 0) + 1;
      if (!meta.description && row.Description) {
        meta.description = String(row.Description).trim();
      }
    }

    // Nhóm theo InvoiceNo: Map<InvoiceNo, Set<StockCode>>
    if (!transactionMap.has(inv)) {
      transactionMap.set(inv, new Set<string>());
    }
    transactionMap.get(inv)!.add(stock);
  }

  // Chuyển đổi thành danh sách transactions
  const transactions: Transaction[] = [];
  let totalItemsCountAcrossTx = 0;

  for (const [id, itemSet] of transactionMap.entries()) {
    if (itemSet.size > 0) {
      const items = Array.from(itemSet);
      totalItemsCountAcrossTx += items.length;
      transactions.push({
        id,
        items,
      });
    }
  }

  const totalTransactions = transactions.length;
  const totalItems = itemMetadataMap.size;
  const avgDensity = totalTransactions > 0 ? Number((totalItemsCountAcrossTx / totalTransactions).toFixed(2)) : 0;

  return {
    success: true,
    transactions,
    stats: {
      totalTransactions,
      totalItems,
      avgDensity,
      cancelledCount,
      rawRowsCount: rawRows.length,
    },
    previewRows,
    itemMetadataMap,
    rawRows: allNormalized,
  };
}

/**
 * Đọc file CSV bằng PapaParse
 */
export async function parseCSVContent(csvText: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          resolve({
            success: false,
            errorMessage: 'File không đúng định dạng. Vui lòng kiểm tra lại.',
            transactions: [],
            stats: {
              totalTransactions: 0,
              totalItems: 0,
              avgDensity: 0,
              cancelledCount: 0,
              rawRowsCount: 0,
            },
            previewRows: [],
            itemMetadataMap: new Map(),
            rawRows: [],
          });
          return;
        }
        resolve(preprocessData(results.data));
      },
      error: () => {
        resolve({
          success: false,
          errorMessage: 'File không đúng định dạng. Vui lòng kiểm tra lại.',
          transactions: [],
          stats: {
            totalTransactions: 0,
            totalItems: 0,
            avgDensity: 0,
            cancelledCount: 0,
            rawRowsCount: 0,
          },
          previewRows: [],
          itemMetadataMap: new Map(),
          rawRows: [],
        });
      },
    });
  });
}

/**
 * Đọc file Excel (.xlsx, .xls) bằng SheetJS
 */
export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        errorMessage: 'File Excel không có sheet nào.',
        transactions: [],
        stats: { totalTransactions: 0, totalItems: 0, avgDensity: 0, cancelledCount: 0, rawRowsCount: 0 },
        previewRows: [],
        itemMetadataMap: new Map(),
        rawRows: [],
      };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });
    return preprocessData(jsonData);
  } catch (err) {
    console.error('Error parsing excel:', err);
    return {
      success: false,
      errorMessage: 'File không đúng định dạng. Vui lòng kiểm tra lại.',
      transactions: [],
      stats: { totalTransactions: 0, totalItems: 0, avgDensity: 0, cancelledCount: 0, rawRowsCount: 0 },
      previewRows: [],
      itemMetadataMap: new Map(),
      rawRows: [],
    };
  }
}
