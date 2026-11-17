export type ExportRow = Record<string, unknown>;

type PrintRequest = {
  mode: 'pdf' | 'print';
  rows: ExportRow[];
  headers: string[];
  visibleHeaders: string[];
  returnHref: string;
};

// Keep the snapshot in this tab's memory across client-side navigation.
let printRequest: PrintRequest | null = null;

export function setPrintRequest(request: PrintRequest) {
  printRequest = request;
}

export function getPrintRequest() {
  return printRequest;
}

export function clearPrintRequest(request: PrintRequest | null) {
  if (printRequest === request) printRequest = null;
}
