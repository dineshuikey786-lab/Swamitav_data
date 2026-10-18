import React from 'react';
import {
  MapPin,
  Users,
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { OverallKpis, PeriodComparison } from '../utils/patwariAnalytics';
import { useTheme } from '../context/ThemeContext';

interface KpiCardsProps {
  kpis: OverallKpis;
  comparison: PeriodComparison;
  selectedPeriod: 'day' | 'week' | 'month';
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  kpis,
  comparison,
  selectedPeriod,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const periodLabel =
    selectedPeriod === 'day'
      ? 'आज का शुद्ध बदलाव'
      : selectedPeriod === 'week'
      ? 'साप्ताहिक रन-रेट'
      : 'मासिक लक्ष्य का हिस्सा';

  const cardBaseClass = isDark
    ? 'bg-slate-900/90 border-slate-800 shadow-sm hover:border-slate-700'
    : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300 text-slate-900';

  const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderDividerClass = isDark ? 'border-slate-800/80' : 'border-slate-100';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Target Plots & Villages */}
      <div className={`border rounded-2xl p-4 transition ${cardBaseClass}`}>
        <div className={`flex items-center justify-between ${subTextClass} mb-2`}>
          <span className="text-xs font-semibold uppercase tracking-wider">
            कुल लक्ष्य भूखंड (Total Plots)
          </span>
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {kpis.totalPlots.toLocaleString()}
          </span>
          <span className={`text-xs ${subTextClass}`}>भूखंड (Plots)</span>
        </div>
        <div className={`mt-3 flex items-center justify-between text-xs ${subTextClass} pt-2 border-t ${borderDividerClass}`}>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-400" />
            {kpis.totalVillages} कुल गांव (Villages)
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-400" />
            {kpis.totalBeneficiaries.toLocaleString()} हितग्राही
          </span>
        </div>
      </div>

      {/* 2. Registry Initiated */}
      <div className={`border rounded-2xl p-4 transition ${cardBaseClass}`}>
        <div className={`flex items-center justify-between ${subTextClass} mb-2`}>
          <span className="text-xs font-semibold uppercase tracking-wider">
            पंजीयन प्रारंभ (Registry Initiated)
          </span>
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <FileCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {kpis.registryInitiated.toLocaleString()}
            </span>
            <span className={`text-xs ${subTextClass}`}>आवेदन</span>
          </div>

          {comparison.deltaInitiated !== 0 && (
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                comparison.deltaInitiated > 0
                  ? isDark
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isDark
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {comparison.deltaInitiated > 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
              )}
              {comparison.deltaInitiated > 0 ? `+${comparison.deltaInitiated}` : comparison.deltaInitiated}
            </span>
          )}
        </div>
        <div className={`mt-3 flex items-center justify-between text-xs ${subTextClass} pt-2 border-t ${borderDividerClass}`}>
          <span>{periodLabel}</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            <span className="font-mono font-bold">
              {kpis.totalPlots > 0 ? ((kpis.registryInitiated / kpis.totalPlots) * 100).toFixed(1) : 0}%
            </span>{' '}
            प्रारंभ
          </span>
        </div>
      </div>

      {/* 3. Patwari Verification (Crucial Stage) */}
      <div className={`border rounded-2xl p-4 transition ${cardBaseClass}`}>
        <div className={`flex items-center justify-between ${subTextClass} mb-2`}>
          <span className="text-xs font-semibold uppercase tracking-wider">
            पटवारी सत्यापन (Verified)
          </span>
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {kpis.patwariVerification.toLocaleString()}
            </span>
            <span className={`text-xs ${subTextClass}`}>सत्यापित</span>
          </div>

          {comparison.deltaVerified !== 0 && (
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                comparison.deltaVerified > 0
                  ? isDark
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : isDark
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {comparison.deltaVerified > 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
              )}
              {comparison.deltaVerified > 0 ? `+${comparison.deltaVerified}` : comparison.deltaVerified}
            </span>
          )}
        </div>
        <div className={`mt-3 flex items-center justify-between text-xs ${subTextClass} pt-2 border-t ${borderDividerClass}`}>
          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-mono font-bold">{kpis.pendingVerification}</span> सत्यापन हेतु शेष
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            <span className="font-mono font-bold">
              {kpis.registryInitiated > 0
                ? ((kpis.patwariVerification / kpis.registryInitiated) * 100).toFixed(0)
                : 0}%
            </span>{' '}
            रूपांतरण
          </span>
        </div>
      </div>

      {/* 4. Completed & Overall Progress */}
      <div
        className={`border rounded-2xl p-4 transition ${
          isDark
            ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-800/60 hover:border-emerald-600'
            : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 border-emerald-200 hover:border-emerald-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            पूर्ण पंजीयन (Completed)
          </span>
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {kpis.completed.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400/80">भूखंड पूर्ण</span>
          </div>

          <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold rounded-full">
            {kpis.pctCompleted}%
          </span>
        </div>

        {/* Progress bar */}
        <div className={`mt-3 pt-2 border-t ${isDark ? 'border-emerald-900/40' : 'border-emerald-100'}`}>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(kpis.pctCompleted, 2))}%` }}
            />
          </div>
          <div className={`mt-1 flex items-center justify-between text-[11px] ${subTextClass}`}>
            <span>सक्रिय पटवारी: {comparison.activePatwarisCount}</span>
            <span>शेष लक्ष्य: {(kpis.totalPlots - kpis.completed).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
