import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Target,
  Sparkles,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Users,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  OverallKpis,
  PatwariSummary,
  PatwariRecord,
  calculateDateTrends,
  calculateStatusSlices,
  DateTrendPoint,
  StatusSlice,
} from '../utils/patwariAnalytics';

interface ModernGlassmorphicChartsProps {
  kpis: OverallKpis;
  summaries: PatwariSummary[];
  allRecords: PatwariRecord[];
  selectedDate: string;
  onSelectPatwari?: (patwariName: string) => void;
}

type ActiveChartTab = 'all' | 'bar' | 'pie' | 'trend' | 'donut';
type BarMetric = 'completed' | 'verification' | 'initiated' | 'pct';

export const ModernGlassmorphicCharts: React.FC<ModernGlassmorphicChartsProps> = ({
  kpis,
  summaries,
  allRecords,
  selectedDate,
  onSelectPatwari,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<ActiveChartTab>('all');
  const [barMetric, setBarMetric] = useState<BarMetric>('completed');
  const [barLimit, setBarLimit] = useState<number>(8);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [activeTrendSeries, setActiveTrendSeries] = useState<'all' | 'completed' | 'verified' | 'initiated'>('all');

  const [barSortMode, setBarSortMode] = useState<'top' | 'bottom'>('top');

  // Compute trend data across dates
  const trendData = useMemo(() => calculateDateTrends(allRecords), [allRecords]);

  // Compute status distribution slices for pie & donut
  const statusSlices = useMemo(() => calculateStatusSlices(kpis, 'pipeline'), [kpis]);

  // Top or Bottom Patwaris data for Bar Chart
  const barChartData = useMemo(() => {
    const list = [...summaries];
    if (barMetric === 'completed') {
      list.sort((a, b) => (barSortMode === 'top' ? b.completed - a.completed : a.completed - b.completed));
    } else if (barMetric === 'verification') {
      list.sort((a, b) => (barSortMode === 'top' ? b.patwariVerification - a.patwariVerification : a.patwariVerification - b.patwariVerification));
    } else if (barMetric === 'initiated') {
      list.sort((a, b) => (barSortMode === 'top' ? b.registryInitiated - a.registryInitiated : a.registryInitiated - b.registryInitiated));
    } else {
      list.sort((a, b) => (barSortMode === 'top' ? b.pctCompleted - a.pctCompleted : a.pctCompleted - b.pctCompleted));
    }
    return list.slice(0, barLimit);
  }, [summaries, barMetric, barLimit, barSortMode]);

  const maxBarValue = useMemo(() => {
    if (barChartData.length === 0) return 1;
    if (barMetric === 'completed') {
      return Math.max(...barChartData.map((d) => d.completed), 1);
    }
    if (barMetric === 'verification') {
      return Math.max(...barChartData.map((d) => d.patwariVerification), 1);
    }
    if (barMetric === 'initiated') {
      return Math.max(...barChartData.map((d) => d.registryInitiated), 1);
    }
    return Math.max(...barChartData.map((d) => d.pctCompleted), 1);
  }, [barChartData, barMetric]);

  // Helper for SVG Pie Chart Angles
  const pieSlices = useMemo(() => {
    const total = statusSlices.reduce((sum, s) => sum + s.count, 0) || 1;
    let accumulatedAngle = 0;

    return statusSlices.map((slice) => {
      const angle = (slice.count / total) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const r = 95;
      const cx = 110;
      const cy = 110;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData =
        slice.count === 0
          ? ''
          : angle >= 359.9
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        ...slice,
        startAngle,
        endAngle,
        pathData,
      };
    });
  }, [statusSlices]);

  // Donut chart calculations
  const donutRadius = 78;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const completionPercentage = Math.min(100, Math.max(0, kpis.pctCompleted));
  const completionOffset = donutCircumference - (completionPercentage / 100) * donutCircumference;

  const verificationPct = kpis.totalPlots > 0 ? (kpis.patwariVerification / kpis.totalPlots) * 100 : 0;
  const outerRadius = 92;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerOffset = outerCircumference - (Math.min(100, verificationPct) / 100) * outerCircumference;

  // Trend line SVG coordinates calculation
  const trendSvgMetrics = useMemo(() => {
    if (trendData.length === 0) return null;
    const width = 480;
    const height = 190;
    const padX = 40;
    const padY = 30;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const maxVal = Math.max(
      ...trendData.map((d) => Math.max(d.registryInitiated, d.patwariVerification, d.completed, 10))
    ) * 1.15;

    const getX = (idx: number) => {
      if (trendData.length <= 1) return padX + chartW / 2;
      return padX + (idx / (trendData.length - 1)) * chartW;
    };

    const getY = (val: number) => {
      return height - padY - (val / maxVal) * chartH;
    };

    const createSmoothPath = (values: number[]) => {
      if (values.length === 0) return '';
      const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
      if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return d;
    };

    const createAreaPath = (linePath: string, values: number[]) => {
      if (!linePath || values.length === 0) return '';
      const firstX = getX(0);
      const lastX = getX(values.length - 1);
      const bottomY = height - padY;
      return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };

    const compVals = trendData.map((d) => d.completed);
    const verifVals = trendData.map((d) => d.patwariVerification);
    const initVals = trendData.map((d) => d.registryInitiated);

    const compLine = createSmoothPath(compVals);
    const verifLine = createSmoothPath(verifVals);
    const initLine = createSmoothPath(initVals);

    const compArea = createAreaPath(compLine, compVals);
    const verifArea = createAreaPath(verifLine, verifVals);
    const initArea = createAreaPath(initLine, initVals);

    return {
      width,
      height,
      padX,
      padY,
      chartW,
      chartH,
      maxVal,
      getX,
      getY,
      compLine,
      verifLine,
      initLine,
      compArea,
      verifArea,
      initArea,
    };
  }, [trendData]);

  return (
    <section className="space-y-4">
      {/* Glassmorphic Section Header & Controls */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 border backdrop-blur-xl transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/65 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]'
            : 'bg-white/75 border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
        }`}
      >
        {/* Ambient frosted glass glow effects in background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-center shadow-inner border ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border-white/10 text-emerald-300'
                  : 'bg-gradient-to-br from-indigo-50 to-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-lg font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  आधुनिक विजुअल एनालिटिक्स (Glassmorphic Visual Analytics)
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md ${
                    isDark
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                  }`}
                >
                  लाइव ग्रेडिएंट्स
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                बार चार्ट, पाई चार्ट, ट्रेंड लाइन एवं डोनट चार्ट द्वारा राजस्व प्रगति का 360° विश्लेषण
              </p>
            </div>
          </div>

          {/* Chart View Mode Switcher Pills */}
          <div
            className={`flex items-center p-1 rounded-2xl border backdrop-blur-lg self-start md:self-auto overflow-x-auto max-w-full ${
              isDark ? 'bg-slate-800/60 border-white/10' : 'bg-slate-100/80 border-slate-200'
            }`}
          >
            {[
              { id: 'all', label: 'समग्र (All 4)', icon: Layers },
              { id: 'bar', label: 'बार चार्ट', icon: BarChart3 },
              { id: 'pie', label: 'पाई चार्ट', icon: PieIcon },
              { id: 'trend', label: 'ट्रेंड लाइन', icon: TrendingUp },
              { id: 'donut', label: 'डोनट चार्ट', icon: Target },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ActiveChartTab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Charts Container */}
      <div
        className={`grid gap-5 ${
          activeTab === 'all'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {/* CHART 1: Modern Bar Chart (पटवारी व ग्राम तुलनात्मक बार चार्ट) */}
        {(activeTab === 'all' || activeTab === 'bar') && (
          <div
            className={`relative overflow-hidden rounded-3xl p-5 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-white/10 hover:border-emerald-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                : 'bg-white/70 border-white/80 hover:border-emerald-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]'
            }`}
          >
            {/* Header with Metric Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-sm">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    पटवारी प्रदर्शन तुलनात्मक बार चार्ट (Performance Bar Chart)
                  </h3>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  दिनांक {selectedDate} अनुसार शीर्ष राजस्व पटवारियों का ग्रेडिएंट बार ग्राफ
                </p>
              </div>

              {/* Metric filter pills & Top/Bottom toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`flex items-center p-0.5 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-white/10' : 'bg-slate-100/80 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setBarSortMode('top')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      barSortMode === 'top'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    शीर्ष (Top)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarSortMode('bottom')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      barSortMode === 'bottom'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    निचले (Bottom)
                  </button>
                </div>

                <div
                  className={`flex items-center p-0.5 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-white/10' : 'bg-slate-100/80 border-slate-200'
                  }`}
                >
                  {[
                    { id: 'completed', label: 'पूर्ण' },
                    { id: 'verification', label: 'सत्यापन' },
                    { id: 'initiated', label: 'प्रारंभ' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setBarMetric(m.id as BarMetric)}
                      className={`px-2 py-1 rounded-lg font-medium transition ${
                        barMetric === m.id
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SVG Responsive Bar Chart */}
            <div className="relative my-2 w-full">
              <svg viewBox="0 0 540 260" className="w-full h-auto overflow-visible select-none">
                <defs>
                  {/* Modern Neon & Jewel Linear Gradients */}
                  <linearGradient id="barGradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="barGradEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="barGradAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="barGradViolet" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>

                  {/* Soft glow shadow for bars */}
                  <filter id="barGlow" x="-10%" y="-20%" width="120%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.35" />
                  </filter>
                </defs>

                {/* Vertical Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const x = 150 + pct * 340;
                  const val = Math.round(pct * maxBarValue);
                  return (
                    <g key={idx}>
                      <line
                        x1={x}
                        y1="10"
                        x2={x}
                        y2="240"
                        stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                        strokeDasharray="3 3"
                      />
                      <text
                        x={x}
                        y="255"
                        textAnchor="middle"
                        fontSize="9"
                        fill={isDark ? '#64748b' : '#94a3b8'}
                        className="font-mono font-medium"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars per Patwari */}
                {barChartData.map((item, idx) => {
                  const y = 20 + idx * 28;
                  const rawVal =
                    barMetric === 'completed'
                      ? item.completed
                      : barMetric === 'verification'
                      ? item.patwariVerification
                      : item.registryInitiated;

                  const barWidth = Math.max(4, (rawVal / maxBarValue) * 340);
                  const isHovered = hoveredBarIndex === idx;

                  // Choose gradient based on sort mode and metric
                  const gradId =
                    barSortMode === 'bottom'
                      ? 'url(#barGradAmber)'
                      : barMetric === 'completed'
                      ? 'url(#barGradEmerald)'
                      : barMetric === 'verification'
                      ? 'url(#barGradViolet)'
                      : 'url(#barGradAmber)';

                  return (
                    <g
                      key={item.patwariName}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      onClick={() => onSelectPatwari?.(item.patwariName)}
                    >
                      {/* Patwari Rank and Name label */}
                      <text
                        x="10"
                        y={y + 13}
                        fontSize="11"
                        fontWeight={isHovered ? '700' : '500'}
                        fill={isHovered ? (isDark ? '#38bdf8' : '#0284c7') : isDark ? '#e2e8f0' : '#1e293b'}
                        className="transition-colors"
                      >
                        <tspan fill={idx < 3 ? '#eab308' : isDark ? '#64748b' : '#94a3b8'} fontWeight="bold">
                          #{idx + 1}{' '}
                        </tspan>
                        {item.patwariName.length > 14
                          ? item.patwariName.slice(0, 14) + '…'
                          : item.patwariName}
                      </text>

                      {/* Glass Track background */}
                      <rect
                        x="150"
                        y={y}
                        width="340"
                        height="18"
                        rx="7"
                        ry="7"
                        fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                        stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                      />

                      {/* Gradient Bar */}
                      <rect
                        x="150"
                        y={y}
                        width={barWidth}
                        height="18"
                        rx="7"
                        ry="7"
                        fill={gradId}
                        filter={isHovered ? 'url(#barGlow)' : undefined}
                        opacity={isHovered ? 1 : 0.9}
                        className="transition-all duration-300"
                      />

                      {/* Value & Count Label inside or right next to bar */}
                      <text
                        x={150 + barWidth + 8}
                        y={y + 13}
                        fontSize="11"
                        fontWeight="bold"
                        fill={isDark ? '#f8fafc' : '#0f172a'}
                        className="font-mono"
                      >
                        {rawVal}
                        <tspan fontSize="9" fontWeight="normal" fill={isDark ? '#94a3b8' : '#64748b'}>
                          {' '}({item.villagesCount} ग्राम)
                        </tspan>
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Glass Tooltip if hovered */}
              {hoveredBarIndex !== null && barChartData[hoveredBarIndex] && (
                <div
                  className={`absolute top-2 right-2 p-3 rounded-2xl border backdrop-blur-xl shadow-xl text-xs z-20 pointer-events-none transition-all ${
                    isDark
                      ? 'bg-slate-900/90 border-cyan-500/30 text-white'
                      : 'bg-white/95 border-cyan-300 text-slate-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-cyan-400">
                    <span>{barChartData[hoveredBarIndex].patwariName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 font-mono">
                      हल्का {hoveredBarIndex + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5 text-[11px]">
                    <div className="text-slate-400">कुल भूखंड:</div>
                    <div className="font-mono font-bold text-right">{barChartData[hoveredBarIndex].totalPlots}</div>

                    <div className="text-slate-400">पूर्ण पंजीयन:</div>
                    <div className="font-mono font-bold text-emerald-400 text-right">
                      {barChartData[hoveredBarIndex].completed}
                    </div>

                    <div className="text-slate-400">सत्यापन:</div>
                    <div className="font-mono font-bold text-indigo-400 text-right">
                      {barChartData[hoveredBarIndex].patwariVerification}
                    </div>

                    <div className="text-slate-400">प्रारंभ:</div>
                    <div className="font-mono font-bold text-amber-400 text-right">
                      {barChartData[hoveredBarIndex].registryInitiated}
                    </div>

                    <div className="text-slate-400">पूर्णता दर:</div>
                    <div className="font-mono font-bold text-cyan-300 text-right">
                      {barChartData[hoveredBarIndex].pctCompleted}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with quick action */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                क्लिक करके किसी भी पटवारी का विस्तृत ब्यौरा देखें
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>दिखाएं:</span>
                {[6, 8, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBarLimit(num)}
                    className={`px-2 py-0.5 rounded font-mono transition ${
                      barLimit === num
                        ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-bold'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHART 2: Modern Pie Chart (राजस्व प्रक्रिया समग्र वितरण पाई चार्ट) */}
        {(activeTab === 'all' || activeTab === 'pie') && (
          <div
            className={`relative overflow-hidden rounded-3xl p-5 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-white/10 hover:border-violet-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                : 'bg-white/70 border-white/80 hover:border-violet-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-sm">
                  <PieIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    राजस्व वितरण पाई चार्ट (Pipeline Distribution Pie Chart)
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    कुल {kpis.totalPlots.toLocaleString('en-IN')} भूखंडों की चरणबद्ध प्रक्रिया में हिस्सेदारी
                  </p>
                </div>
              </div>
            </div>

            {/* SVG Pie Chart & Glassmorphic Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
              <div className="relative">
                <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible select-none">
                  <defs>
                    <linearGradient id="pieGradCompleted" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="pieGradVerified" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="pieGradInitiated" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                    <linearGradient id="pieGradRemaining" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>

                    {/* Slice Glow */}
                    <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.4" />
                    </filter>
                  </defs>

                  {/* Pie Slices */}
                  {pieSlices.map((slice) => {
                    const isHovered = hoveredSlice === slice.id;
                    const grad =
                      slice.id === 'completed'
                        ? 'url(#pieGradCompleted)'
                        : slice.id === 'verified'
                        ? 'url(#pieGradVerified)'
                        : slice.id === 'initiated'
                        ? 'url(#pieGradInitiated)'
                        : 'url(#pieGradRemaining)';

                    return (
                      <path
                        key={slice.id}
                        d={slice.pathData}
                        fill={grad}
                        stroke={isHovered ? '#ffffff' : isDark ? '#0f172a' : '#ffffff'}
                        strokeWidth={isHovered ? '3' : '1.5'}
                        filter={isHovered ? 'url(#pieGlow)' : undefined}
                        className="cursor-pointer transition-all duration-300 hover:opacity-100 opacity-90"
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center glass reflection */}
                <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
              </div>

              {/* Legend with Frosted Glass Cards */}
              <div className="space-y-2 flex-1 w-full max-w-xs">
                {statusSlices.map((slice) => {
                  const isHovered = hoveredSlice === slice.id;
                  return (
                    <div
                      key={slice.id}
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`p-2 rounded-xl border backdrop-blur-md flex items-center justify-between cursor-pointer transition-all ${
                        isHovered
                          ? isDark
                            ? 'bg-white/10 border-white/30 scale-[1.02]'
                            : 'bg-white/90 border-slate-300 shadow-sm scale-[1.02]'
                          : isDark
                          ? 'bg-slate-800/40 border-white/5'
                          : 'bg-white/50 border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${slice.colorFrom}, ${slice.colorTo})`,
                          }}
                        />
                        <div>
                          <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {slice.labelHi}
                          </div>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {slice.label}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {slice.count.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400">
                          {slice.percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`text-center text-[11px] pt-2 border-t border-white/5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              सत्यापन एवं पूर्ण पंजीयन दोनों को मिलाकर कुल {kpis.patwariVerification} भूखंड फील्ड पर सत्यापित हैं
            </div>
          </div>
        )}

        {/* CHART 3: Modern Trend Line Chart (दिनांकवार प्रगति व त्वरण ट्रेंड लाइन) */}
        {(activeTab === 'all' || activeTab === 'trend') && (
          <div
            className={`relative overflow-hidden rounded-3xl p-5 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-white/10 hover:border-emerald-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                : 'bg-white/70 border-white/80 hover:border-emerald-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]'
            }`}
          >
            {/* Header & Series Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-sm">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    दैनिक प्रगति वक्र (Multi-Date Trend Line)
                  </h3>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  दिनांकवार पंजीयन वृद्धि, पटवारी सत्यापन एवं पूर्ण पंजीयन का स्मूथ ग्रेडिएंट वक्र
                </p>
              </div>

              {/* Series toggles */}
              <div
                className={`flex items-center p-0.5 rounded-xl border text-[11px] self-start sm:self-auto ${
                  isDark ? 'bg-slate-800/60 border-white/10' : 'bg-slate-100/80 border-slate-200'
                }`}
              >
                {[
                  { id: 'all', label: 'तीनों वक्र' },
                  { id: 'completed', label: 'पूर्ण' },
                  { id: 'verified', label: 'सत्यापित' },
                  { id: 'initiated', label: 'प्रारंभ' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveTrendSeries(s.id as any)}
                    className={`px-2 py-1 rounded-lg font-medium transition ${
                      activeTrendSeries === s.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Trend Line */}
            {trendSvgMetrics ? (
              <div className="relative my-2 w-full">
                <svg
                  viewBox={`0 0 ${trendSvgMetrics.width} ${trendSvgMetrics.height}`}
                  className="w-full h-auto overflow-visible select-none"
                >
                  <defs>
                    {/* Glowing Area Fill Gradients */}
                    <linearGradient id="areaFillEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="areaFillViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="areaFillAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Gradient Line Strokes */}
                    <linearGradient id="strokeEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="strokeViolet" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="strokeAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>

                    <filter id="trendGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
                    </filter>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  {[0, 0.33, 0.66, 1].map((pct, idx) => {
                    const y = trendSvgMetrics.height - trendSvgMetrics.padY - pct * trendSvgMetrics.chartH;
                    const val = Math.round(pct * trendSvgMetrics.maxVal);
                    return (
                      <g key={idx}>
                        <line
                          x1={trendSvgMetrics.padX}
                          y1={y}
                          x2={trendSvgMetrics.width - trendSvgMetrics.padX}
                          y2={y}
                          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                          strokeDasharray="4 4"
                        />
                        <text
                          x={trendSvgMetrics.padX - 8}
                          y={y + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill={isDark ? '#64748b' : '#94a3b8'}
                          className="font-mono"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fills */}
                  {(activeTrendSeries === 'all' || activeTrendSeries === 'initiated') && (
                    <path d={trendSvgMetrics.initArea} fill="url(#areaFillAmber)" />
                  )}
                  {(activeTrendSeries === 'all' || activeTrendSeries === 'verified') && (
                    <path d={trendSvgMetrics.verifArea} fill="url(#areaFillViolet)" />
                  )}
                  {(activeTrendSeries === 'all' || activeTrendSeries === 'completed') && (
                    <path d={trendSvgMetrics.compArea} fill="url(#areaFillEmerald)" />
                  )}

                  {/* Smooth Lines */}
                  {(activeTrendSeries === 'all' || activeTrendSeries === 'initiated') && (
                    <path
                      d={trendSvgMetrics.initLine}
                      fill="none"
                      stroke="url(#strokeAmber)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}
                  {(activeTrendSeries === 'all' || activeTrendSeries === 'verified') && (
                    <path
                      d={trendSvgMetrics.verifLine}
                      fill="none"
                      stroke="url(#strokeViolet)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  )}
                  {(activeTrendSeries === 'all' || activeTrendSeries === 'completed') && (
                    <path
                      d={trendSvgMetrics.compLine}
                      fill="none"
                      stroke="url(#strokeEmerald)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#trendGlow)"
                    />
                  )}

                  {/* Nodes on each date */}
                  {trendData.map((d, idx) => {
                    const cx = trendSvgMetrics.getX(idx);
                    const cyComp = trendSvgMetrics.getY(d.completed);
                    const cyVerif = trendSvgMetrics.getY(d.patwariVerification);
                    const cyInit = trendSvgMetrics.getY(d.registryInitiated);
                    const isHovered = hoveredTrendIdx === idx;

                    return (
                      <g
                        key={d.date}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTrendIdx(idx)}
                        onMouseLeave={() => setHoveredTrendIdx(null)}
                      >
                        {/* Hover vertical bar */}
                        {isHovered && (
                          <line
                            x1={cx}
                            y1={trendSvgMetrics.padY}
                            x2={cx}
                            y2={trendSvgMetrics.height - trendSvgMetrics.padY}
                            stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Completed Point */}
                        {(activeTrendSeries === 'all' || activeTrendSeries === 'completed') && (
                          <circle
                            cx={cx}
                            cy={cyComp}
                            r={isHovered ? 6 : 4}
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all duration-200"
                          />
                        )}

                        {/* Verified Point */}
                        {(activeTrendSeries === 'all' || activeTrendSeries === 'verified') && (
                          <circle
                            cx={cx}
                            cy={cyVerif}
                            r={isHovered ? 5.5 : 3.5}
                            fill="#8b5cf6"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all duration-200"
                          />
                        )}

                        {/* Initiated Point */}
                        {(activeTrendSeries === 'all' || activeTrendSeries === 'initiated') && (
                          <circle
                            cx={cx}
                            cy={cyInit}
                            r={isHovered ? 5 : 3}
                            fill="#f59e0b"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all duration-200"
                          />
                        )}

                        {/* Date label at bottom */}
                        <text
                          x={cx}
                          y={trendSvgMetrics.height - 12}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight={d.date === selectedDate ? 'bold' : 'normal'}
                          fill={d.date === selectedDate ? '#10b981' : isDark ? '#94a3b8' : '#64748b'}
                          className="font-mono"
                        >
                          {d.date}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Glass Trend Card */}
                {hoveredTrendIdx !== null && trendData[hoveredTrendIdx] && (
                  <div
                    className={`absolute top-2 right-4 p-3 rounded-2xl border backdrop-blur-xl shadow-xl text-xs z-20 pointer-events-none transition-all ${
                      isDark
                        ? 'bg-slate-900/90 border-emerald-500/30 text-white'
                        : 'bg-white/95 border-emerald-300 text-slate-900'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>दिनांक: {trendData[hoveredTrendIdx].date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-[11px]">
                      <div className="text-emerald-400 font-medium">पूर्ण पंजीयन:</div>
                      <div className="font-mono font-bold text-right">
                        {trendData[hoveredTrendIdx].completed}
                        {trendData[hoveredTrendIdx].deltaCompleted !== 0 && (
                          <span className="text-[10px] text-emerald-300 ml-1">
                            (+{trendData[hoveredTrendIdx].deltaCompleted})
                          </span>
                        )}
                      </div>

                      <div className="text-indigo-400 font-medium">पटवारी सत्यापन:</div>
                      <div className="font-mono font-bold text-right">
                        {trendData[hoveredTrendIdx].patwariVerification}
                        {trendData[hoveredTrendIdx].deltaVerified !== 0 && (
                          <span className="text-[10px] text-indigo-300 ml-1">
                            (+{trendData[hoveredTrendIdx].deltaVerified})
                          </span>
                        )}
                      </div>

                      <div className="text-amber-400 font-medium">पंजीयन प्रारंभ:</div>
                      <div className="font-mono font-bold text-right">
                        {trendData[hoveredTrendIdx].registryInitiated}
                        {trendData[hoveredTrendIdx].deltaInitiated !== 0 && (
                          <span className="text-[10px] text-amber-300 ml-1">
                            (+{trendData[hoveredTrendIdx].deltaInitiated})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Trend Summary Indicators */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <span className="w-2.5 h-0.5 bg-emerald-500 rounded" />
                  पूर्ण पंजीयन
                </span>
                <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                  <span className="w-2.5 h-0.5 bg-indigo-500 rounded" />
                  पटवारी सत्यापन
                </span>
                <span className="flex items-center gap-1 text-[11px] text-amber-400">
                  <span className="w-2.5 h-0.5 bg-amber-500 rounded" />
                  पंजीयन प्रारंभ
                </span>
              </div>
              <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {trendData.length} दिनांक डेटा उपलब्ध
              </div>
            </div>
          </div>
        )}

        {/* CHART 4: Modern Donut Chart (लक्ष्य प्राप्ति व संचयी पूर्णता दर डोनट चार्ट) */}
        {(activeTab === 'all' || activeTab === 'donut') && (
          <div
            className={`relative overflow-hidden rounded-3xl p-5 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/60 border-white/10 hover:border-teal-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                : 'bg-white/70 border-white/80 hover:border-teal-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-sm">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    लक्ष्य प्राप्ति डोनट मीटर (Target Completion Donut)
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    5,907 कुल लक्ष्य के सापेक्ष पूर्ण पंजीयन एवं सत्यापन अनुपात
                  </p>
                </div>
              </div>
            </div>

            {/* SVG Donut with Center Stat Hub */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
              <div className="relative flex items-center justify-center">
                <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible select-none -rotate-90">
                  <defs>
                    <linearGradient id="donutGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="donutGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>

                    <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.45" />
                    </filter>
                  </defs>

                  {/* Outer Track (Verification) */}
                  <circle
                    cx="110"
                    cy="110"
                    r={outerRadius}
                    fill="none"
                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    strokeWidth="8"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r={outerRadius}
                    fill="none"
                    stroke="url(#donutGradOuter)"
                    strokeWidth="8"
                    strokeDasharray={outerCircumference}
                    strokeDashoffset={outerOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />

                  {/* Inner Track (Completed) */}
                  <circle
                    cx="110"
                    cy="110"
                    r={donutRadius}
                    fill="none"
                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth="12"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r={donutRadius}
                    fill="none"
                    stroke="url(#donutGradInner)"
                    strokeWidth="12"
                    strokeDasharray={donutCircumference}
                    strokeDashoffset={completionOffset}
                    strokeLinecap="round"
                    filter="url(#donutGlow)"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Central Stat Hub (Rotated back) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    पूर्ण पंजीयन
                  </div>
                  <div className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                    {kpis.pctCompleted}%
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className="font-bold text-emerald-400">{kpis.completed}</span> / {kpis.totalPlots.toLocaleString('en-IN')}
                  </div>
                  <span
                    className={`mt-1 text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                      isDark
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    प्रगति सक्रिय
                  </span>
                </div>
              </div>

              {/* Progress Detail Cards */}
              <div className="space-y-2.5 flex-1 w-full max-w-xs">
                {/* Card 1: Completed */}
                <div
                  className={`p-3 rounded-2xl border backdrop-blur-md flex items-center justify-between ${
                    isDark ? 'bg-slate-800/40 border-emerald-500/20' : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        अंतिम पूर्ण पंजीयन
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        आंतरिक रिंग (Inner Ring)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-emerald-400">{kpis.completed}</div>
                    <div className="text-[10px] font-mono text-slate-400">{kpis.pctCompleted}% लक्ष्य</div>
                  </div>
                </div>

                {/* Card 2: Verification In Pipeline */}
                <div
                  className={`p-3 rounded-2xl border backdrop-blur-md flex items-center justify-between ${
                    isDark ? 'bg-slate-800/40 border-indigo-500/20' : 'bg-indigo-50/70 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-8 rounded-full bg-gradient-to-b from-purple-400 to-indigo-500" />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        पटवारी सत्यापन स्तर
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        बाहरी रिंग (Outer Ring)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-indigo-400">{kpis.patwariVerification}</div>
                    <div className="text-[10px] font-mono text-slate-400">{verificationPct.toFixed(1)}% लक्ष्य</div>
                  </div>
                </div>

                {/* Card 3: Pending verification bottleneck */}
                {kpis.pendingVerification > 0 && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark
                        ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      सत्यापन बैकलॉग
                    </span>
                    <span className="font-mono font-bold">{kpis.pendingVerification} लंबित</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`text-center text-[11px] pt-2 border-t border-white/5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              दैनिक गति से लक्ष्य पूर्ति का अनुमानित समय AI मॉडल द्वारा विश्लेषित है
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
