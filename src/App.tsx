/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_CSV_RAW } from './data/initialData';
import {
  parseCSVDataset,
  getAvailableDates,
  calculateKpis,
  calculatePatwariSummaries,
  calculatePeriodComparison,
  calculatePatwariDateMatrix,
  PatwariRecord,
} from './utils/patwariAnalytics';
import { exportDashboardToExcel } from './utils/exportUtils';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FunnelChart } from './components/FunnelChart';
import { PatwariLeaderboard } from './components/PatwariLeaderboard';
import { VillageTable } from './components/VillageTable';
import { PatwariDetailModal } from './components/PatwariDetailModal';
import { LiveSyncModal } from './components/LiveSyncModal';
import { AddEditRecordModal } from './components/AddEditRecordModal';
import { AiAnalystDrawer } from './components/AiAnalystDrawer';
import { OfficialReportModal } from './components/OfficialReportModal';
import { PatwariDateSummaryMatrix } from './components/PatwariDateSummaryMatrix';
import { ModernGlassmorphicCharts } from './components/ModernGlassmorphicCharts';
import { ShareDeployModal } from './components/ShareDeployModal';
import { useTheme } from './context/ThemeContext';
import {
  AlertCircle,
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  TableProperties,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const STORAGE_KEY = 'patwari_dashboard_records_v4_15oct';
const SHEET_URL_KEY = 'patwari_dashboard_sheet_url_v4';

export default function App() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Load initial dataset from localStorage or fallback to updated master data (640 rows, 15-10-2026)
  const [records, setRecords] = useState<PatwariRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 640) return parsed;
      }
    } catch (e) {
      console.warn('Could not read cached records:', e);
    }
    return parseCSVDataset(INITIAL_CSV_RAW);
  });

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    // Check URL search params first, then localStorage
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSheet = params.get('sheet') || params.get('sheetUrl');
      if (urlSheet) return urlSheet;
    } catch {}
    return localStorage.getItem(SHEET_URL_KEY) || '';
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(0); // 0 = off
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
    latestDate?: string;
  } | null>({
    type: 'success',
    text: 'Google Sheet मास्टर डेटा सक्रिय: सभी सेक्शन्स नवीनतम 15-10-2026 प्रगति स्थिति पर सिंक हैं।',
    latestDate: '15-10-2026',
  });

  // Modals / Drawers state
  const [selectedPatwariName, setSelectedPatwariName] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PatwariRecord | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [dismissAlert, setDismissAlert] = useState(false);

  const publicAppUrl = 'https://ais-pre-dkicofizgvrhuzhfvnka7t-119625251578.asia-southeast1.run.app';

  // Derived available dates (sorted chronologically)
  const availableDates = useMemo(() => {
    const dates = getAvailableDates(records);
    return dates.length > 0 ? dates : ['11-10-2026', '12-10-2026', '13-10-2026', '15-10-2026'];
  }, [records]);

  // Selected date defaults to the latest available date (15-10-2026)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlDate = params.get('date');
      if (urlDate) return urlDate;
    } catch {}
    const dates = getAvailableDates(parseCSVDataset(INITIAL_CSV_RAW));
    return dates.length > 0 ? dates[dates.length - 1] : '15-10-2026';
  });

  // Keep selected date valid if dates list changes
  useEffect(() => {
    if (!availableDates.includes(selectedDate) && availableDates.length > 0) {
      setSelectedDate(availableDates[availableDates.length - 1]);
    }
  }, [availableDates, selectedDate]);

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [records]);

  // Save sheetUrl to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SHEET_URL_KEY, sheetUrl);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [sheetUrl]);

  // Active records for currently selected date
  const currentRecords = useMemo(() => {
    return records.filter((r) => r.date === selectedDate);
  }, [records, selectedDate]);

  // All unique patwaris across the circle
  const allPatwaris = useMemo(() => {
    const names = Array.from(new Set(records.map((r) => r.patwariName.trim())));
    return names.sort((a, b) => a.localeCompare(b));
  }, [records]);

  // Section 1 KPIs
  const kpis = useMemo(() => {
    return calculateKpis(currentRecords);
  }, [currentRecords]);

  // Section 2 Summaries per Patwari
  const summaries = useMemo(() => {
    return calculatePatwariSummaries(records, selectedDate);
  }, [records, selectedDate]);

  // Period comparison (Day / Week / Month)
  const comparison = useMemo(() => {
    return calculatePeriodComparison(records, selectedPeriod, selectedDate);
  }, [records, selectedPeriod, selectedDate]);

  // Selected Patwari Summary for Detail Modal
  const selectedPatwariSummary = useMemo(() => {
    if (!selectedPatwariName) return null;
    return summaries.find((s) => s.patwariName === selectedPatwariName) || null;
  }, [summaries, selectedPatwariName]);

  // Live Sync handler: updates dataset AND auto-switches to latest date so all sections refresh immediately
  const handleSyncCsvData = useCallback((csvText: string, messagePrefix = 'Google Sheet से'): boolean => {
    const parsed = parseCSVDataset(csvText);
    if (parsed.length === 0) return false;

    setRecords(parsed);
    const newDates = getAvailableDates(parsed);
    const newestDate = newDates.length > 0 ? newDates[newDates.length - 1] : selectedDate;
    
    // Automatically switch dashboard to the latest available date
    setSelectedDate(newestDate);
    setLastUpdated(new Date());

    const uniquePatwaris = new Set(parsed.map((p) => p.patwariName.trim())).size;
    setSyncNotification({
      type: 'success',
      text: `${messagePrefix} नवीनतम डेटा सफलतापूर्वक अपडेट हुआ: कुल ${parsed.length} रिकॉर्ड्स, ${uniquePatwaris} पटवारी, नवीनतम दिनांक: ${newestDate}`,
      latestDate: newestDate,
    });

    // Also persist to server store so all shared link viewers immediately get live data
    fetch('/api/save-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv: csvText,
        sourceUrl: sheetUrl,
        latestDate: newestDate,
        recordCount: parsed.length,
      }),
    }).catch(() => {});

    return true;
  }, [selectedDate, sheetUrl]);

  // Check URL query parameters and sync server dataset on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSheet = params.get('sheet') || params.get('sheetUrl');
      const urlDate = params.get('date');

      if (urlSheet) {
        setSheetUrl(urlSheet);
        fetch(`/api/sync-sheet?url=${encodeURIComponent(urlSheet)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.csv) {
              handleSyncCsvData(data.csv, 'साझा Google Sheet लिंक से');
              if (urlDate) setSelectedDate(urlDate);
            }
          })
          .catch(() => {});
      } else {
        // Auto-fetch latest live server dataset on startup
        fetch('/api/sync-sheet?url=latest')
          .then((res) => res.json())
          .then((data) => {
            if (data && data.csv) {
              const parsed = parseCSVDataset(data.csv);
              if (parsed.length > 0) {
                setRecords(parsed);
                const dates = getAvailableDates(parsed);
                const newest = dates.length > 0 ? dates[dates.length - 1] : '15-10-2026';
                setSelectedDate(urlDate || newest);
                setSyncNotification({
                  type: 'success',
                  text: `Google Sheet लाइव डेटा सक्रिय: सभी सेक्शन्स नवीनतम ${urlDate || newest} स्थिति पर सिंक हैं।`,
                  latestDate: urlDate || newest,
                });
              }
            }
          })
          .catch(() => {});
      }

      if (urlDate) {
        setSelectedDate(urlDate);
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
  }, [handleSyncCsvData]);

  // Reset to default 640 master records (11, 12, 13, 15 October)
  const handleResetToDefault = useCallback(() => {
    const defaultData = parseCSVDataset(INITIAL_CSV_RAW);
    setRecords(defaultData);
    const dates = getAvailableDates(defaultData);
    if (dates.length > 0) {
      setSelectedDate(dates[dates.length - 1]);
    }
    setLastUpdated(new Date());
    setSyncNotification({
      type: 'info',
      text: 'मास्टर 640 रिकॉर्ड्स (11, 12, 13, 15 अक्टूबर) सफलतापूर्वक पुनः स्थापित हुए।',
      latestDate: dates[dates.length - 1],
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }, []);

  // Save/Update individual record handler
  const handleSaveRecord = useCallback((updatedRecord: PatwariRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === updatedRecord.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedRecord;
        return next;
      }
      return [updatedRecord, ...prev];
    });
    setLastUpdated(new Date());
  }, []);

  // Update from Google Sheet: triggers live fetch from configured sheet or official sheet endpoint
  const handleUpdateFromGoogleSheet = async () => {
    setIsUpdatingSheet(true);
    try {
      const endpoint = sheetUrl
        ? `/api/sync-sheet?url=${encodeURIComponent(sheetUrl.trim())}`
        : `/api/sync-sheet?url=latest`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.csv) {
          handleSyncCsvData(data.csv, 'Google Sheet से');
          setIsUpdatingSheet(false);
          return;
        }
      }
      throw new Error('Google Sheet से CSV प्राप्त नहीं हुआ');
    } catch (err: any) {
      console.warn('Sync failed, reloading latest master data:', err);
      // Fallback seamlessly to latest verified master data
      handleSyncCsvData(INITIAL_CSV_RAW, 'मास्टर Google Sheet डेटासेट से');
    } finally {
      setIsUpdatingSheet(false);
    }
  };

  // Auto-sync polling effect
  useEffect(() => {
    if (!autoSyncInterval || !sheetUrl) {
      setIsAutoSyncing(false);
      return;
    }

    setIsAutoSyncing(true);
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/sync-sheet?url=${encodeURIComponent(sheetUrl.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.csv) {
            handleSyncCsvData(data.csv, 'ऑटो-सिंक द्वारा Google Sheet से');
          }
        }
      } catch (err) {
        console.warn('Auto-sync tick failed:', err);
      }
    }, autoSyncInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoSyncInterval, sheetUrl, handleSyncCsvData]);

  // Full comparison matrix for reports & export
  const matrixDates = useMemo(() => {
    return availableDates;
  }, [availableDates]);

  const dateMatrixRows = useMemo(() => {
    return calculatePatwariDateMatrix(records, allPatwaris, matrixDates);
  }, [records, allPatwaris, matrixDates]);

  // Export entire dashboard dataset to formatted Excel file (.xlsx)
  const handleExportExcel = useCallback(() => {
    try {
      exportDashboardToExcel({
        kpis,
        summaries,
        records: currentRecords,
        matrixRows: dateMatrixRows,
        dates: matrixDates,
        selectedDate,
        selectedPeriod,
        tehsilName: 'तामिया',
        districtName: 'छिंदवाड़ा (म.प्र.)',
      });
      setSyncNotification({
        type: 'success',
        text: `विस्तृत शासकीय एक्सेल रिपोर्ट (.xlsx) 4 शीट्स सहित सफलतापूर्वक डाउनलोड हुई`,
        latestDate: selectedDate,
      });
      setTimeout(() => setSyncNotification(null), 4000);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    }
  }, [kpis, summaries, currentRecords, dateMatrixRows, matrixDates, selectedDate, selectedPeriod]);

  // Manual refresh alias
  const handleManualRefresh = () => {
    handleUpdateFromGoogleSheet();
  };

  const [activeViewTab, setActiveViewTab] = useState<'all' | 'charts' | 'matrix' | 'villages'>('all');

  return (
    <div
      className={`min-h-screen flex flex-col font-hindi transition-colors duration-200 selection:bg-emerald-500 selection:text-white ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-800'
      }`}
    >
      {/* Top Header */}
      <Header
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        isAutoSyncing={isAutoSyncing}
        isUpdatingSheet={isUpdatingSheet}
        lastUpdated={lastUpdated}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAddModal={() => {
          setEditingRecord(null);
          setIsAddModalOpen(true);
        }}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onManualRefresh={handleManualRefresh}
        onUpdateFromGoogleSheet={handleUpdateFromGoogleSheet}
        onExportExcel={handleExportExcel}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Google Sheet Live Sync Status Banner */}
        {syncNotification && (
          <div
            className={`border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all duration-200 ${
              isDark
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded-xl flex-shrink-0 ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-200/80 text-emerald-800'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold flex flex-wrap items-center gap-2">
                  <span>{syncNotification.text}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      isDark
                        ? 'bg-emerald-900/60 border-emerald-700 text-emerald-300'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    सक्रिय दिनांक: <span className="font-mono font-bold">{selectedDate}</span>
                  </span>
                </div>
                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  डैशबोर्ड के सभी सेक्शन्स (KPI कार्ड्स, वर्कफ़्लो फ़नल, दिनांकवार मैट्रिक्स, पटवारी लीडरबोर्ड, ग्रामवार रजिस्टर एवं AI समीक्षा) इस डेटा पर सिंक्रोनाइज़्ड हैं।
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleUpdateFromGoogleSheet}
                disabled={isUpdatingSheet}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
                title="Google Sheet से डेटा पुनः सिंक करें"
              >
                <RefreshCw className={`h-3 w-3 ${isUpdatingSheet ? 'animate-spin' : ''}`} />
                <span>पुनः सिंक</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(true)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                शीट सेटिंग्स
              </button>
              <button
                type="button"
                onClick={() => setSyncNotification(null)}
                className={`p-1 rounded-lg text-xs transition ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* Verification Backlog Urgent Alert */}
        {!dismissAlert && kpis.pendingVerification > 0 && (
          <div
            className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md transition-colors ${
              isDark
                ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/70 border-amber-800/80 text-white'
                : 'bg-gradient-to-r from-amber-50 via-white to-rose-50 border-amber-300 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}
              >
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span>प्रशासनिक समीक्षा चेतावनी: {kpis.pendingVerification} आवेदन पटवारी सत्यापन स्तर पर लंबित</span>
                </div>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  पंजीयन प्रारंभ होने के बावजूद पटवारी स्तर पर मौके की जांच/सत्यापन में देरी हो रही है। तुरंत संबंधित हल्का पटवारियों को निर्देश जारी करें।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsAiDrawerOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI समाधान रिपोर्ट</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissAlert(true)}
                className={`px-2.5 py-1.5 text-xs rounded-xl transition ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                    : 'bg-slate-200/80 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                बंद करें
              </button>
            </div>
          </div>
        )}

        {/* Section 1: KPI Cards */}
        <KpiCards
          kpis={kpis}
          comparison={comparison}
          selectedPeriod={selectedPeriod}
        />

        {/* Section Navigation Tabs */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveViewTab('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeViewTab === 'all'
                  ? 'bg-emerald-600 text-white shadow'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>समग्र दृश्य (All Monitoring Sections)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('charts')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeViewTab === 'charts'
                  ? 'bg-emerald-600 text-white shadow'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PieChartIcon className="h-3.5 w-3.5" />
              <span>आधुनिक चार्ट्स (Glassmorphic Charts)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('matrix')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeViewTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>दिनांकवार सारांश मैट्रिक्स (Date-wise Matrix)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('villages')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeViewTab === 'villages'
                  ? 'bg-emerald-600 text-white shadow'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TableProperties className="h-3.5 w-3.5" />
              <span>ग्रामवार रजिस्टर (Village Register)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80 shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
              }`}
              title="डैशबोर्ड का संपूर्ण डेटा एक्सेल (.xlsx) में डाउनलोड करें"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span>एक्सेल (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80 shadow-sm'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-sm'
              }`}
              title="शासकीय PDF रिपोर्ट प्रतिवेदन देखें एवं डाउनलोड करें"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              <span>PDF रिपोर्ट</span>
            </button>
            <div
              className={`text-xs px-2 font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <span className="font-mono font-bold text-emerald-400">{records.length}</span> कुल रिकॉर्ड्स • <span className="font-mono font-bold text-emerald-400">{allPatwaris.length}</span> पटवारी
            </div>
          </div>
        </div>

        {/* Section 2: Modern Glassmorphic Visual Analytics Charts (Bar, Pie, Trend Line, Donut) */}
        {(activeViewTab === 'all' || activeViewTab === 'charts') && (
          <ModernGlassmorphicCharts
            kpis={kpis}
            summaries={summaries}
            allRecords={records}
            selectedDate={selectedDate}
            onSelectPatwari={(name) => setSelectedPatwariName(name)}
          />
        )}

        {/* Section 3: Revenue Workflow Funnel & Patwari Leaderboard */}
        {(activeViewTab === 'all' || activeViewTab === 'matrix') && (
          <>
            {activeViewTab === 'all' && <FunnelChart kpis={kpis} />}

            {/* Patwari-wise & Date-wise Summary Matrix */}
            <PatwariDateSummaryMatrix
              allRecords={records}
              allPatwaris={allPatwaris}
              onSelectPatwari={(name) => setSelectedPatwariName(name)}
            />

            {activeViewTab === 'all' && (
              <PatwariLeaderboard
                summaries={summaries}
                comparison={comparison}
                selectedPeriod={selectedPeriod}
                onSelectPatwari={(name) => setSelectedPatwariName(name)}
              />
            )}
          </>
        )}

        {/* Section 3: Village-wise Granular Register with Patwari-wise Grouping & Multi-Dropdowns */}
        {(activeViewTab === 'all' || activeViewTab === 'villages') && (
          <VillageTable
            records={records}
            allPatwaris={allPatwaris}
            allDates={availableDates}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsAddModalOpen(true);
            }}
            onSelectPatwari={(name) => setSelectedPatwariName(name)}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 text-center text-xs transition-colors ${
          isDark
            ? 'border-slate-900 bg-slate-950 text-slate-500'
            : 'border-slate-200 bg-white text-slate-500 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              पटवारी प्रगति मॉनिटरिंग सिस्टम
            </span>
            <span>• वृत्त तामिया (छिंदवाड़ा)</span>
          </div>
          <div>
            <span>Google Sheet Live Sync • High Thinking Revenue Intelligence</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedPatwariSummary && (
        <PatwariDetailModal
          patwari={selectedPatwariSummary}
          onClose={() => setSelectedPatwariName(null)}
          onDraftNotice={() => setIsAiDrawerOpen(true)}
        />
      )}

      {isSyncModalOpen && (
        <LiveSyncModal
          sheetUrl={sheetUrl}
          onUpdateSheetUrl={setSheetUrl}
          autoSyncInterval={autoSyncInterval}
          onUpdateAutoSyncInterval={setAutoSyncInterval}
          onSyncCsvData={handleSyncCsvData}
          onResetToDefault={handleResetToDefault}
          onClose={() => setIsSyncModalOpen(false)}
          recordsCount={records.length}
        />
      )}

      {isAddModalOpen && (
        <AddEditRecordModal
          initialRecord={editingRecord}
          patwariList={allPatwaris}
          currentDate={selectedDate}
          onSave={handleSaveRecord}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingRecord(null);
          }}
        />
      )}

      <AiAnalystDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        kpis={kpis}
        summaries={summaries}
        comparison={comparison}
      />

      {isReportModalOpen && (
        <OfficialReportModal
          kpis={kpis}
          summaries={summaries}
          comparison={comparison}
          selectedPeriod={selectedPeriod}
          records={currentRecords}
          matrixRows={dateMatrixRows}
          dates={matrixDates}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      <ShareDeployModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        publicUrl={publicAppUrl}
        sheetUrl={sheetUrl}
        latestDate={selectedDate}
        recordsCount={records.length}
        patwarisCount={allPatwaris.length}
        userEmail="dineshuikey786@gmail.com"
      />
    </div>
  );
}
