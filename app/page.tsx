'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { CandidateDrawer } from '@/components/CandidateDrawer';
import { ColumnVisibilityModal } from '@/components/ColumnVisibilityModal';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';
import { Eye, Edit3, FileText } from 'lucide-react';

type DataRow = Record<string, any>;

function DataPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({ totalPages: 1, page: 1, total: 0 });

  // Drawer & Modals state
  const [selectedCandidate, setSelectedCandidate] = useState<DataRow | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem('table_hidden_columns');
      if (savedHidden) {
        setHiddenColumns(JSON.parse(savedHidden));
      }
      const savedDensity = localStorage.getItem('table_density');
      if (savedDensity === 'compact' || savedDensity === 'comfortable') {
        setDensity(savedDensity);
      }
    } catch (e) {
      console.warn('Could not read table preferences from localStorage');
    }
  }, []);

  const handleToggleColumn = (col: string) => {
    setHiddenColumns((prev) => {
      const next = prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col];
      localStorage.setItem('table_hidden_columns', JSON.stringify(next));
      return next;
    });
  };

  const handleResetColumns = () => {
    setHiddenColumns([]);
    localStorage.removeItem('table_hidden_columns');
  };

  const handleShowAllColumns = () => {
    setHiddenColumns([]);
    localStorage.setItem('table_hidden_columns', JSON.stringify([]));
  };

  const handleToggleDensity = () => {
    const next = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(next);
    localStorage.setItem('table_density', next);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const res = await fetch(`/api/data?${params.toString()}`);
        const result = await res.json();

        if (result.data) {
          setData(result.data);
          setMeta({
            totalPages: result.meta?.totalPages || 1,
            page: result.meta?.page || 1,
            total: result.meta?.total || result.data.length,
          });

          const rawHeaders =
            result.headers || (result.data.length > 0 ? Object.keys(result.data[0]) : []);
          setHeaders(rawHeaders);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Generate TanStack Columns dynamically from headers
  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (!headers.length) return [];

    const visibleHeaders = headers.filter((h) => !hiddenColumns.includes(h));

    const cols: ColumnDef<DataRow>[] = visibleHeaders.map((key) => {
      const lowerKey = key.toLowerCase();
      const isImage =
        lowerKey.includes('photo upload') ||
        lowerKey.includes('passport copy front') ||
        lowerKey.includes('passport copy back') ||
        lowerKey.includes('photo (passport size)') ||
        lowerKey.includes('passport photo (front)') ||
        lowerKey.includes('passport photo (back)') ||
        lowerKey.includes('aadhar image') ||
        lowerKey.includes('pancard image') ||
        lowerKey.includes('bank pasbook') ||
        lowerKey.includes('medical documents');

      const isMedical = lowerKey.includes('medical status') || lowerKey.includes('fitness');
      const isTicket = lowerKey.includes('ticket status');
      const isPassport = lowerKey.includes('passport no');

      return {
        accessorFn: (row: DataRow) => row[key],
        id: key,
        header: key,
        cell: ({ getValue, row }: any) => {
          const val = getValue();

          // Image / PDF thumbnail cell
          if (isImage && val && typeof val === 'string' && val.startsWith('http')) {
            const isPdf = val.toLowerCase().endsWith('.pdf') || val.includes('.pdf');
            if (isPdf) {
              return (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(val, '_blank');
                  }}
                  className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-100 cursor-pointer transition-colors shadow-xs"
                  title="View PDF"
                >
                  <FileText className="h-4 w-4" />
                </div>
              );
            }

            return (
              <div
                className="h-9 w-9 relative overflow-hidden rounded-lg border border-slate-200 shadow-xs bg-slate-100 shrink-0 group/img"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCandidate(row.original);
                }}
              >
                <img
                  src={val}
                  alt={key}
                  className="object-cover w-full h-full group-hover/img:scale-110 transition-transform duration-200 cursor-pointer"
                />
              </div>
            );
          }

          // Medical Status badge
          if (isMedical && val) {
            const isFit =
              String(val).toLowerCase().includes('fit') &&
              !String(val).toLowerCase().includes('unfit');
            const isUnfit = String(val).toLowerCase().includes('unfit');

            return (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isFit
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isUnfit
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isFit ? 'bg-emerald-500' : isUnfit ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
                {String(val)}
              </span>
            );
          }

          // Ticket status badge
          if (isTicket && val) {
            const isBooked =
              String(val).toLowerCase().includes('booked') ||
              String(val).toLowerCase().includes('issued');
            return (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                  isBooked
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {String(val)}
              </span>
            );
          }

          // Passport font mono
          if (isPassport && val) {
            return (
              <span className="font-mono font-medium text-slate-800">{String(val)}</span>
            );
          }

          if (val === null || val === undefined || val === '') {
            return <span className="text-slate-300">—</span>;
          }

          return <span className="truncate block">{String(val)}</span>;
        },
      };
    });

    // Pinned Actions Column
    cols.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const slNo = row.original['Sl No.'] || row.original['Sl No'];
        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* View Details Drawer button */}
            <button
              onClick={() => setSelectedCandidate(row.original)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
              title="View Candidate Details"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* Edit Candidate link */}
            <Link
              href={`/edit?id=${slNo}`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Edit Candidate"
            >
              <Edit3 className="h-4 w-4" />
            </Link>
          </div>
        );
      },
    });

    return cols;
  }, [headers, hiddenColumns]);

  return (
    <div className="space-y-4">
      {/* Upgraded Data Table */}
      <DataTable
        columns={columns}
        data={data}
        rawHeaders={headers}
        pageCount={meta.totalPages}
        totalRecords={meta.total}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedCandidate(row)}
        onOpenColumnModal={() => setIsColumnModalOpen(true)}
        hiddenColumnsCount={hiddenColumns.length}
        density={density}
        onToggleDensity={handleToggleDensity}
      />

      {/* Candidate Detail Slide-Over Drawer */}
      <CandidateDrawer
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
      />

      {/* Column Customization Modal */}
      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        allColumns={headers}
        hiddenColumns={hiddenColumns}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        onShowAllColumns={handleShowAllColumns}
        density={density}
        onChangeDensity={(d) => {
          setDensity(d);
          localStorage.setItem('table_density', d);
        }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <span className="text-sm font-medium text-slate-500">Loading Dashboard...</span>
        </div>
      }
    >
      <DataPage />
    </Suspense>
  );
}
