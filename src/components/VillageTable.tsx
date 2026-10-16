import React, { useState, useMemo } from 'react';
import {
  PatwariRecord,
  filterRecordsMulti,
  groupRecordsByPatwari,
  getAvailableDates,
} from '../utils/patwariAnalytics';
import { MultiSelectDropdown, MultiSelectOption } from './MultiSelectDropdown';
import {
  Search,
  Download,
  Edit2,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  User,
  ListFilter,
  Calendar,
  Users,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface VillageTableProps {
  records: PatwariRecord[];
  allPatwaris: string[];
  allDates?: string[];
  onEditRecord: (record: PatwariRecord) => void;
  onSelectPatwari: (patwariName: string) => void;
}

export const VillageTable: React.FC<VillageTableProps> = ({
  records,
  allPatwaris,
  allDates = [],
  onEditRecord,
  onSelectPatwari,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatwaris, setSelectedPatwaris] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'zero' | 'active' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped'); // default patwariwise grouped

  // Pagination for flat table
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<keyof PatwariRecord>('plots');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Expanded patwari groups
  const [expandedPatwaris, setExpandedPatwaris] = useState<Set<string>>(new Set());

  // Available dates
  const datesList = useMemo(() => {
    return allDates.length > 0 ? allDates : getAvailableDates(records);
  }, [allDates, records]);

  // Patwari options for multi-dropdown
  const patwariOptions: MultiSelectOption[] = useMemo(() => {
    return allPatwaris.map((p) => {
      const count = records.filter((r) => r.patwariName.trim() === p).length;
      return {
        value: p,
        label: p,
        count,
      };
    });
  }, [allPatwaris, records]);

  // Date options for multi-dropdown
  const dateOptions: MultiSelectOption[] = useMemo(() => {
    return datesList.map((d) => ({
      value: d,
      label: d,
    }));
  }, [datesList]);

  // Filtered records using multi-filter
  const filtered = useMemo(() => {
    return filterRecordsMulti(records, {
      patwaris: selectedPatwaris,
      dates: selectedDates,
      statusFilter,
      searchTerm,
    });
  }, [records, selectedPatwaris, selectedDates, statusFilter, searchTerm]);

  // Filtered groups by Patwari
  const patwariGroups = useMemo(() => {
    return groupRecordsByPatwari(filtered);
  }, [filtered]);

  // Initialize expanded groups when groups change or on first load
  const togglePatwariExpand = (pName: string) => {
    setExpandedPatwaris((prev) => {
      const next = new Set(prev);
      if (next.has(pName)) {
        next.delete(pName);
      } else {
        next.add(pName);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allNames = new Set(patwariGroups.map((g) => g.patwariName));
    setExpandedPatwaris(allNames);
  };

  const handleCollapseAll = () => {
    setExpandedPatwaris(new Set());
  };

  // Sort flat records
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA);
      const strB = String(valB);
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filtered, sortField, sortAsc]);

  // Summary stats of currently filtered selection
  const filterStats = useMemo(() => {
    let plots = 0;
    let beneficiaries = 0;
    let initiated = 0;
    let verified = 0;
    let completed = 0;

    for (const r of filtered) {
      plots += r.plots;
      beneficiaries += r.beneficiaries;
      initiated += r.registryInitiated;
      verified += r.patwariVerification;
      completed += r.completed;
    }

    const pct = plots > 0 ? Math.round((completed / plots) * 10000) / 100 : 0;
    return { plots, beneficiaries, initiated, verified, completed, pct };
  }, [filtered]);

  // Flat pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof PatwariRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'S.No',
      'Village',
      'LGD Code',
      'Patwari Name',
      'Plots',
      'Beneficiaries',
      'Registry_Initiated',
      'Patwari_Verification',
      'Submitted',
      'Registration in',
      'Completed',
      '% Completed',
      'Date',
    ];

    const rows = sorted.map((r, i) => [
      i + 1,
      `"${r.village}"`,
      r.lgdCode,
      `"${r.patwariName}"`,
      r.plots,
      r.beneficiaries,
      r.registryInitiated,
      r.patwariVerification,
      r.submitted,
      r.registrationIn,
      r.completed,
      r.pctCompleted,
      r.date,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patwariwise_village_register_${new Date().toISOString().slice(0, 10)}.csv`);
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
      {/* Title & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>ग्रामवार राजस्व प्रगति रजिस्टर (Village-wise Register)</span>
            </h2>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200 font-semibold'
              }`}
            >
              {filtered.length} ग्राम • {patwariGroups.length} पटवारी
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            पटवारीवार समूहीकृत अथवा ग्राम सूची में बहु-चयन (Multi-Dropdown) फ़िल्टर सहित रीयल-टाइम मॉनिटरिंग
          </p>
        </div>

        {/* View Mode Toggle & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div
            className={`p-1 rounded-xl border flex items-center text-xs ${
              isDark
                ? 'bg-slate-800/90 border-slate-700/80'
                : 'bg-slate-100 border-slate-300/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === 'grouped'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              पटवारीवार समूह (Grouped)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === 'flat'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ग्राम सूची (Flat List)
            </button>
          </div>

          {/* Export CSV */}
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
            <span className="hidden sm:inline">रजिस्टर CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Dropdown Filters Row */}
      <div
        className={`flex flex-wrap items-center gap-2.5 pt-2 border-t ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}
      >
        {/* Search */}
        <div className="relative">
          <Search
            className={`h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
          <input
            type="text"
            placeholder="गांव / LGD / पटवारी खोजें..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`pl-8 pr-3 py-1.5 border text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-56 transition ${
              isDark
                ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-sm'
            }`}
          />
        </div>

        {/* Multi-Patwari Dropdown */}
        <MultiSelectDropdown
          label="पटवारी"
          allLabel="सभी पटवारी"
          options={patwariOptions}
          selectedValues={selectedPatwaris}
          onChange={(vals) => {
            setSelectedPatwaris(vals);
            setCurrentPage(1);
          }}
          icon={<Users className="h-3.5 w-3.5 text-emerald-400" />}
        />

        {/* Multi-Date Dropdown */}
        <MultiSelectDropdown
          label="दिनांक"
          allLabel="सभी दिनांक"
          options={dateOptions}
          selectedValues={selectedDates}
          onChange={(vals) => {
            setSelectedDates(vals);
            setCurrentPage(1);
          }}
          icon={<Calendar className="h-3.5 w-3.5 text-blue-400" />}
        />

        {/* Status Dropdown */}
        <label htmlFor="village-status-select" className="sr-only">स्थिति चुनें</label>
        <select
          id="village-status-select"
          value={statusFilter}
          onChange={(e: any) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className={`border text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer transition ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-300 text-slate-800 shadow-sm'
          }`}
        >
          <option value="all">सभी स्थिति (All Status)</option>
          <option value="completed">पूर्ण पंजीयन (&gt;0)</option>
          <option value="active">प्रक्रियाधीन (Active)</option>
          <option value="zero">शून्य प्रगति (Zero Progress)</option>
        </select>

        {/* Group view controls: Expand/Collapse All */}
        {viewMode === 'grouped' && patwariGroups.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto text-xs">
            <button
              type="button"
              onClick={handleExpandAll}
              className={`px-2.5 py-1 rounded-lg transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              सभी खोलें (Expand All)
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className={`px-2.5 py-1 rounded-lg transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              समेटें (Collapse)
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Strip for Current Selection */}
      <div
        className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark
            ? 'bg-slate-950/80 border-slate-800/80'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            फ़िल्टर सारांश:
          </span>
          <span>{filtered.length} ग्राम</span>
          <span>•</span>
          <span>{filterStats.plots.toLocaleString()} कुल भूखंड</span>
          <span>•</span>
          <span>{filterStats.beneficiaries.toLocaleString()} हितग्राही</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`font-mono font-medium ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            प्रारंभ: {filterStats.initiated}
          </span>
          <span
            className={`font-mono font-medium ${
              isDark ? 'text-indigo-400' : 'text-indigo-700'
            }`}
          >
            सत्यापित: {filterStats.verified}
          </span>
          <span
            className={`font-mono font-bold ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            पूर्ण: {filterStats.completed} ({filterStats.pct}%)
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: Grouped by Patwari (Accordion) */}
      {viewMode === 'grouped' && (
        <div className="space-y-3">
          {patwariGroups.map((group) => {
            // Default expanded if only 1-3 groups or explicitly in set
            const isExpanded =
              expandedPatwaris.has(group.patwariName) ||
              (patwariGroups.length <= 3 && !expandedPatwaris.has(`collapsed-${group.patwariName}`));

            return (
              <div
                key={group.patwariName}
                className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                  isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                {/* Patwari Group Header Card */}
                <div
                  onClick={() => togglePatwariExpand(group.patwariName)}
                  className={`p-3.5 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b transition-colors ${
                    isDark
                      ? 'bg-slate-900/90 hover:bg-slate-800/60 border-slate-800/80'
                      : 'bg-slate-50/90 hover:bg-slate-100/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`p-1 rounded-lg transition ${
                        isDark
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200 shadow-xs'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-bold transition ${
                            isDark ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-600'
                          }`}
                        >
                          {group.patwariName}
                        </h3>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {group.villages.length} ग्राम
                        </span>
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {group.totalPlots} कुल भूखंड • {group.totalBeneficiaries} हितग्राही
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Pills for this Patwari */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <div
                      className={`px-2.5 py-1 rounded-lg border text-center ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        प्रारंभ
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isDark ? 'text-amber-400' : 'text-amber-700'
                        }`}
                      >
                        {group.registryInitiated}
                      </span>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-lg border text-center ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        सत्यापित
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isDark ? 'text-indigo-400' : 'text-indigo-700'
                        }`}
                      >
                        {group.patwariVerification}
                      </span>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-lg border text-center ${
                        isDark
                          ? 'bg-emerald-950/40 border-emerald-900/60'
                          : 'bg-emerald-50 border-emerald-200 shadow-xs'
                      }`}
                    >
                      <span
                        className={`text-[10px] block ${
                          isDark ? 'text-emerald-400/80' : 'text-emerald-700 font-medium'
                        }`}
                      >
                        पूर्ण पंजीयन
                      </span>
                      <span
                        className={`font-mono font-black ${
                          isDark ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      >
                        {group.completed} ({group.pctCompleted}%)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatwari(group.patwariName);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 shadow-xs'
                      }`}
                    >
                      स्कोरकार्ड &rarr;
                    </button>
                  </div>
                </div>

                {/* Expanded Villages Table */}
                {isExpanded && (
                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr
                          className={`font-semibold uppercase tracking-wider text-[11px] border-b ${
                            isDark
                              ? 'text-slate-400 border-slate-800/80 bg-slate-950/40'
                              : 'text-slate-600 border-slate-200 bg-slate-50'
                          }`}
                        >
                          <th className="py-2 px-3">ग्राम (Village)</th>
                          <th className="py-2 px-3">LGD कोड</th>
                          <th className="py-2 px-3 text-right">भूखंड</th>
                          <th className="py-2 px-3 text-right">हितग्राही</th>
                          <th
                            className={`py-2 px-3 text-right font-medium ${
                              isDark ? 'text-amber-400' : 'text-amber-700'
                            }`}
                          >
                            प्रारंभ
                          </th>
                          <th
                            className={`py-2 px-3 text-right font-medium ${
                              isDark ? 'text-indigo-400' : 'text-indigo-700'
                            }`}
                          >
                            सत्यापित
                          </th>
                          <th
                            className={`py-2 px-3 text-right font-medium ${
                              isDark ? 'text-emerald-400' : 'text-emerald-700'
                            }`}
                          >
                            पूर्ण पंजीयन
                          </th>
                          <th
                            className={`py-2 px-3 text-right font-medium ${
                              isDark ? 'text-emerald-400' : 'text-emerald-700'
                            }`}
                          >
                            प्रगति %
                          </th>
                          <th className="py-2 px-3 text-center">क्रिया</th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                        }`}
                      >
                        {group.villages.map((v) => {
                          const isDone = v.completed > 0;
                          return (
                            <tr
                              key={v.id}
                              className={`transition-colors ${
                                isDark
                                  ? isDone
                                    ? 'bg-emerald-950/15 hover:bg-slate-800/50'
                                    : 'hover:bg-slate-800/40'
                                  : isDone
                                  ? 'bg-emerald-50/50 hover:bg-emerald-100/40'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td
                                className={`py-2 px-3 font-hindi font-medium flex items-center gap-1.5 ${
                                  isDark ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                <MapPin
                                  className={`h-3.5 w-3.5 ${
                                    isDark ? 'text-slate-500' : 'text-slate-400'
                                  }`}
                                />
                                <span>{v.village}</span>
                              </td>
                              <td
                                className={`py-2 px-3 font-mono ${
                                  isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {v.lgdCode}
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono font-semibold ${
                                  isDark ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {v.plots}
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono ${
                                  isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {v.beneficiaries}
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono font-medium ${
                                  isDark ? 'text-amber-400' : 'text-amber-700'
                                }`}
                              >
                                {v.registryInitiated}
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono font-medium ${
                                  isDark ? 'text-indigo-400' : 'text-indigo-700'
                                }`}
                              >
                                {v.patwariVerification}
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono font-bold ${
                                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                                }`}
                              >
                                {v.completed}
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    v.pctCompleted > 0
                                      ? isDark
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isDark
                                      ? 'text-slate-500'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {v.pctCompleted}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => onEditRecord(v)}
                                  className={`p-1 rounded-lg transition ${
                                    isDark
                                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                      : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
                                  }`}
                                  title="संपादित करें"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: Flat Village Table with Pagination */}
      {viewMode === 'flat' && (
        <div className="space-y-3">
          <div
            className={`overflow-x-auto rounded-xl border ${
              isDark ? 'border-slate-800' : 'border-slate-200 shadow-sm'
            }`}
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-semibold uppercase tracking-wider ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="py-2.5 px-3 w-12 text-center">क्र.</th>
                  <th
                    onClick={() => handleSort('village')}
                    className={`py-2.5 px-3 cursor-pointer ${
                      isDark ? 'hover:text-white' : 'hover:text-slate-900'
                    }`}
                  >
                    गांव का नाम (Village) {sortField === 'village' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('lgdCode')}
                    className={`py-2.5 px-3 cursor-pointer ${
                      isDark ? 'hover:text-white' : 'hover:text-slate-900'
                    }`}
                  >
                    LGD कोड
                  </th>
                  <th
                    onClick={() => handleSort('patwariName')}
                    className={`py-2.5 px-3 cursor-pointer ${
                      isDark ? 'hover:text-white' : 'hover:text-slate-900'
                    }`}
                  >
                    प्रभारी पटवारी {sortField === 'patwariName' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('plots')}
                    className={`py-2.5 px-3 text-right cursor-pointer ${
                      isDark ? 'hover:text-white' : 'hover:text-slate-900'
                    }`}
                  >
                    भूखंड (Plots) {sortField === 'plots' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('beneficiaries')}
                    className={`py-2.5 px-3 text-right cursor-pointer ${
                      isDark ? 'hover:text-white' : 'hover:text-slate-900'
                    }`}
                  >
                    हितग्राही
                  </th>
                  <th
                    onClick={() => handleSort('registryInitiated')}
                    className={`py-2.5 px-3 text-right cursor-pointer ${
                      isDark ? 'hover:text-amber-300 text-amber-400' : 'hover:text-amber-800 text-amber-700'
                    }`}
                  >
                    प्रारंभ {sortField === 'registryInitiated' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('patwariVerification')}
                    className={`py-2.5 px-3 text-right cursor-pointer ${
                      isDark ? 'hover:text-indigo-300 text-indigo-400' : 'hover:text-indigo-800 text-indigo-700'
                    }`}
                  >
                    सत्यापित {sortField === 'patwariVerification' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('completed')}
                    className={`py-2.5 px-3 text-right cursor-pointer ${
                      isDark ? 'hover:text-emerald-300 text-emerald-400' : 'hover:text-emerald-800 text-emerald-700'
                    }`}
                  >
                    पूर्ण {sortField === 'completed' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('pctCompleted')}
                    className={`py-2.5 px-3 text-right cursor-pointer ${
                      isDark ? 'hover:text-emerald-300 text-emerald-400' : 'hover:text-emerald-800 text-emerald-700'
                    }`}
                  >
                    प्रगति % {sortField === 'pctCompleted' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-3 text-center">क्रिया</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-700'
                }`}
              >
                {paginated.map((rec, index) => {
                  const rowNum = (currentPage - 1) * pageSize + index + 1;
                  const isCompleted = rec.completed > 0;
                  const isZero =
                    rec.registryInitiated === 0 &&
                    rec.patwariVerification === 0 &&
                    rec.completed === 0;

                  return (
                    <tr
                      key={rec.id}
                      className={`transition-colors ${
                        isDark
                          ? isCompleted
                            ? 'bg-emerald-950/15 hover:bg-slate-800/50'
                            : isZero
                            ? 'bg-slate-900/40 hover:bg-slate-800/30'
                            : 'hover:bg-slate-800/40'
                          : isCompleted
                          ? 'bg-emerald-50/50 hover:bg-emerald-100/40'
                          : isZero
                          ? 'bg-slate-50 hover:bg-slate-100/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td
                        className={`py-2.5 px-3 text-center font-mono ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {rowNum}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-medium flex items-center gap-1.5 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        <MapPin
                          className={`h-3.5 w-3.5 flex-shrink-0 ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        />
                        <span className="font-hindi text-sm">{rec.village}</span>
                      </td>
                      <td
                        className={`py-2.5 px-3 font-mono ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {rec.lgdCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => onSelectPatwari(rec.patwariName)}
                          className={`font-medium underline-offset-2 hover:underline text-left ${
                            isDark
                              ? 'text-slate-300 hover:text-emerald-400'
                              : 'text-slate-700 hover:text-emerald-700'
                          }`}
                        >
                          {rec.patwariName}
                        </button>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-semibold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {rec.plots}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {rec.beneficiaries}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-semibold ${
                          isDark ? 'text-amber-400' : 'text-amber-700'
                        }`}
                      >
                        {rec.registryInitiated}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-semibold ${
                          isDark ? 'text-indigo-400' : 'text-indigo-700'
                        }`}
                      >
                        {rec.patwariVerification}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          isDark ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      >
                        {rec.completed}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            rec.pctCompleted >= 5
                              ? isDark
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec.pctCompleted > 0
                              ? isDark
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isDark
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {rec.pctCompleted}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onEditRecord(rec)}
                          className={`p-1 rounded-lg transition ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                              : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
                          }`}
                          title="संपादित करें"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Flat Pagination Footer */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>पृष्ठ आकार:</span>
              <label htmlFor="flat-page-size-select" className="sr-only">पृष्ठ आकार चुनें</label>
              <select
                id="flat-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`border rounded-lg px-2 py-1 text-xs focus:outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800 shadow-xs'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>
                दर्शाए गए {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, sorted.length)} कुल {sorted.length} में से
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-2.5 py-1 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs'
                }`}
              >
                पिछला
              </button>
              <span className="px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-2.5 py-1 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs'
                }`}
              >
                अगला
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-500 text-xs">
          कोई ग्राम रिकॉर्ड नहीं मिला। कृपया बहु-चयन फ़िल्टर या खोज शब्द बदलें।
        </div>
      )}
    </div>
  );
};
