'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clearPrintRequest, getPrintRequest } from '@/lib/printPreview';
import styles from './preview.module.css';

const paperSizes = {
  A0: [841, 1189],
  A1: [594, 841],
  A2: [420, 594],
  A3: [297, 420],
  A4: [210, 297],
  A5: [148, 210],
  A6: [105, 148],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  Tabloid: [279.4, 431.8],
} as const;

const textSizes = [6, 7, 8, 9, 10, 11, 12];

type PaperSize = keyof typeof paperSizes;
type Orientation = 'portrait' | 'landscape';

const controlClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600';

export default function PrintPreviewPage() {
  const [request] = useState(getPrintRequest);
  const [selectedHeaders, setSelectedHeaders] = useState(() => new Set(request?.visibleHeaders));
  const [paper, setPaper] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [textSize, setTextSize] = useState(9);

  useEffect(() => {
    clearPrintRequest(request);
  }, [request]);

  if (!request) {
    return (
      <main className="mx-auto max-w-lg space-y-4 p-6">
        <h1 className="text-xl font-semibold">Print preview</h1>
        <p className="text-sm text-slate-600">Choose records from the table to open a preview.</p>
        <Link className="text-sm font-semibold text-indigo-700 underline" href="/">Back to records</Link>
      </main>
    );
  }

  const columns = request.headers.filter((header) => selectedHeaders.has(header));
  const [shortSide, longSide] = paperSizes[paper];
  const [width, height] = orientation === 'portrait' ? [shortSide, longSide] : [longSide, shortSide];
  const hasDocument = columns.length > 0 && request.rows.length > 0;

  return (
    <main className={styles.preview}>
      <style media="print">{`@page { size: ${width}mm ${height}mm; margin: 12mm; }`}</style>
      <header className={styles.toolbar}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href={request.returnHref} className="text-sm font-semibold text-indigo-700 hover:underline">
              Back to records
            </Link>
            <h1 className="mt-1 text-xl font-semibold">
              {request.mode === 'pdf' ? 'PDF preview' : 'Print preview'}
            </h1>
            <p className="text-sm text-slate-600">{request.rows.length.toLocaleString()} records</p>
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <details className="relative">
              <summary
                className={`${controlClass} cursor-pointer`}
                title="Show or hide columns for this document"
              >
                Columns <span className="ml-1 tabular-nums text-slate-600">{columns.length}</span>
              </summary>
              <fieldset className="absolute z-10 mt-2 max-h-72 w-60 max-w-[80vw] space-y-1 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <legend className="sr-only">Columns in the preview</legend>
                {request.headers.map((header) => {
                  const checked = selectedHeaders.has(header);
                  return (
                    <label
                      key={header}
                      className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                      title={checked && selectedHeaders.size === 1 ? 'Keep at least one column in the document' : undefined}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-indigo-600"
                        checked={checked}
                        disabled={checked && selectedHeaders.size === 1}
                        onChange={(event) => {
                          const next = new Set(selectedHeaders);
                          if (event.target.checked) next.add(header);
                          else next.delete(header);
                          setSelectedHeaders(next);
                        }}
                      />
                      <span className="min-w-0 break-words">{header}</span>
                    </label>
                  );
                })}
              </fieldset>
            </details>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600" title="Set the document’s paper size">
              Paper size
              <select className={controlClass} value={paper} onChange={(event) => setPaper(event.target.value as PaperSize)}>
                {Object.keys(paperSizes).map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600" title="Choose a vertical or horizontal page">
              Orientation
              <select className={controlClass} value={orientation} onChange={(event) => setOrientation(event.target.value as Orientation)}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600" title="Set the text size for table headings and records">
              Text size
              <select className={controlClass} value={textSize} onChange={(event) => setTextSize(Number(event.target.value))}>
                {textSizes.map((size) => <option key={size} value={size}>{size} pt</option>)}
              </select>
            </label>

            <button
              type="button"
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-45"
              disabled={!hasDocument}
              title={request.mode === 'pdf' ? 'Choose Save as PDF in the browser’s print dialog' : 'Open the browser’s print dialog'}
              onClick={() => window.print()}
            >
              {request.mode === 'pdf' ? 'Save as PDF' : 'Print'}
            </button>
          </div>
        </div>
      </header>

      <div className={styles.canvas}>
        <article className={styles.sheet} style={{ width: `${width}mm`, minHeight: `${height}mm` }} aria-label="Document preview">
          {hasDocument ? (
            <table className={styles.records} style={{ fontSize: `${textSize}pt` }}>
              <thead>
                <tr>{columns.map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {request.rows.map((row, index) => (
                  <tr key={index}>
                    {columns.map((heading) => <td key={heading}>{String(row[heading] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>
              {request.rows.length ? 'Choose at least one column to preview these records.' : 'No records to preview.'}
            </p>
          )}
        </article>
      </div>
    </main>
  );
}
