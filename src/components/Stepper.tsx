/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UploadCloud, Cpu, CheckSquare, EyeOff, BarChart3, Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxAccessibleStep: number;
}

const steps = [
  { step: 1, title: 'Tải dữ liệu', subtitle: 'Upload Data', icon: UploadCloud },
  { step: 2, title: 'Cấu hình & Khai thác', subtitle: 'Configure & Mine', icon: Cpu },
  { step: 3, title: 'Chọn tập nhạy cảm', subtitle: 'Select Sensitive', icon: CheckSquare },
  { step: 4, title: 'Ẩn dữ liệu', subtitle: 'Sanitize', icon: EyeOff },
  { step: 5, title: 'Báo cáo & Xuất kết quả', subtitle: 'Report & Export', icon: BarChart3 },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick, maxAccessibleStep }) => {
  return (
    <div className="w-full bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="max-w-7xl mx-auto">
        <nav aria-label="Progress">
          <ol className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {steps.map((item) => {
              const Icon = item.icon;
              const isCurrent = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              const isAccessible = item.step <= maxAccessibleStep;

              return (
                <li key={item.step} className="relative">
                  <button
                    onClick={() => isAccessible && onStepClick(item.step)}
                    disabled={!isAccessible}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isCurrent
                        ? 'bg-blue-50/80 border-2 border-blue-600 shadow-sm'
                        : isCompleted
                        ? 'bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer'
                        : isAccessible
                        ? 'bg-white border border-slate-200 hover:border-slate-300 cursor-pointer'
                        : 'bg-white border border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold ${
                            isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-600'
                          }`}
                        >
                          Bước {item.step}
                        </span>
                      </div>
                      <p
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent ? 'text-blue-950' : 'text-slate-800'
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
