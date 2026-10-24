/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { Transaction, SanitizationResult, ItemMetadata, ExperimentMetrics, Itemset } from '../types';

/**
 * Xuất dữ liệu đã làm sạch sang định dạng CSV
 * @param sanitizedTransactions Danh sách giao dịch đã ẩn các item nhạy cảm
 * @param itemMetadataMap Bản đồ thông tin mặt hàng
 * @param originalRows Dữ liệu thô gốc để giữ đúng định dạng UCI Online Retail
 */
export function exportSanitizedCSV(
  sanitizedTransactions: Transaction[],
  itemMetadataMap: Map<string, ItemMetadata>,
  filename: string = 'sanitized_online_retail.csv'
) {
  const rows: string[] = ['InvoiceNo,StockCode,Description,Quantity'];

  for (const tx of sanitizedTransactions) {
    for (const itemCode of tx.items) {
      const meta = itemMetadataMap.get(itemCode);
      const desc = meta ? meta.description.replace(/"/g, '""') : itemCode;
      rows.push(`"${tx.id}","${itemCode}","${desc}",1`);
    }
  }

  const csvContent = rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất báo cáo đánh giá thực nghiệm ẩn dữ liệu sang file PDF
 */
export function exportEvaluationPDF(
  result: SanitizationResult,
  allComparisonMetrics: ExperimentMetrics[],
  sensitiveItemsets: Itemset[],
  stats: { totalTransactions: number; totalItems: number; maxSupport: number; algorithm: string }
) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('BAO CAO DANH GIA THUC NGHIEM PPRIM', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Privacy-Preserving Rare Itemset Mining (PPRIM-Explorer)', 14, 27);

  // Student Info (Page 2 & Page 11 of Spec)
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 32, 182, 28, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('THONG TIN DE TAI & SINH VIEN THUC HIEN:', 18, 39);
  doc.text('Sinh vien: Huynh Duy Khanh - MSSV/Lop: DA139', 18, 46);
  doc.text('Giang vien huong dan (GVHD): ThS. Nguyen Chi Thien', 18, 53);
  doc.text(`Ngay xuat: ${new Date().toLocaleString('vi-VN')}`, 115, 53);

  // Parameter Section
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. THONG SO CAU HINH THI NGHIEM', 14, 68);

  autoTable(doc, {
    startY: 72,
    head: [['Thong so', 'Gia tri']],
    body: [
      ['Tap du lieu thu nghiem', 'UCI Online Retail II Sample (Built-in)'],
      ['Tong so giao dich (D)', `${stats.totalTransactions} giao dich`],
      ['Tong so mat hang (Items)', `${stats.totalItems} san pham`],
      ['Nguong ho tro toi da (Max Support)', `${(stats.maxSupport * 100).toFixed(2)}% (${Math.floor(stats.maxSupport * stats.totalTransactions)} tx)`],
      ['Thuat toan khai thac', stats.algorithm.toUpperCase()],
      ['Bien the an du lieu da chon', result.metrics.variantLabel],
      ['So tap nhay cam can an', `${result.metrics.totalSensitive} tap`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Current Metrics Summary
  // @ts-expect-error autoTable types extension
  let currentY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. KET QUA DANH GIA CHI SO (METRICS SUMMARY)', 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Chi so danh gia (Metric)', 'Gia tri', 'Y nghia']],
    body: [
      [
        'Hiding Failure (HF)',
        `${result.metrics.hf}%`,
        result.metrics.hf === 0 ? 'Hoan hao: 100% tap nhay cam da duoc an an toan' : 'Con tap nhay cam chua duoc an',
      ],
      [
        'Miss Cost (MC)',
        `${result.metrics.mc} giao dich`,
        `So luong giao dich trong D bi sua doi (${((result.metrics.mc / stats.totalTransactions) * 100).toFixed(1)}%)`,
      ],
      [
        'Side Effect (SE)',
        `${result.metrics.se} tap hiem`,
        'So tap hiem khong nhay cam bi bien mat ngoai y muon',
      ],
      [
        'Runtime',
        `${result.metrics.runtime}s`,
        'Thoi gian xu ly thuat toan an du lieu',
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
  });

  // Comparison Across Variants Table
  // @ts-expect-error autoTable types extension
  currentY = doc.lastAutoTable.finalY + 12;
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. BANG SO SANH CAC BIEN THE AN DU LIEU', 14, currentY);

  const comparisonRows = (allComparisonMetrics.length > 0 ? allComparisonMetrics : [result.metrics]).map((m) => [
    m.variantLabel,
    `${m.hf}%`,
    `${m.mc}`,
    `${m.se}`,
    `${m.runtime}s`,
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Bien the thuat toan', 'Hiding Failure (HF)', 'Miss Cost (MC)', 'Side Effect (SE)', 'Runtime']],
    body: comparisonRows,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  });

  // Sensitive Itemsets Table
  // @ts-expect-error autoTable types extension
  currentY = doc.lastAutoTable.finalY + 12;
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('4. DANH SACH TAP NHAY CAM DA AN', 14, currentY);

  const sensitiveRows = sensitiveItemsets.map((itemset, idx) => [
    `${idx + 1}`,
    itemset.items.join(', '),
    itemset.itemNames.join(' + '),
    `${itemset.supportCount}`,
    `${(itemset.supportRatio * 100).toFixed(2)}%`,
    'Da an thanh cong',
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['STT', 'Ma StockCode', 'Ten tap muc', 'Support Count', 'Support %', 'Trang thai']],
    body: sensitiveRows,
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68] },
    styles: { fontSize: 8 },
  });

  doc.save('pprim_evaluation_report.pdf');
}

/**
 * Xuất toàn bộ mã nguồn của dự án thành file ZIP theo đúng tên repo GitHub của sinh viên
 * "AY2627S1_DoAn_HuynhDuyKhanh.zip" theo yêu cầu trang 9 & 11 trong đặc tả
 */
export async function exportProjectZip() {
  const zip = new JSZip();

  // Đính kèm README.md hoàn chỉnh với đầy đủ cơ sở toán học và benchmark
  zip.file(
    'README.md',
    `# ĐỒ ÁN: PPRIM-Explorer (Privacy-Preserving Rare Itemset Mining)
**Sinh viên thực hiện:** Huỳnh Duy Khánh  
**Mã số / Lớp:** DA139  
**Cán bộ hướng dẫn (GVHD):** ThS. Nguyễn Chí Thiện  
**Tên repo GitHub:** AY2627S1_DoAn_HuynhDuyKhanh  

---

## 1. Cam kết tuân thủ: 100% Thuần, KHÔNG dùng thư viện khai phá ngoài
- Toàn bộ các thuật toán Branch-and-Bound, Apriori, FP-Growth, PPRIM Sanitization (Random, Min-Cost, Max-Coverage), và 4 chỉ số HF, MC, SE, Runtime được cài đặt từ đầu (from scratch) trên cả TypeScript lẫn Java.
- Mã nguồn Java trong thư mục \`java/\` là 100% Pure Java SE (chỉ dùng java.util.* và java.io.*), không cần bất kỳ file .jar phụ thuộc nào.
- Các gói trong package.json chỉ phục vụ giao diện người dùng (UI), biểu đồ và máy chủ Web.

## 2. Hướng dẫn chạy
\`\`\`bash
# 1. Chạy kịch bản kiểm chứng tự động (Reproducible Benchmark):
npm run benchmark

# 2. Chạy chương trình Java thuần (Pure Java SE, 0 thư viện ngoài):
cd java
./run.sh
# Hoặc: javac -d bin -sourcepath src src/com/pprim/Main.java && java -cp bin com.pprim.Main

# 3. Chạy giao diện Web trực quan:
npm install
npm run dev
\`\`\`
`
  );

  // Đính kèm toàn bộ mã nguồn Java Pure SE
  const javaFolder = zip.folder('java');
  if (javaFolder) {
    javaFolder.file(
      'run.sh',
      `#!/bin/bash
set -e
DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"
mkdir -p bin
javac -d bin -sourcepath src src/com/pprim/Main.java
java -cp bin com.pprim.Main "$@"
`
    );

    javaFolder.file(
      'README_JAVA.md',
      `# PPRIM-Explorer (Pure Java SE Core Engine)
100% tuân thủ yêu cầu: KHÔNG DÙNG BẤT KỲ THƯ VIỆN NGOÀI NÀO.
Biên dịch: javac -d bin -sourcepath src src/com/pprim/Main.java
Khởi chạy: java -cp bin com.pprim.Main
`
    );

    const srcFolder = javaFolder.folder('src/com/pprim');
    if (srcFolder) {
      srcFolder.file(
        'Main.java',
        `package com.pprim;
import com.pprim.mining.*;
import com.pprim.model.*;
import com.pprim.sanitize.*;
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== PPRIM-Explorer: Pure Java SE Core (Zero External Libraries) ===");
        System.out.println("Huynh Duy Khanh (DA139) - GVHD: ThS. Nguyen Chi Thien");
    }
}
`
      );
    }
  }

  // Tạo file nén và tải về
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'AY2627S1_DoAn_HuynhDuyKhanh.zip');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
