'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  SlidersHorizontal,
  Download,
  Rows,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  CheckSquare,
  Square,
  MinusSquare,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rawHeaders: string[];
  pageCount: number;
  totalRecords?: number;
  isLoading: boolean;
  onRowClick?: (row: TData) => void;
  onOpenColumnModal?: () => void;
  hiddenColumnsCount?: number;
  density: 'comfortable' | 'compact';
  onToggleDensity: () => void;
  filterOptions?: {
    countries: string[];
    trades: string[];
    agents: string[];
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rawHeaders,
  pageCount,
  totalRecords = 0,
  isLoading,
  onRowClick,
  onOpenColumnModal,
  hiddenColumnsCount = 0,
  density,
  onToggleDensity,
  filterOptions,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Pagination parameters
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentLimit = parseInt(searchParams.get('limit') || '50');
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Sorting parameters
  const currentSortBy = searchParams.get('sortBy') || '';
  const currentSortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  // Row selection state (keyed by row identifier or index)
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});

  // Column Resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingCol = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  // Load saved column widths from localStorage
  useEffect(() => {
    try {
      const savedWidths = localStorage.getItem('table_col_widths');
      if (savedWidths) {
        setColumnWidths(JSON.parse(savedWidths));
      }
    } catch (e) {
      console.warn('Could not read column widths from localStorage');
    }
  }, []);

  // Quick Filter Popover State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const selectedCountry = searchParams.get('country') || '';
  const selectedTrade = searchParams.get('trade') || '';
  const selectedAgent = searchParams.get('agent') || '';
  const activeFilterCount = (selectedCountry ? 1 : 0) + (selectedTrade ? 1 : 0) + (selectedAgent ? 1 : 0);

  const handleFilterChange = (key: 'country' | 'trade' | 'agent', value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value) {
      current.set(key, value);
    } else {
      current.delete(key);
    }
    current.set('page', '1');
    router.push(`${window.location.pathname}?${current.toString()}`);
  };

  const handleClearAllFilters = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete('country');
    current.delete('trade');
    current.delete('agent');
    current.set('page', '1');
    router.push(`${window.location.pathname}?${current.toString()}`);
  };

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      const value = searchValue || '';

      if (currentSearch !== value) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (value) {
          current.set('search', value);
        } else {
          current.delete('search');
        }
        current.set('page', '1');

        const search = current.toString();
        router.push(`${window.location.pathname}${search ? `?${search}` : ''}`);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchValue, router, searchParams]);

  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);

  // Reset row selection when page or search changes
  useEffect(() => {
    setSelectedRowIds({});
  }, [currentPage, searchValue]);

  // Navigation handlers
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount || newPage === currentPage) return;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', String(newPage));
    router.push(`${window.location.pathname}?${current.toString()}`);
  };

  const handleLimitChange = (newLimit: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('limit', String(newLimit));
    current.set('page', '1');
    router.push(`${window.location.pathname}?${current.toString()}`);
  };

  const handleJumpPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pageCount) {
      handlePageChange(pageNum);
      setJumpPageInput('');
    }
  };

  // Sorting handler
  const handleSort = (columnId: string) => {
    if (columnId === 'actions' || columnId === 'select') return;

    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (currentSortBy === columnId) {
      if (currentSortOrder === 'asc') {
        current.set('sortOrder', 'desc');
      } else {
        // Toggle off / reset
        current.delete('sortBy');
        current.delete('sortOrder');
      }
    } else {
      current.set('sortBy', columnId);
      current.set('sortOrder', 'asc');
    }

    current.set('page', '1');
    router.push(`${window.location.pathname}?${current.toString()}`);
  };

  // Column Resizing mouse events
  const onMouseDownResize = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const thElement = (e.currentTarget.parentElement as HTMLElement);
    const startWidth = thElement ? thElement.offsetWidth : (columnWidths[colId] || 150);

    resizingCol.current = { colId, startX, startWidth };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingCol.current) return;
      const deltaX = moveEvent.clientX - resizingCol.current.startX;
      const newWidth = Math.max(70, resizingCol.current.startWidth + deltaX);

      setColumnWidths((prev) => {
        const next = { ...prev, [resizingCol.current!.colId]: newWidth };
        return next;
      });
    };

    const onMouseUp = () => {
      if (resizingCol.current) {
        setColumnWidths((current) => {
          localStorage.setItem('table_col_widths', JSON.stringify(current));
          return current;
        });
      }
      resizingCol.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Row selection helpers
  const getRowId = (row: any, index: number) => String(row['Sl No.'] || row['Sl No'] || index);

  const isAllPageSelected = data.length > 0 && data.every((r, idx) => selectedRowIds[getRowId(r, idx)]);
  const isSomePageSelected = data.some((r, idx) => selectedRowIds[getRowId(r, idx)]) && !isAllPageSelected;

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedRowIds({});
    } else {
      const next: Record<string, boolean> = {};
      data.forEach((r, idx) => {
        next[getRowId(r, idx)] = true;
      });
      setSelectedRowIds(next);
    }
  };

  const handleToggleSelectRow = (rowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => {
      const next = { ...prev };
      if (next[rowId]) {
        delete next[rowId];
      } else {
        next[rowId] = true;
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selectedRowIds).filter((k) => selectedRowIds[k]).length;
  const selectedRows = data.filter((r, idx) => selectedRowIds[getRowId(r, idx)]);

  // Batch actions
  const handleExportSelected = () => {
    if (!selectedRows.length) return;
    exportToCsv(`candidates_selected_${selectedRows.length}`, rawHeaders, selectedRows as Record<string, any>[]);
  };

  const handlePrintSelected = () => {
    window.print();
  };

  const handleExportAll = () => {
    exportToCsv(`candidates_all`, rawHeaders, data as Record<string, any>[]);
  };

  // Dual scrollbar sync logic
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const isSyncingLeft = useRef(false);
  const isSyncingTop = useRef(false);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const topScroll = topScrollRef.current;
    if (!tableContainer || !topScroll) return;

    const handleTableScroll = () => {
      if (!isSyncingLeft.current) {
        isSyncingTop.current = true;
        topScroll.scrollLeft = tableContainer.scrollLeft;
      }
      isSyncingLeft.current = false;
    };

    const handleTopScroll = () => {
      if (!isSyncingTop.current) {
        isSyncingLeft.current = true;
        tableContainer.scrollLeft = topScroll.scrollLeft;
      }
      isSyncingTop.current = false;
    };

    const resizeObserver = new ResizeObserver(() => {
      setScrollWidth(tableContainer.scrollWidth);
    });
    resizeObserver.observe(tableContainer);
    setScrollWidth(tableContainer.scrollWidth);

    tableContainer.addEventListener('scroll', handleTableScroll);
    topScroll.addEventListener('scroll', handleTopScroll);

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll);
      topScroll.removeEventListener('scroll', handleTopScroll);
      resizeObserver.disconnect();
    };
  }, [data, columns, columnWidths]);

  // TanStack table setup
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const rangeEnd = Math.min(currentPage * currentLimit, totalRecords);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden relative">
      
      {/* Top Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-white">
        
        {/* Search Input with Clear Button and Shortcut hint */}
        <div className="relative w-full md:max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by passport, name, trade, etc..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-16 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchValue ? (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-400 shadow-2xs">
                Ctrl K
              </kbd>
            )}
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Quick Filter Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all ${
                activeFilterCount > 0
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-indigo-100'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className={`h-3.5 w-3.5 ${activeFilterCount > 0 ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Popover Dropdown */}
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">Filter Records</span>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="text-[11px] font-semibold text-rose-600 hover:underline"
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  {/* Country Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 block">Country</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">All Countries</option>
                      {filterOptions?.countries?.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Trade Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 block">Profession / Trade</label>
                    <select
                      value={selectedTrade}
                      onChange={(e) => handleFilterChange('trade', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">All Trades</option>
                      {filterOptions?.trades?.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Agent Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 block">Agent / Source</label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => handleFilterChange('agent', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">All Agents</option>
                      {filterOptions?.agents?.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Segmented View Control (Columns & Density + Auto-fit) */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
            {onOpenColumnModal && (
              <button
                type="button"
                onClick={onOpenColumnModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
                title="Customize visible columns"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span>Columns</span>
                {hiddenColumnsCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                    -{hiddenColumnsCount}
                  </span>
                )}
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button
              type="button"
              onClick={onToggleDensity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
              title={`Toggle density: currently ${density}`}
            >
              <Rows className="h-3.5 w-3.5 text-slate-500" />
              <span className="capitalize">{density}</span>
            </button>

            {Object.keys(columnWidths).length > 0 && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-0.5" />
                <button
                  type="button"
                  onClick={() => {
                    setColumnWidths({});
                    localStorage.removeItem('table_col_widths');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/60 rounded-lg text-xs font-semibold transition-colors"
                  title="Reset all column widths to default auto-fit"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Auto-fit</span>
                </button>
              </>
            )}
          </div>

          {/* Export CSV Action Button */}
          <button
            type="button"
            onClick={handleExportAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
            title="Export full table data to CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Total Candidates Live Status Badge */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-600 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              <span className="font-bold text-slate-900">{totalRecords}</span> Candidates
            </span>
          </div>

        </div>
      </div>

      {/* Top Synchronized Scrollbar */}
      <div
        ref={topScrollRef}
        className="overflow-x-auto border-b border-slate-100 bg-slate-50/40"
        style={{ height: '10px' }}
      >
        <div style={{ width: `${scrollWidth}px`, height: '1px' }} />
      </div>

      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto min-h-[460px] max-h-[calc(100vh-270px)]"
      >
        <table className="w-full text-left border-collapse table-auto">
          <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                
                {/* Selection Checkbox Header */}
                <th className="w-12 px-3 py-3 text-center sticky left-0 bg-slate-50/95 z-30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] border-r border-slate-200/60">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
                    title={isAllPageSelected ? 'Deselect all' : 'Select all on page'}
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                    ) : isSomePageSelected ? (
                      <MinusSquare className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>

                {headerGroup.headers.map((header) => {
                  const isActions = header.id === 'actions';
                  const isSlNo = header.id.toLowerCase().includes('sl no');
                  const isSorted = currentSortBy === header.id;
                  const customWidth = columnWidths[header.id];

                  return (
                    <th
                      key={header.id}
                      style={
                        customWidth
                          ? { width: `${customWidth}px`, minWidth: `${customWidth}px` }
                          : { minWidth: 'max-content' }
                      }
                      className={`px-4 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap select-none relative group transition-colors ${
                        isSorted ? 'bg-indigo-50/70 text-indigo-700' : 'text-slate-500'
                      } ${
                        density === 'compact' ? 'py-2.5' : 'py-3.5'
                      } ${
                        isSlNo
                          ? 'sticky left-12 bg-slate-50/95 z-30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] border-r border-slate-200/60'
                          : ''
                      } ${
                        isActions
                          ? 'sticky right-0 bg-slate-50/95 z-30 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] text-right border-l border-slate-200/60'
                          : ''
                      }`}
                    >
                      <div
                        onClick={() => handleSort(header.id)}
                        className={`flex items-center gap-2 ${
                          isActions ? 'justify-end' : 'justify-between'
                        } ${!isActions ? 'cursor-pointer hover:text-slate-900' : ''}`}
                        title={!isActions ? `Click to sort by ${header.id}` : undefined}
                      >
                        <span className="whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>

                        {!isActions && (
                          <span className="shrink-0 text-slate-400 group-hover:text-slate-700">
                            {isSorted ? (
                              currentSortOrder === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-indigo-600 font-bold" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-indigo-600 font-bold" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Draggable resize handle with double-click reset to auto-fit */}
                      {!isActions && (
                        <div
                          onMouseDown={(e) => onMouseDownResize(header.id, e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setColumnWidths((prev) => {
                              const next = { ...prev };
                              delete next[header.id];
                              localStorage.setItem('table_col_widths', JSON.stringify(next));
                              return next;
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/50 transition-colors z-40"
                          title="Drag to resize, double-click to auto-fit"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    <span className="text-sm font-medium text-slate-600">
                      Loading candidate records...
                    </span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => {
                const rowId = getRowId(row.original, idx);
                const isSelected = !!selectedRowIds[rowId];

                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (onRowClick) onRowClick(row.original);
                    }}
                    className={`group transition-colors duration-150 cursor-pointer select-none ${
                      isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Row Selection Checkbox */}
                    <td
                      className={`w-12 px-3 py-2.5 text-center sticky left-0 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] border-r border-slate-100 ${
                        isSelected ? 'bg-indigo-50/90' : 'bg-white group-hover:bg-slate-50'
                      }`}
                      onClick={(e) => handleToggleSelectRow(rowId, e)}
                    >
                      <button
                        type="button"
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {row.getVisibleCells().map((cell) => {
                      const isActions = cell.column.id === 'actions';
                      const isSlNo = cell.column.id.toLowerCase().includes('sl no');
                      const customWidth = columnWidths[cell.column.id];

                      return (
                        <td
                          key={cell.id}
                          style={customWidth ? { width: `${customWidth}px`, minWidth: `${customWidth}px` } : undefined}
                          className={`px-4 text-xs sm:text-sm text-slate-600 group-hover:text-slate-900 truncate ${
                            density === 'compact' ? 'py-2' : 'py-3'
                          } ${
                            isSlNo
                              ? `sticky left-12 font-bold text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] border-r border-slate-100 z-10 ${
                                  isSelected ? 'bg-indigo-50/90' : 'bg-white group-hover:bg-slate-50'
                                }`
                              : ''
                          } ${
                            isActions
                              ? `sticky right-0 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] border-l border-slate-100 text-right z-10 ${
                                  isSelected ? 'bg-indigo-50/90' : 'bg-white group-hover:bg-slate-50'
                                }`
                              : ''
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <Database className="h-10 w-10 text-slate-300" />
                    <span className="font-semibold text-slate-600">No candidates found</span>
                    <span className="text-xs text-slate-400">
                      Try adjusting your search criteria or resetting filters.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Pagination Bar */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left: Range and Rows Per Page Selector */}
        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
          <span>
            Showing <span className="font-semibold text-slate-900">{rangeStart}</span>–
            <span className="font-semibold text-slate-900">{rangeEnd}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalRecords}</span> entries
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rows per page:</span>
            <select
              value={currentLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>

        {/* Right: Page Navigation & Direct Jump */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Jump to Page Input */}
          <form onSubmit={handleJumpPageSubmit} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Go to:</span>
            <input
              type="number"
              min="1"
              max={pageCount || 1}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={String(currentPage)}
              className="w-12 px-2 py-1 rounded-lg border border-slate-200 bg-white text-center text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </form>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 text-xs font-bold text-slate-800">
              {currentPage} / {pageCount || 1}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pageCount || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => handlePageChange(pageCount)}
              disabled={currentPage >= pageCount || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Floating Batch Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold">{selectedCount} Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Export Selected
            </button>

            <button
              onClick={handlePrintSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>

            <button
              onClick={() => setSelectedRowIds({})}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
