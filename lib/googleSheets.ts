import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Config variables
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newlines
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
    throw new Error('Missing Google Sheets environment variables');
}

const auth = new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SHEET_ID, auth);

let isLoaded = false;

export async function getSheet() {
    if (!isLoaded) {
        await doc.loadInfo();
        isLoaded = true;
    }
    return doc.sheetsByIndex[0]; // Default to the first sheet
}

/** Formats a readable timestamp for Google Sheets and UI */
export function getFormattedTimestamp(): string {
    const now = new Date();
    return now.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    });
}

/** Ensures 'Last Updated Time' header column exists in Google Sheets */
export async function ensureLastUpdatedHeader(sheet: any) {
    try {
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues || [];
        const hasHeader = headers.some((h: string) => 
            h.toLowerCase() === 'last updated time' || 
            h.toLowerCase() === 'last updated'
        );
        if (!hasHeader) {
            const newHeaders = [...headers, 'Last Updated Time'];
            if (newHeaders.length > sheet.columnCount) {
                await sheet.updateGridProperties({ columnCount: newHeaders.length + 5 });
            }
            await sheet.setHeaderRow(newHeaders);
        }
    } catch (e) {
        console.warn('[GoogleSheets] Note: Could not auto-modify header row:', e);
    }
}

export async function addRow(row: Record<string, string | number | boolean>) {
    const sheet = await getSheet();
    await ensureLastUpdatedHeader(sheet);

    // Auto-generate Sl No.
    const rows = await sheet.getRows();
    let maxSlNo = 0;

    rows.forEach(r => {
        const sl = parseInt(r.get('Sl No.'));
        if (!isNaN(sl) && sl > maxSlNo) {
            maxSlNo = sl;
        }
    });

    row['Sl No.'] = maxSlNo + 1;
    row['Last Updated Time'] = getFormattedTimestamp();

    await sheet.addRow(row);
}

export async function updateRow(slNo: string | number, updates: Record<string, any>) {
    const sheet = await getSheet();
    await ensureLastUpdatedHeader(sheet);

    const rows = await sheet.getRows();

    const row = rows.find(r => {
        const val = r.get('Sl No.');
        if (r.rowNumber < 5) console.log(`[GoogleSheets] Row ${r.rowNumber} Sl No:`, val);
        return String(val) === String(slNo);
    });

    if (!row) {
        console.error(`[GoogleSheets] Row not found. Searched for: ${slNo}`);
        console.error(`[GoogleSheets] Available headers:`, sheet.headerValues);
        if (rows.length > 0) {
            console.error(`[GoogleSheets] First row 'Sl No.':`, rows[0].get('Sl No.'));
        }
        throw new Error(`Row with Sl No. ${slNo} not found`);
    }

    // Update fields
    Object.keys(updates).forEach(key => {
        if (key !== 'Sl No.') { // Don't update ID
            row.set(key, updates[key]);
        }
    });

    // Record Last Updated Time
    row.set('Last Updated Time', getFormattedTimestamp());

    await row.save();
}

export async function getRows() {
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    return rows.map((row) => row.toObject());
}

export async function getHeaders() {
    const sheet = await getSheet();
    await ensureLastUpdatedHeader(sheet);
    return sheet.headerValues;
}

export async function getCredentials() {
    if (!isLoaded) {
        await doc.loadInfo();
        isLoaded = true;
    }
    const sheet = doc.sheetsByTitle['cred'];
    if (!sheet) {
        console.warn("Sheet 'cred' not found.");
        return [];
    }
    const rows = await sheet.getRows();
    return rows.map((row) => row.toObject());
}
