'use client';

import { useState } from 'react';
import { Columns3, Check, X, Search, RotateCcw } from 'lucide-react';

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: string[];
  hiddenColumns: string[];
  onToggleColumn: (col: string) => void;
  onResetColumns: () => void;
  onShowAllColumns: () => void;
  density: 'comfortable' | 'compact';
  onChangeDensity: (d: 'comfortable' | 'compact') => void;
}

export function ColumnVisibilityModal({
  isOpen,
  onClose,
  allColumns,
  hiddenColumns,
  onToggleColumn,
  onResetColumns,
  onShowAllColumns,
  density,
  onChangeDensity,
}: ColumnVisibilityModalProps) {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const filteredColumns = allColumns.filter((col) =>
    col.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Columns3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Customize Table View</h2>
              <p className="text-xs text-slate-500">Choose visible columns and row density</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Density Control */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Row Spacing & Density</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => onChangeDensity('comfortable')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                density === 'comfortable'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comfortable
            </button>
            <button
              onClick={() => onChangeDensity('compact')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                density === 'compact'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compact
            </button>
          </div>
        </div>

        {/* Search Columns */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search columns..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          <div className="grid grid-cols-1 gap-1">
            {filteredColumns.map((col) => {
              const isHidden = hiddenColumns.includes(col);
              const isEssential = col.toLowerCase().includes('sl no') || col.toLowerCase() === 'actions';

              return (
                <label
                  key={col}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                    isEssential
                      ? 'opacity-60 cursor-not-allowed bg-slate-50'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="font-medium truncate pr-2">
                    {col} {isEssential && <span className="text-[10px] text-slate-400">(Always visible)</span>}
                  </span>

                  <input
                    type="checkbox"
                    checked={!isHidden}
                    disabled={isEssential}
                    onChange={() => !isEssential && onToggleColumn(col)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </label>
              );
            })}

            {filteredColumns.length === 0 && (
              <p className="text-center py-6 text-xs text-slate-400">
                No matching columns found.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onResetColumns}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Default
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onShowAllColumns}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Show All
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
