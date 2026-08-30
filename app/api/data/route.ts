import { NextRequest, NextResponse } from 'next/server';
import { getRows, addRow } from '@/lib/googleSheets';
import { getCache, setCache, clearCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
    try {
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
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
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
