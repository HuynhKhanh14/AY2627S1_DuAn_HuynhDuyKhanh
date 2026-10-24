/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, GuideModal } from './components/Header';
import { Stepper } from './components/Stepper';
import { Footer } from './components/Footer';
import { Step1Upload } from './components/Step1Upload';
import { Step2Mining } from './components/Step2Mining';
import { Step3Sensitive } from './components/Step3Sensitive';
import { Step4Sanitize } from './components/Step4Sanitize';
import { Step5Report } from './components/Step5Report';
import {
  Transaction,
  DatasetStats,
  RawDataRow,
  ItemMetadata,
  Itemset,
  MiningAlgorithm,
  SanitizationResult,
} from './types';
import { fetchSampleDataset } from './lib/api';

export default function App() {
  // Navigation & Step state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(1);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Step 1 State: Dataset & Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [previewRows, setPreviewRows] = useState<RawDataRow[]>([]);
  const [itemMetadataMap, setItemMetadataMap] = useState<Map<string, ItemMetadata>>(new Map());
  const [rawRows, setRawRows] = useState<RawDataRow[]>([]);

  // Step 2 State: Rare Itemset Mining
  const [allRareItemsets, setAllRareItemsets] = useState<Itemset[]>([]);
  const [miningTime, setMiningTime] = useState<number | null>(null);
  const [maxSupportRatio, setMaxSupportRatio] = useState<number>(0.01);
  const [miningAlgorithm, setMiningAlgorithm] = useState<MiningAlgorithm>('branch_and_bound');

  // Step 3 State: Sensitive Itemset Selection
  const [selectedSensitiveIds, setSelectedSensitiveIds] = useState<Set<string>>(new Set());

  // Step 4 & 5 State: Sanitization Result
  const [sanitizationResult, setSanitizationResult] = useState<SanitizationResult | null>(null);

  // Tự động tải sẵn dữ liệu mẫu khi khởi động để người dùng có thể trải nghiệm ngay
  useEffect(() => {
    async function loadInitialSample() {
      try {
        const result = await fetchSampleDataset();
        if (result.success) {
          setTransactions(result.transactions);
          setStats(result.stats);
          setPreviewRows(result.previewRows);
          setItemMetadataMap(result.itemMetadataMap);
          setRawRows(result.rawRows);
          setMaxAccessibleStep(2);
        }
      } catch (err) {
        console.warn('Could not auto-load sample data:', err);
      }
    }
    loadInitialSample();
  }, []);

  /**
   * Cập nhật dữ liệu từ Bước 1
   */
  const handleDataLoaded = (
    newTransactions: Transaction[],
    newStats: DatasetStats,
    newPreviewRows: RawDataRow[],
    newItemMetaMap: Map<string, ItemMetadata>,
    newRawRows: RawDataRow[]
  ) => {
    setTransactions(newTransactions);
    setStats(newStats);
    setPreviewRows(newPreviewRows);
    setItemMetadataMap(newItemMetaMap);
    setRawRows(newRawRows);

    // Reset các bước sau
    setAllRareItemsets([]);
    setMiningTime(null);
    setSelectedSensitiveIds(new Set());
    setSanitizationResult(null);
    setMaxAccessibleStep(2);
  };

  /**
   * Cập nhật kết quả khai thác từ Bước 2
   */
  const handleMiningCompleted = (
    itemsets: Itemset[],
    executionTime: number,
    maxSupport: number,
    algorithm: MiningAlgorithm
  ) => {
    setAllRareItemsets(itemsets);
    setMiningTime(executionTime);
    setMaxSupportRatio(maxSupport);
    setMiningAlgorithm(algorithm);

    // Mặc định chọn trước 3 tập hiếm đầu tiên làm tập nhạy cảm gợi ý
    const initialSensitive = new Set<string>();
    itemsets.slice(0, 3).forEach((it) => initialSensitive.add(it.id));
    setSelectedSensitiveIds(initialSensitive);

    setMaxAccessibleStep(3);
  };

  /**
   * Xử lý chọn/bỏ chọn tập nhạy cảm ở Bước 3
   */
  const handleToggleSensitive = (id: string) => {
    setSelectedSensitiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllSensitive = () => {
    const allIds = new Set(allRareItemsets.map((it) => it.id));
    setSelectedSensitiveIds(allIds);
  };

  const handleDeselectAllSensitive = () => {
    setSelectedSensitiveIds(new Set());
  };

  const handleSelectTopRare = (count: number) => {
    const topIds = new Set(allRareItemsets.slice(0, count).map((it) => it.id));
    setSelectedSensitiveIds(topIds);
  };

  /**
   * Cập nhật kết quả khử mẫn cảm từ Bước 4
   */
  const handleSanitizeCompleted = (result: SanitizationResult) => {
    setSanitizationResult(result);
    setMaxAccessibleStep(5);
  };

  /**
   * Chạy lại thí nghiệm (Reset về Bước 1)
   */
  const handleResetExperiment = () => {
    setCurrentStep(1);
  };

  // Danh sách các tập nhạy cảm đã chọn
  const sensitiveItemsetsList = allRareItemsets.filter((it) =>
    selectedSensitiveIds.has(it.id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <Header onOpenGuide={() => setIsGuideOpen(true)} />

      {/* 5-Step Stepper Component */}
      <Stepper
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
        maxAccessibleStep={maxAccessibleStep}
      />

      {/* Main Body Flow */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <Step1Upload
            transactions={transactions}
            stats={stats}
            previewRows={previewRows}
            itemMetadataMap={itemMetadataMap}
            onDataLoaded={handleDataLoaded}
            onNext={() => {
              setMaxAccessibleStep((m) => Math.max(m, 2));
              setCurrentStep(2);
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2Mining
            transactions={transactions}
            itemMetadataMap={itemMetadataMap}
            allRareItemsets={allRareItemsets}
            miningTime={miningTime}
            maxSupportRatio={maxSupportRatio}
            selectedAlgorithm={miningAlgorithm}
            onMiningCompleted={handleMiningCompleted}
            onNext={() => {
              setMaxAccessibleStep((m) => Math.max(m, 3));
              setCurrentStep(3);
            }}
            onPrev={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Sensitive
            allRareItemsets={allRareItemsets}
            selectedSensitiveIds={selectedSensitiveIds}
            onToggleSensitive={handleToggleSensitive}
            onSelectAll={handleSelectAllSensitive}
            onDeselectAll={handleDeselectAllSensitive}
            onSelectTopRare={handleSelectTopRare}
            onNext={() => {
              setMaxAccessibleStep((m) => Math.max(m, 4));
              setCurrentStep(4);
            }}
            onPrev={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4Sanitize
            originalTransactions={transactions}
            sensitiveItemsets={sensitiveItemsetsList}
            allRareItemsets={allRareItemsets}
            maxSupportRatio={maxSupportRatio}
            lastSanitizationResult={sanitizationResult}
            onSanitizeCompleted={handleSanitizeCompleted}
            onNext={() => {
              setMaxAccessibleStep((m) => Math.max(m, 5));
              setCurrentStep(5);
            }}
            onPrev={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && sanitizationResult && (
          <Step5Report
            sanitizationResult={sanitizationResult}
            originalTransactions={transactions}
            sensitiveItemsets={sensitiveItemsetsList}
            allRareItemsets={allRareItemsets}
            itemMetadataMap={itemMetadataMap}
            maxSupportRatio={maxSupportRatio}
            miningAlgorithm={miningAlgorithm}
            onResetExperiment={handleResetExperiment}
            onPrev={() => setCurrentStep(4)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* User Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
