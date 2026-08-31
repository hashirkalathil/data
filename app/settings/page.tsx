'use client';

import { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  Database, 
  Layers, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RotateCcw, 
  Sparkles, 
  FileSpreadsheet, 
  ShieldAlert,
  Loader2,
  Info
} from 'lucide-react';
import { AppSettings } from '@/lib/settings';

interface Stats {
  totalRecords: number;
  maxSlNo: number;
  visibleCount: number;
  hiddenCount: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    hideOldData: false,
    cutoffMode: 'slNo',
    cutoffSlNo: 0,
    cutoffDate: '',
    respectArchivedColumn: true,
    allowAdminViewAll: true,
  });

  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    maxSlNo: 0,
    visibleCount: 0,
    hiddenCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isQuickSetting, setIsQuickSetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch initial settings & stats
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.stats) setStats(data.stats);
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setStatusMessage({ type: 'error', text: 'Failed to fetch settings from server.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (updatedSettings: Partial<AppSettings> = settings) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      if (data.settings) setSettings(data.settings);
      if (data.stats) setStats(data.stats);

      setStatusMessage({ type: 'success', text: 'Settings saved successfully! Dashboard data updated.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetLatestCutoff = async () => {
    if (!confirm(`Are you sure you want to hide all current ${stats.totalRecords} records up to Sl No. #${stats.maxSlNo}? Only newly entered candidates will appear on the dashboard.`)) {
      return;
    }

    setIsQuickSetting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_latest_as_cutoff' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set cutoff');

      if (data.settings) setSettings(data.settings);
      if (data.stats) setStats(data.stats);

      setStatusMessage({ 
        type: 'success', 
        text: `Cutoff active starting from Sl No. #${data.settings.cutoffSlNo}! All past records are now hidden.` 
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to set cutoff.' });
    } finally {
      setIsQuickSetting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset settings to show all records (disable old data filter)?')) return;

    const resetValues: AppSettings = {
      hideOldData: false,
      cutoffMode: 'slNo',
      cutoffSlNo: 0,
      cutoffDate: '',
      respectArchivedColumn: true,
      allowAdminViewAll: true,
    };

    setSettings(resetValues);
    await handleSave(resetValues);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500">Loading settings & data statistics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Data Visibility & Cutoff Settings
            </h1>
          </div>
        </div>

        {/* Action button in header */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving || isQuickSetting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || isQuickSetting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50/90 border-emerald-200/80 text-emerald-800' 
            : 'bg-rose-50/90 border-rose-200/80 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Dataset Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total in Sheet</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {stats.totalRecords.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">All historical rows</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Currently Visible</span>
            <Eye className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {stats.visibleCount.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600/80 font-medium">Showing on dashboard</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Currently Hidden</span>
            <EyeOff className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">
            {stats.hiddenCount.toLocaleString()}
          </p>
          <span className="text-[11px] text-amber-600/80 font-medium">Old / archived records</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">Latest Sl No.</span>
            <Hash className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600">
            #{stats.maxSlNo}
          </p>
          <span className="text-[11px] text-indigo-600/80 font-medium">Highest assigned ID</span>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100">
        
        {/* Section 1: Master Old Data Toggle */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Hide Old Candidate Data
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border ${
                  settings.hideOldData 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {settings.hideOldData ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Switch Toggle */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.hideOldData}
                onChange={(e) => setSettings({ ...settings, hideOldData: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-13 h-7 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Section 2: Cutoff Configuration (Shown when Hide Old Data is enabled) */}
        {settings.hideOldData && (
          <div className="p-5 sm:p-6 bg-slate-50/50 space-y-6 animate-in fade-in duration-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cutoff Configuration
              </h4>
            </div>

            {/* Method A: Serial Number Cutoff (Recommended) */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              settings.cutoffMode === 'slNo' 
                ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10' 
                : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="cutoffMode"
                    value="slNo"
                    checked={settings.cutoffMode === 'slNo'}
                    onChange={() => setSettings({ ...settings, cutoffMode: 'slNo' })}
                    className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        Filter by Serial Number (Sl No.)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                        Recommended • No sheet changes needed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Every candidate row already has an auto-incrementing Serial Number. Records with Sl No. lower than the cutoff will be hidden.
                    </p>
                  </div>
                </label>
              </div>

              {settings.cutoffMode === 'slNo' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700 shrink-0">
                      Starting Sl No. (Cutoff):
                    </label>
                    <div className="relative w-36">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs font-mono">
                        #
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={settings.cutoffSlNo}
                        onChange={(e) => setSettings({ ...settings, cutoffSlNo: parseInt(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        placeholder="e.g. 150"
                      />
                    </div>
                  </div>

                  {/* 1-Click Quick Action Button */}
                  <button
                    type="button"
                    onClick={handleSetLatestCutoff}
                    disabled={isQuickSetting || isSaving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isQuickSetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Set Cutoff to Latest (#{stats.maxSlNo + 1})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Method B: Cutoff by Date */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              settings.cutoffMode === 'date' 
                ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10' 
                : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cutoffMode"
                  value="date"
                  checked={settings.cutoffMode === 'date'}
                  onChange={() => setSettings({ ...settings, cutoffMode: 'date' })}
                  className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    Filter by Cutoff Date
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Hide candidates entered before a specific calendar date (if your sheet includes an entry/creation date).
                  </p>
                </div>
              </label>

              {settings.cutoffMode === 'date' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 shrink-0">
                    Show records on or after:
                  </label>
                  <input
                    type="date"
                    value={settings.cutoffDate || ''}
                    onChange={(e) => setSettings({ ...settings, cutoffDate: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

          </div>
        )}

        {/* Section 3: Google Sheets Column Support */}
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Google Sheets Row Archiving Support
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Automatically hide any candidate row where the <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-700">Archived</code> or <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-700">Status</code> column in Google Sheets is set to &quot;TRUE&quot;, &quot;Yes&quot;, or &quot;Archived&quot;.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.respectArchivedColumn}
                onChange={(e) => setSettings({ ...settings, respectArchivedColumn: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Section 4: Dashboard Quick Switch */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Dashboard Quick View Switch
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Allow administrators to toggle between &quot;Show New Only&quot; and &quot;Show All Records&quot; directly on the main table without having to change global settings.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.allowAdminViewAll}
                onChange={(e) => setSettings({ ...settings, allowAdminViewAll: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving || isQuickSetting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Visibility Settings</span>
        </button>
      </div>

    </div>
  );
}
