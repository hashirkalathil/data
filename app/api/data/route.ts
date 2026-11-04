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

        const ignoreFilters = searchParams.get('ignoreFilters') === 'true';

        // Retrieve settings for old data visibility
        const settings = getSettings();
        const includeOld = searchParams.get('includeOld') === 'true';
        const totalBeforeOldFilter = data.length;
        let hiddenCount = 0;

        if (!ignoreFilters && settings.hideOldData && !includeOld) {
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

        if (!ignoreFilters && search) {
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
        const statesSet = new Set<string>();
        const districtsSet = new Set<string>();
        const stateDistrictMap: Record<string, Set<string>> = {};

        const getRowVal = (row: any, candidates: string[]) => {
            for (const key of candidates) {
                if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                    return String(row[key]).trim();
                }
            }
            const rowKeys = Object.keys(row);
            for (const cand of candidates) {
                const lowerCand = cand.toLowerCase();
                const matchedKey = rowKeys.find(k => k.toLowerCase() === lowerCand);
                if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
                    return String(row[matchedKey]).trim();
                }
            }
            return '';
        };

        data.forEach((row: any) => {
            const country = getRowVal(row, ['Country Applied For', 'Country Applied', 'Country']);
            if (country) {
                countriesSet.add(country);
            }

            const trade = getRowVal(row, ['Trade', 'Trade / Job Category', 'Profession']);
            if (trade) {
                tradesSet.add(trade);
            }

            const agent = getRowVal(row, ['Agent Name', 'Sub Agent Name', 'Collected by', 'Agent']);
            if (agent) {
                agentsSet.add(agent);
            }

            const state = getRowVal(row, ['State']);
            const district = getRowVal(row, ['District']);

            if (state) {
                statesSet.add(state);
                if (district) {
                    if (!stateDistrictMap[state]) {
                        stateDistrictMap[state] = new Set<string>();
                    }
                    stateDistrictMap[state].add(district);
                }
            }

            if (district) {
                districtsSet.add(district);
            }
        });

        // Specific Field Filters
        if (!ignoreFilters) {
            const countryFilter = searchParams.get('country')?.toLowerCase()?.trim();
            const tradeFilter = searchParams.get('trade')?.toLowerCase()?.trim();
            const agentFilter = searchParams.get('agent')?.toLowerCase()?.trim();
            const stateFilter = searchParams.get('state')?.toLowerCase()?.trim();
            const districtFilter = searchParams.get('district')?.toLowerCase()?.trim();
            const pincodeFilter = searchParams.get('pincode')?.toLowerCase()?.trim();

            if (countryFilter) {
                filteredData = filteredData.filter((row: any) => {
                    const country = getRowVal(row, ['Country Applied For', 'Country Applied', 'Country']).toLowerCase();
                    return country === countryFilter || country.includes(countryFilter);
                });
            }

            if (tradeFilter) {
                filteredData = filteredData.filter((row: any) => {
                    const trade = getRowVal(row, ['Trade', 'Trade / Job Category', 'Profession']).toLowerCase();
                    return trade === tradeFilter || trade.includes(tradeFilter);
                });
            }

            if (agentFilter) {
                filteredData = filteredData.filter((row: any) => {
                    const agent = getRowVal(row, ['Agent Name', 'Sub Agent Name', 'Collected by', 'Agent']).toLowerCase();
                    return agent === agentFilter || agent.includes(agentFilter);
                });
            }

            if (stateFilter) {
                filteredData = filteredData.filter((row: any) => {
                    const state = getRowVal(row, ['State']).toLowerCase();
                    return state === stateFilter || state.includes(stateFilter);
                });
            }

            if (districtFilter) {
                filteredData = filteredData.filter((row: any) => {
                    const district = getRowVal(row, ['District']).toLowerCase();
                    return district === districtFilter || district.includes(districtFilter);
                });
            }

            if (pincodeFilter) {
                filteredData = filteredData.filter((row: any) => {
                    const pincode = getRowVal(row, ['Pin Code', 'Pincode', 'PIN Code', 'Pin', 'Postal Code']).toLowerCase();
                    return pincode.includes(pincodeFilter);
                });
            }
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

        // Pagination / Export All
        const total = filteredData.length;
        const exportAll = searchParams.get('all') === 'true' || searchParams.get('limit') === 'all';
        let paginatedData = filteredData;

        if (!exportAll) {
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            paginatedData = filteredData.slice(startIndex, endIndex);
        }

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
                states: Array.from(statesSet).sort(),
                districts: Array.from(districtsSet).sort(),
                stateDistrictMap: Object.fromEntries(
                    Object.entries(stateDistrictMap).map(([k, set]) => [k, Array.from(set).sort()])
                ),
            },
            meta: {
                total,
                allTotal: totalBeforeOldFilter,
                page,
                limit,
                totalPages: exportAll ? 1 : Math.ceil(total / limit),
                isFilteringOld: settings.hideOldData && !includeOld && !ignoreFilters,
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
