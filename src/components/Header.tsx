import React from 'react';
import {
  Calendar,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  Printer,
  ShieldCheck,
  Share2,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  selectedPeriod: 'day' | 'week' | 'month';
  onSelectPeriod: (period: 'day' | 'week' | 'month') => void;
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isAutoSyncing: boolean;
  isUpdatingSheet?: boolean;
  lastUpdated: Date;
  onOpenSyncModal: () => void;
  onOpenAddModal: () => void;
  onOpenAiDrawer: () => void;
  onOpenReportModal: () => void;
  onManualRefresh: () => void;
  onUpdateFromGoogleSheet?: () => void;
  onExportExcel?: () => void;
  onOpenShareModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPeriod,
  onSelectPeriod,
  availableDates,
  selectedDate,
  onSelectDate,
  isAutoSyncing,
  isUpdatingSheet = false,
  lastUpdated,
  onOpenSyncModal,
  onOpenAddModal,
  onOpenAiDrawer,
  onOpenReportModal,
  onManualRefresh,
  onUpdateFromGoogleSheet,
  onExportExcel,
  onOpenShareModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header
      className={`border-b sticky top-0 z-30 transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-white shadow-lg'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Top Banner with Indian Revenue Seal Style */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 px-4 py-2 text-xs border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isAutoSyncing ? 'bg-emerald-400' : 'bg-amber-400'
              } opacity-75`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isAutoSyncing ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="font-semibold text-emerald-400 tracking-wide uppercase">
            राजस्व विभाग • Revenue Department
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-hindi">स्वामित्व / आबादी भूमि सर्वे एवं पंजीयन निगरानी</span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-[11px]">
            अंतिम अपडेट: <span className="text-slate-200 font-mono">{lastUpdated.toLocaleTimeString()}</span>
          </span>
          {isAutoSyncing && (
            <span className="bg-emerald-900/80 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-700 font-medium">
              Live Sync On
            </span>
          )}
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-400/20 flex-shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-lg sm:text-xl font-bold tracking-tight font-hindi flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  पटवारी प्रगति डैशबोर्ड
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800/80">
                    Tamia Circle
                  </span>
                </h1>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Patwari Day, Week &amp; Month Progress Monitoring &amp; Bottleneck Tracking
              </p>
            </div>
          </div>

          {/* Timeframe Tabs & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Period Selector */}
            <div
              className={`p-1 rounded-xl border flex items-center ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700/80'
                  : 'bg-slate-100 border-slate-300/80 shadow-inner'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectPeriod('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPeriod === 'day'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                दैनिक (Day)
              </button>
              <button
                type="button"
                onClick={() => onSelectPeriod('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPeriod === 'week'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                साप्ताहिक (Week)
              </button>
              <button
                type="button"
                onClick={() => onSelectPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPeriod === 'month'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                मासिक (Month)
              </button>
            </div>

            {/* Date Dropdown */}
            <div
              className={`flex items-center rounded-xl border px-2 py-1 text-xs ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700/80'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <Calendar
                className={`h-3.5 w-3.5 mr-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              />
              <label htmlFor="date-select" className="sr-only">
                दिनांक चुनें
              </label>
              <select
                id="date-select"
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className={`bg-transparent font-sans text-xs focus:outline-none cursor-pointer pr-2 font-medium ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {availableDates.map((d) => (
                  <option
                    key={d}
                    value={d}
                    className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                  >
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark / Light Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'लाइट थीम सक्रिय करें (Switch to Light Mode)' : 'डार्क थीम सक्रिय करें (Switch to Dark Mode)'}
              aria-label="Toggle theme"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">लाइट थीम (Light)</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <span className="hidden sm:inline">डार्क थीम (Dark)</span>
                </>
              )}
            </button>

            {/* Primary Action: Update Latest Data from Google Sheet */}
            <button
              type="button"
              onClick={onUpdateFromGoogleSheet || onManualRefresh}
              disabled={isUpdatingSheet}
              title="Google Sheet से नवीनतम डेटा डैशबोर्ड के सभी सेक्शन्स में अपडेट करें"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/30 ring-1 ring-emerald-400/40 transition active:scale-95 disabled:opacity-75 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingSheet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Google Sheet से</span>
              <span>नवीनतम डेटा अपडेट</span>
            </button>

            {/* Google Sheet Settings / URL Sync Modal Trigger */}
            <button
              type="button"
              onClick={onOpenSyncModal}
              title="Google Sheet लिंक कॉन्फ़िगर करें या नया CSV अपलोड करें"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden md:inline">शीट सेटिंग्स</span>
            </button>

            {/* Quick Add / Update Record */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-teal-800/50'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-teal-500" />
              <span>+ नई एंट्री</span>
            </button>

            {/* AI High Thinking Assistant */}
            <button
              type="button"
              onClick={onOpenAiDrawer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition transform active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>AI Revenue Audit</span>
            </button>

            {/* Export in Excel Button */}
            <button
              type="button"
              onClick={onExportExcel}
              title="डैशबोर्ड का संपूर्ण डेटा एक्सेल (.xlsx) में डाउनलोड करें"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border-emerald-700/80 shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">एक्सेल (.xlsx)</span>
              <span className="sm:hidden">Excel</span>
            </button>

            {/* Official PDF Report Button */}
            <button
              type="button"
              onClick={onOpenReportModal}
              title="शासकीय PDF प्रतिवेदन प्रारूप देखें, डाउनलोड करें अथवा प्रिंट करें"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border-rose-700/80 shadow-sm'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-sm'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              <span className="hidden sm:inline">PDF रिपोर्ट</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Public Share & Netlify / GitHub Deploy Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              title="Netlify (.netlify.app), GitHub एवं पब्लिक लिंक डिप्लॉयमेंट"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-teal-950/50 hover:bg-teal-900/70 text-teal-300 border-teal-700/80 shadow-sm'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300 shadow-sm'
              }`}
            >
              <Share2 className="h-3.5 w-3.5 text-teal-500" />
              <span className="hidden sm:inline">डिप्लॉय / Netlify</span>
              <span className="sm:hidden">Netlify</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
