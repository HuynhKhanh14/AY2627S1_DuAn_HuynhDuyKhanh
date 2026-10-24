/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap, Award, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">PPRIM-Explorer: Privacy-Preserving Rare Itemset Mining</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              Sinh viên thực hiện: <strong className="text-blue-900">Huỳnh Duy Khánh - DA139</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              GVHD: <strong className="text-slate-900">ThS. Nguyễn Chí Thiện</strong>
            </span>
          </div>

          <div>
            <span>Khoa Công nghệ Thông tin &bull; Niên khóa 2026 - 2027</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
