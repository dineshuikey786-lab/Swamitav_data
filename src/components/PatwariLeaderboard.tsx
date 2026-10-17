import React, { useState } from 'react';
import {
  PatwariSummary,
  PeriodComparison,
} from '../utils/patwariAnalytics';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserX,
  FileText,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface PatwariLeaderboardProps {
  summaries: PatwariSummary[];
  comparison: PeriodComparison;
  selectedPeriod: 'day' | 'week' | 'month';
  onSelectPatwari: (patwariName: string) => void;
}

export const PatwariLeaderboard: React.FC<PatwariLeaderboardProps> = ({
  summaries,
  comparison,
  selectedPeriod,
  onSelectPatwari,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'completed' | 'verified' | 'initiated' | 'plots' | 'delta'>('completed');

  // Filtered summaries
  const filtered = summaries.filter((item) => {
    const matchesSearch = item.patwariName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedTier === 'high') return item.performanceTier === 'high';
    if (selectedTier === 'moderate') return item.performanceTier === 'moderate';
    if (selectedTier === 'lagging') return item.performanceTier === 'lagging';
    if (selectedTier === 'critical') return item.performanceTier === 'critical';
    return true;
  });

  // Sorted summaries
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'completed') {
      if (b.completed !== a.completed) return b.completed - a.completed;
      return b.pctCompleted - a.pctCompleted;
    }
    if (sortBy === 'verified') return b.patwariVerification - a.patwariVerification;
    if (sortBy === 'initiated') return b.registryInitiated - a.registryInitiated;
    if (sortBy === 'plots') return b.totalPlots - a.totalPlots;
    if (sortBy === 'delta') {
      const deltaA = a.dailyDelta.completedDelta + a.dailyDelta.verificationDelta;
      const deltaB = b.dailyDelta.completedDelta + b.dailyDelta.verificationDelta;
      return deltaB - deltaA;
    }
    return 0;
  });

  return (
    <div
      className={`border rounded-2xl p-5 shadow-sm transition ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span>पटवारी प्रगति लीडरबोर्ड (Patwari Progress &amp; Rankings)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <span className="font-mono font-bold">{summaries.length}</span> कुल पटवारी
            </span>
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            प्रत्येक पटवारी का दैनिक बदलाव, सत्यापन स्थिति एवं पूर्णता प्रतिशत की रीयल-टाइम समीक्षा
          </p>
        </div>

        {/* Search, Filter & Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className={`h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="पटवारी नाम खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-8 pr-3 py-1.5 border text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-52 ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Tier Filter Tabs */}
          <div
            className={`p-1 rounded-xl border flex items-center text-xs ${
              isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedTier('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                selectedTier === 'all'
                  ? isDark
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-slate-900 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सभी ({summaries.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('high')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                selectedTier === 'high'
                  ? isDark
                    ? 'bg-emerald-800/80 text-emerald-200'
                    : 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-emerald-600 dark:text-emerald-400 hover:underline'
              }`}
            >
              उत्कृष्ट ({summaries.filter((s) => s.performanceTier === 'high').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('lagging')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                selectedTier === 'lagging'
                  ? isDark
                    ? 'bg-amber-800/80 text-amber-200'
                    : 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-amber-600 dark:text-amber-400 hover:underline'
              }`}
            >
              सत्यापन शेष ({summaries.filter((s) => s.performanceTier === 'lagging').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('critical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                selectedTier === 'critical'
                  ? isDark
                    ? 'bg-rose-900/80 text-rose-200'
                    : 'bg-rose-600 text-white shadow-sm font-bold'
                  : 'text-rose-600 dark:text-rose-400 hover:underline'
              }`}
            >
              शून्य प्रगति ({summaries.filter((s) => s.performanceTier === 'critical').length})
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="hidden sm:inline">क्रम:</span>
            <label htmlFor="sort-by-select" className="sr-only">
              क्रमबद्ध करें
            </label>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className={`border text-xs rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <option value="completed">पूर्ण कार्य (Completed)</option>
              <option value="verified">सत्यापन (Verified)</option>
              <option value="initiated">प्रारंभ आवेदन (Initiated)</option>
              <option value="plots">कुल भूखंड (Plots)</option>
              <option value="delta">दैनिक बदलाव (Today Delta)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Patwari Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {sorted.map((patwari, rank) => {
          const deltaSum = patwari.dailyDelta.completedDelta + patwari.dailyDelta.verificationDelta;
          const hasZeroProgress = patwari.performanceTier === 'critical';

          return (
            <div
              key={patwari.patwariName}
              onClick={() => onSelectPatwari(patwari.patwariName)}
              className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                isDark
                  ? patwari.completed > 0
                    ? 'bg-gradient-to-b from-slate-900 to-emerald-950/20 border-emerald-900/50 hover:border-emerald-500/70'
                    : hasZeroProgress
                    ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  : patwari.completed > 0
                  ? 'bg-gradient-to-b from-emerald-50/40 to-white border-emerald-300 hover:border-emerald-500 shadow-sm'
                  : hasZeroProgress
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-6 w-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center border ${
                        isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      #{rank + 1}
                    </span>
                    <div>
                      <h3
                        className={`text-sm font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition flex items-center gap-1.5 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {patwari.patwariName}
                      </h3>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {patwari.villagesCount} आवंटित गांव • {patwari.totalPlots} कुल भूखंड
                      </p>
                    </div>
                  </div>

                  {/* Tier Badge */}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      patwari.performanceTier === 'high'
                        ? isDark
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                        : patwari.performanceTier === 'moderate'
                        ? isDark
                          ? 'bg-blue-950 text-blue-300 border-blue-700'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                        : patwari.performanceTier === 'lagging'
                        ? isDark
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                        : isDark
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {patwari.performanceTier === 'high'
                      ? 'उत्कृष्ट'
                      : patwari.performanceTier === 'moderate'
                      ? 'प्रगतिरत'
                      : patwari.performanceTier === 'lagging'
                      ? 'सत्यापन शेष'
                      : 'शून्य प्रगति'}
                  </span>
                </div>

                {/* Progress Indicators */}
                <div
                  className={`grid grid-cols-3 gap-2 my-3 p-2 rounded-xl border text-center ${
                    isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">प्रारंभ</div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {patwari.registryInitiated}
                    </div>
                  </div>
                  <div className={`border-x ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="text-[10px] text-slate-500 font-medium">सत्यापित</div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {patwari.patwariVerification}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">पूर्ण पंजीयन</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {patwari.completed}
                    </div>
                  </div>
                </div>

                {/* Completion Progress Bar */}
                <div className="space-y-1">
                  <div className={`flex justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>प्रगति दर:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {patwari.pctCompleted}%
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(patwari.pctCompleted, 2))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row / Daily Delta & CTA */}
              <div
                className={`mt-3.5 pt-2.5 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200/80'
                }`}
              >
                <div>
                  {deltaSum > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                      <TrendingUp className="h-3 w-3" />
                      +{deltaSum} आज की गति (Delta)
                    </span>
                  ) : hasZeroProgress ? (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="h-3 w-3" />
                      समीक्षा नोटिस अपेक्षित
                    </span>
                  ) : (
                    <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      लंबित सत्यापन: {patwari.pendingVerification}
                    </span>
                  )}
                </div>

                <div
                  className={`flex items-center font-medium text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <span>विवरण</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="py-12 text-center text-slate-500 text-sm">
          कोई पटवारी नहीं मिला। खोज शब्द या फ़िल्टर बदलें।
        </div>
      )}
    </div>
  );
};
