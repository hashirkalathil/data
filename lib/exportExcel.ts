import type { ExportRow } from './printPreview';

export async function downloadExcel(scope: string, headers: string[], rows: ExportRow[]) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Candidates', { views: [{ state: 'frozen', ySplit: 1 }] });

  sheet.addRow(headers).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(headers.map((header) => {
      const value = row[header];
      return value == null ? null : String(value);
    }));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `candidates_${scope}_${rows.length}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser time to start reading the download.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
