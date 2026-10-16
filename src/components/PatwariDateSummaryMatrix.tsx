import React, { useState, useMemo } from 'react';
import {
  PatwariRecord,
  calculatePatwariDateMatrix,
  getAvailableDates,
  PatwariDateMatrixRow,
} from '../utils/patwariAnalytics';
import { MultiSelectDropdown, MultiSelectOption } from './MultiSelectDropdown';
import {
  Calendar,
  Users,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface PatwariDateSummaryMatrixProps {
  allRecords: PatwariRecord[];
  allPatwaris: string[];
  onSelectPatwari: (patwariName: string) => void;
}

export const PatwariDateSummaryMatrix: React.FC<PatwariDateSummaryMatrixProps> = ({
  allRecords,
  allPatwaris,
  onSelectPatwari,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const allDates = useMemo(() => getAvailableDates(allRecords), [allRecords]);

  // Multi-selected patwaris (empty = all)
  const [selectedPatwaris, setSelectedPatwaris] = useState<string[]>([]);
  // Multi-selected dates (empty = all)
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  // Filter mode
  const [filterMode, setFilterMode] = useState<'all' | 'progress_only' | 'pending_only' | 'stagnant'>('all');

  const patwariOptions: MultiSelectOption[] = useMemo(() => {
    return allPatwaris.map((p) => {
      const pRecs = allRecords.filter((r) => r.patwariName.trim() === p);
      return {
        value: p,
        label: p,
        count: pRecs.length / (allDates.length || 1), // approx villages count
      };
    });
  }, [allPatwaris, allRecords, allDates]);

  const dateOptions: MultiSelectOption[] = useMemo(() => {
    return allDates.map((d) => ({
      value: d,
      label: d,
    }));
  }, [allDates]);

  // Computed matrix rows
  const matrixRows = useMemo(() => {
    return calculatePatwariDateMatrix(allRecords, selectedPatwaris, selectedDates);
  }, [allRecords, selectedPatwaris, selectedDates]);

  // Dates to show columns for
  const activeDates = useMemo(() => {
    return selectedDates.length > 0 ? selectedDates : allDates;
  }, [selectedDates, allDates]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return matrixRows.filter((row) => {
      const hasProgress = row.delta.completedDelta > 0 || row.delta.verificationDelta > 0;
      const latestDate = activeDates[activeDates.length - 1];
      const latestMetric = latestDate ? row.dateMetrics[latestDate] : null;
      const hasPending = latestMetric ? latestMetric.pendingVerification > 0 : false;

      if (filterMode === 'progress_only') return hasProgress;
      if (filterMode === 'pending_only') return hasPending;
      if (filterMode === 'stagnant') return !hasProgress && (latestMetric?.completed || 0) === 0;
      return true;
    });
  }, [matrixRows, filterMode, activeDates]);

  const handleExportCsv = () => {
    const headers = ['Patwari Name', 'Villages', 'Total Plots'];
    for (const d of activeDates) {
      headers.push(`${d} Initiated`, `${d} Verified`, `${d} Completed`, `${d} Pct%`);
    }
    headers.push('Delta Verified', 'Delta Completed');

    const rows = filteredRows.map((r) => {
      const rowData = [
        `"${r.patwariName}"`,
        r.villagesCount,
        r.totalPlots,
      ];
      for (const d of activeDates) {
        const m = r.dateMetrics[d] || { initiated: 0, verified: 0, completed: 0, pctCompleted: 0 };
        rowData.push(m.initiated, m.verified, m.completed, `${m.pctCompleted}%`);
      }
      rowData.push(r.delta.verificationDelta, r.delta.completedDelta);
      return rowData.join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patwari_datewise_summary_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Header & Multi-Dropdown Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>पटवारीवार एवं दिनांकवार तुलनात्मक सारांश (Patwari &amp; Date-wise Matrix)</span>
            </h2>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
              }`}
            >
              Live Comparative Monitor
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            पटवारियों की विभिन्न दिनांकों में प्रगति, सत्यापन एवं पूर्णता की एक नज़र में तुलना (Date-over-Date Progress)
          </p>
        </div>

        {/* Multi-dropdowns and export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Patwari Multi-Select Dropdown */}
          <MultiSelectDropdown
            label="पटवारी"
            allLabel="सभी पटवारी"
            options={patwariOptions}
            selectedValues={selectedPatwaris}
            onChange={setSelectedPatwaris}
            icon={<Users className="h-3.5 w-3.5 text-emerald-400" />}
          />

          {/* Date Multi-Select Dropdown */}
          <MultiSelectDropdown
            label="दिनांक"
            allLabel="सभी दिनांक"
            options={dateOptions}
            selectedValues={selectedDates}
            onChange={setSelectedDates}
            icon={<Calendar className="h-3.5 w-3.5 text-blue-400" />}
          />

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">मैट्रिक्स CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div
        className={`flex flex-wrap items-center gap-2 pt-2 border-t text-xs ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}
      >
        <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>
          त्वरित फ़िल्टर:
        </span>
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-2.5 py-1 rounded-lg transition font-medium ${
            filterMode === 'all'
              ? isDark
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-white shadow-sm'
              : isDark
              ? 'bg-slate-800/80 text-slate-400 hover:text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          सभी पटवारी ({matrixRows.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('progress_only')}
          className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
            filterMode === 'progress_only'
              ? isDark
                ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
              : isDark
              ? 'bg-slate-800/80 text-emerald-400 hover:text-emerald-300'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          <span>आज प्रगति करने वाले</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('pending_only')}
          className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
            filterMode === 'pending_only'
              ? isDark
                ? 'bg-amber-900 text-amber-200 border border-amber-700'
                : 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
              : isDark
              ? 'bg-slate-800/80 text-amber-400 hover:text-amber-300'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <Clock className="h-3 w-3" />
          <span>सत्यापन लंबित वाले</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('stagnant')}
          className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
            filterMode === 'stagnant'
              ? isDark
                ? 'bg-rose-900 text-rose-200 border border-rose-700'
                : 'bg-rose-100 text-rose-900 border border-rose-300 font-semibold'
              : isDark
              ? 'bg-slate-800/80 text-rose-400 hover:text-rose-300'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>शून्य प्रगति वाले</span>
        </button>
      </div>

      {/* Cross-Date Matrix Table */}
      <div
        className={`overflow-x-auto rounded-xl border ${
          isDark ? 'border-slate-800' : 'border-slate-200 shadow-sm'
        }`}
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {/* Header row 1: Group columns */}
            <tr
              className={`border-b font-semibold uppercase tracking-wider ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <th className="py-2.5 px-3 w-10 text-center" rowSpan={2}>
                क्र.
              </th>
              <th className="py-2.5 px-3 min-w-[160px]" rowSpan={2}>
                हल्का पटवारी (Patwari Name)
              </th>
              <th className="py-2.5 px-3 text-center min-w-[80px]" rowSpan={2}>
                कुल ग्राम / भूखंड
              </th>

              {/* Dynamic date column groups */}
              {activeDates.map((d) => (
                <th
                  key={d}
                  colSpan={3}
                  className={`py-1.5 px-3 text-center border-l ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
                  }`}
                >
                  दिनांक: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{d}</span>
                </th>
              ))}

              {activeDates.length >= 2 && (
                <th
                  colSpan={2}
                  className={`py-1.5 px-3 text-center border-l font-bold ${
                    isDark
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  दैनिक बदलाव (Net Delta)
                </th>
              )}
            </tr>

            {/* Header row 2: Sub-columns for each date */}
            <tr
              className={`border-b text-[11px] ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {activeDates.map((d) => (
                <React.Fragment key={`sub-${d}`}>
                  <th
                    className={`py-1.5 px-2 text-right border-l font-medium ${
                      isDark
                        ? 'border-slate-800 text-amber-400'
                        : 'border-slate-200 text-amber-700'
                    }`}
                  >
                    प्रारंभ
                  </th>
                  <th
                    className={`py-1.5 px-2 text-right font-medium ${
                      isDark ? 'text-indigo-400' : 'text-indigo-700'
                    }`}
                  >
                    सत्यापित
                  </th>
                  <th
                    className={`py-1.5 px-2 text-right font-medium ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                  >
                    पूर्ण (%)
                  </th>
                </React.Fragment>
              ))}

              {activeDates.length >= 2 && (
                <>
                  <th
                    className={`py-1.5 px-2 text-right border-l font-medium ${
                      isDark
                        ? 'border-emerald-900/60 text-indigo-300'
                        : 'border-emerald-200 text-indigo-700'
                    }`}
                  >
                    &Delta; सत्यापन
                  </th>
                  <th
                    className={`py-1.5 px-2 text-right font-medium ${
                      isDark ? 'text-emerald-300' : 'text-emerald-700'
                    }`}
                  >
                    &Delta; पूर्ण
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody
            className={`divide-y ${
              isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}
          >
            {filteredRows.map((row, idx) => {
              const hasProgress = row.delta.completedDelta > 0 || row.delta.verificationDelta > 0;

              return (
                <tr
                  key={row.patwariName}
                  className={`transition-colors ${
                    isDark
                      ? hasProgress
                        ? 'bg-emerald-950/20 hover:bg-slate-800/50'
                        : 'hover:bg-slate-800/40'
                      : hasProgress
                      ? 'bg-emerald-50/50 hover:bg-emerald-100/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td
                    className={`py-2.5 px-3 text-center font-mono ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </td>

                  {/* Patwari name clickable */}
                  <td className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => onSelectPatwari(row.patwariName)}
                      className={`font-semibold transition text-left ${
                        isDark ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-600'
                      }`}
                    >
                      {row.patwariName}
                    </button>
                  </td>

                  {/* Village count & Plots */}
                  <td
                    className={`py-2.5 px-3 text-center font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <span className={isDark ? 'text-white font-medium' : 'text-slate-800 font-semibold'}>
                      {row.villagesCount}
                    </span>{' '}
                    ग्राम •{' '}
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      {row.totalPlots}
                    </span>
                  </td>

                  {/* Date columns */}
                  {activeDates.map((d) => {
                    const m = row.dateMetrics[d] || {
                      initiated: 0,
                      verified: 0,
                      completed: 0,
                      pctCompleted: 0,
                    };
                    return (
                      <React.Fragment key={`${row.patwariName}-${d}`}>
                        <td
                          className={`py-2.5 px-2 text-right font-mono font-medium border-l ${
                            isDark
                              ? 'border-slate-800/80 text-amber-400'
                              : 'border-slate-200 text-amber-700'
                          }`}
                        >
                          {m.initiated}
                        </td>
                        <td
                          className={`py-2.5 px-2 text-right font-mono font-medium ${
                            isDark ? 'text-indigo-400' : 'text-indigo-700'
                          }`}
                        >
                          {m.verified}
                        </td>
                        <td
                          className={`py-2.5 px-2 text-right font-mono font-bold ${
                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                          }`}
                        >
                          {m.completed}{' '}
                          <span
                            className={`text-[10px] font-normal ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            ({m.pctCompleted}%)
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Net Delta columns */}
                  {activeDates.length >= 2 && (
                    <>
                      <td
                        className={`py-2.5 px-2 text-right font-mono font-bold border-l ${
                          isDark ? 'border-emerald-900/40' : 'border-emerald-200'
                        }`}
                      >
                        {row.delta.verificationDelta > 0 ? (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              isDark
                                ? 'text-indigo-400 bg-indigo-950/80 border-indigo-800'
                                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                            }`}
                          >
                            +{row.delta.verificationDelta}
                          </span>
                        ) : (
                          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold">
                        {row.delta.completedDelta > 0 ? (
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              isDark
                                ? 'text-emerald-300 bg-emerald-950/80 border-emerald-700'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            +{row.delta.completedDelta}
                          </span>
                        ) : (
                          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>0</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRows.length === 0 && (
        <div className="py-8 text-center text-slate-500 text-xs">
          चयनित फ़िल्टर के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है।
        </div>
      )}
    </div>
  );
};
