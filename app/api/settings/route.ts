import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';
import { getRows } from '@/lib/googleSheets';
import { getCache, setCache, clearCache } from '@/lib/cache';
import { getSession } from '@/lib/auth';

async function getDataAndStats() {
  let data = getCache();
  if (!data) {
    data = await getRows();
    setCache(data);
  }

  const settings = getSettings();
  let maxSlNo = 0;
  let hiddenCount = 0;

  data.forEach((row: any) => {
    const sl = parseInt(row['Sl No.'] || row['Sl No'] || '0');
    if (!isNaN(sl) && sl > maxSlNo) {
      maxSlNo = sl;
    }

    if (settings.hideOldData) {
      let isHidden = false;
      if (settings.cutoffMode === 'slNo' && sl > 0 && sl < settings.cutoffSlNo) {
        isHidden = true;
      }
      if (settings.respectArchivedColumn) {
        const archivedVal = String(row['Archived'] || row['archived'] || row['Status'] || '').toLowerCase();
        if (archivedVal === 'true' || archivedVal === 'yes' || archivedVal === 'archived' || archivedVal === '1') {
          isHidden = true;
        }
      }
      if (isHidden) {
        hiddenCount++;
      }
    }
  });

  const totalRecords = data.length;
  const visibleCount = settings.hideOldData ? Math.max(0, totalRecords - hiddenCount) : totalRecords;

  return {
    totalRecords,
    maxSlNo,
    visibleCount,
    hiddenCount,
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = getSettings();
    let stats = { totalRecords: 0, maxSlNo: 0, visibleCount: 0, hiddenCount: 0 };
    try {
      stats = await getDataAndStats();
    } catch (sheetError) {
      console.warn('[Settings API] Could not fetch sheet stats:', sheetError);
    }

    return NextResponse.json({
      settings,
      stats,
    });
  } catch (error: any) {
    console.error('[Settings API] GET Error:', error);
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

    // Handle quick action: "set_latest_as_cutoff"
    if (body.action === 'set_latest_as_cutoff') {
      let data = getCache();
      if (!data) {
        data = await getRows();
        setCache(data);
      }

      let maxSlNo = 0;
      data.forEach((row: any) => {
        const sl = parseInt(row['Sl No.'] || row['Sl No'] || '0');
        if (!isNaN(sl) && sl > maxSlNo) {
          maxSlNo = sl;
        }
      });

      // Setting cutoffSlNo to maxSlNo + 1 will hide all existing records (1..maxSlNo)
      // and any newly added row will get maxSlNo + 1, thus being visible!
      const updated = saveSettings({
        hideOldData: true,
        cutoffMode: 'slNo',
        cutoffSlNo: maxSlNo + 1,
      });

      clearCache();
      const stats = await getDataAndStats();

      return NextResponse.json({
        success: true,
        message: `Cutoff set to Sl No. #${maxSlNo + 1}. All existing ${maxSlNo} records are now hidden.`,
        settings: updated,
        stats,
      });
    }

    // Standard settings update
    const updatePayload: any = {};
    if (typeof body.hideOldData === 'boolean') updatePayload.hideOldData = body.hideOldData;
    if (body.cutoffMode === 'slNo' || body.cutoffMode === 'date') updatePayload.cutoffMode = body.cutoffMode;
    if (typeof body.cutoffSlNo === 'number' || !isNaN(Number(body.cutoffSlNo))) {
      updatePayload.cutoffSlNo = Math.max(0, parseInt(body.cutoffSlNo));
    }
    if (typeof body.cutoffDate === 'string') updatePayload.cutoffDate = body.cutoffDate;
    if (typeof body.respectArchivedColumn === 'boolean') updatePayload.respectArchivedColumn = body.respectArchivedColumn;
    if (typeof body.allowAdminViewAll === 'boolean') updatePayload.allowAdminViewAll = body.allowAdminViewAll;

    const saved = saveSettings(updatePayload);
    clearCache();

    let stats = { totalRecords: 0, maxSlNo: 0, visibleCount: 0, hiddenCount: 0 };
    try {
      stats = await getDataAndStats();
    } catch (e) {
      console.warn('[Settings API] Could not fetch stats after save:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: saved,
      stats,
    });
  } catch (error: any) {
    console.error('[Settings API] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
