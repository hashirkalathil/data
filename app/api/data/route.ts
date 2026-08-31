import { NextRequest, NextResponse } from 'next/server';
import { getRows, addRow } from '@/lib/googleSheets';
import { getCache, setCache, clearCache } from '@/lib/cache';
import { getSettings } from '@/lib/settings';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Enforce Authentication
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search')?.toLowerCase() || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        let data = getCache();

        if (!data) {
            console.log('Cache miss. Fetching from Google Sheets...');
            data = await getRows();
            setCache(data);
        } else {
            console.log('Cache hit.');
        }

        // Filter
        let filteredData = data;

        // Retrieve settings for old data visibility
        const settings = getSettings();
        const includeOld = searchParams.get('includeOld') === 'true';
        const totalBeforeOldFilter = data.length;
        let hiddenCount = 0;

        if (settings.hideOldData && !includeOld) {
            filteredData = filteredData.filter((row: any) => {
                let isHidden = false;
                const sl = parseInt(row['Sl No.'] || row['Sl No'] || '0');

                if (settings.cutoffMode === 'slNo' && settings.cutoffSlNo > 0) {
                    if (sl < settings.cutoffSlNo) {
                        isHidden = true;
                    }
                }

                if (settings.cutoffMode === 'date' && settings.cutoffDate) {
                    const dateVal = row['Created Date'] || row['Date'] || row['Entry Date'] || row['Submission Date'];
                    if (dateVal && String(dateVal) < settings.cutoffDate) {
                        isHidden = true;
                    }
                }

                if (settings.respectArchivedColumn) {
                    const archivedVal = String(row['Archived'] || row['archived'] || row['Status'] || '').toLowerCase().trim();
                    if (archivedVal === 'true' || archivedVal === 'yes' || archivedVal === 'archived' || archivedVal === '1') {
                        isHidden = true;
                    }
                }

                if (isHidden) {
                    hiddenCount++;
                    return false;
                }
                return true;
            });
        }

        // Single ID fetch
        // Single ID fetch
        const id = searchParams.get('id');
        if (id) {
            const { getHeaders } = await import('@/lib/googleSheets');
            const headers = await getHeaders();

            console.log(`[API] Fetching ID: "${id}"`);
            if (data.length > 0) {
                console.log(`[API] First row keys:`, Object.keys(data[0]));
                console.log(`[API] First row Sl No:`, data[0]['Sl No.'], data[0]['Sl No']);
            }

            const row = data.find((r: any) => String(r['Sl No.'] || r['Sl No']) === id);

            if (!row) console.log(`[API] Row not found for ID: ${id}`);
            else console.log(`[API] Row found.`);

            return NextResponse.json({
                data: row ? [row] : [], // Return array for consistency
                headers
            });
        }

        if (search) {
            filteredData = data.filter((row: any) =>
                Object.values(row).some((val) =>
                    String(val).toLowerCase().includes(search)
                )
            );
        }

        // Extract available filter options from dataset
        const countriesSet = new Set<string>();
        const tradesSet = new Set<string>();
        const agentsSet = new Set<string>();

        data.forEach((row: any) => {
            const country = row['Country Applied For'] || row['Country Applied'] || row['Country'];
            if (country && typeof country === 'string' && country.trim()) {
                countriesSet.add(country.trim());
            }

            const trade = row['Trade'] || row['Trade / Job Category'] || row['Profession'];
            if (trade && typeof trade === 'string' && trade.trim()) {
                tradesSet.add(trade.trim());
            }

            const agent = row['Agent Name'] || row['Sub Agent Name'] || row['Collected by'] || row['Agent'];
            if (agent && typeof agent === 'string' && agent.trim()) {
                agentsSet.add(agent.trim());
            }
        });

        // Specific Field Filters
        const countryFilter = searchParams.get('country')?.toLowerCase();
        const tradeFilter = searchParams.get('trade')?.toLowerCase();
        const agentFilter = searchParams.get('agent')?.toLowerCase();

        if (countryFilter) {
            filteredData = filteredData.filter((row: any) => {
                const country = String(row['Country Applied For'] || row['Country Applied'] || row['Country'] || '').toLowerCase();
                return country === countryFilter || country.includes(countryFilter);
            });
        }

        if (tradeFilter) {
            filteredData = filteredData.filter((row: any) => {
                const trade = String(row['Trade'] || row['Trade / Job Category'] || row['Profession'] || '').toLowerCase();
                return trade === tradeFilter || trade.includes(tradeFilter);
            });
        }

        if (agentFilter) {
            filteredData = filteredData.filter((row: any) => {
                const agent = String(row['Agent Name'] || row['Sub Agent Name'] || row['Collected by'] || row['Agent'] || '').toLowerCase();
                return agent === agentFilter || agent.includes(agentFilter);
            });
        }

        // Global Sorting
        const sortBy = searchParams.get('sortBy');
        const sortOrder = searchParams.get('sortOrder') || 'asc'; // 'asc' or 'desc'

        if (sortBy) {
            filteredData = [...filteredData].sort((a: any, b: any) => {
                const valA = a[sortBy] ?? '';
                const valB = b[sortBy] ?? '';

                // Handle numeric sorting (e.g. Sl No, amounts)
                const numA = Number(valA);
                const numB = Number(valB);
                if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                    return sortOrder === 'desc' ? numB - numA : numA - numB;
                }

                // Handle string sorting case-insensitively with natural sort
                const comp = String(valA).localeCompare(String(valB), undefined, {
                    numeric: true,
                    sensitivity: 'base',
                });
                return sortOrder === 'desc' ? -comp : comp;
            });
        }

        // Pagination
        const total = filteredData.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        // Fetch headers to ensure frontend can get them even if data is empty
        const { getHeaders } = await import('@/lib/googleSheets');
        const headers = await getHeaders();

        return NextResponse.json({
            data: paginatedData,
            headers,
            filterOptions: {
                countries: Array.from(countriesSet).sort(),
                trades: Array.from(tradesSet).sort(),
                agents: Array.from(agentsSet).sort(),
            },
            meta: {
                total,
                allTotal: totalBeforeOldFilter,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                isFilteringOld: settings.hideOldData && !includeOld,
                hiddenCount,
                allowAdminViewAll: settings.allowAdminViewAll,
            },
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Basic validation could happen here or in the library
        await addRow(body);

        // Invalidate cache so next read fetches fresh data
        clearCache();

        return NextResponse.json({ success: true, message: 'Row added successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { slNo, data } = body;

        if (!slNo) {
            return NextResponse.json({ error: 'Sl No. is required' }, { status: 400 });
        }

        const { updateRow } = await import('@/lib/googleSheets');
        await updateRow(slNo, data);

        clearCache();

        return NextResponse.json({ success: true, message: 'Row updated successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
