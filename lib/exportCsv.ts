/**
 * Utility to export an array of data objects to CSV and download it in the browser.
 */
export function exportToCsv(filename: string, headers: string[], rows: Record<string, any>[]) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  // Filter out non-exportable technical headers
  const exportHeaders = headers.filter(h => h !== 'actions');

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const stringVal = String(str).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const csvRows: string[] = [];

  // Header row
  csvRows.push(exportHeaders.map(escapeCsv).join(','));

  // Data rows
  for (const row of rows) {
    const values = exportHeaders.map((header) => {
      const val = row[header] ?? '';
      return escapeCsv(val);
    });
    csvRows.push(values.join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Excel support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
