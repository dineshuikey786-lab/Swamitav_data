import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Loader2,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Target,
  MapPin,
  Users,
  FileCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  OverallKpis,
  PatwariSummary,
  PeriodComparison,
  PatwariRecord,
  PatwariDateMatrixRow,
  calculateDateTrends,
  calculateStatusSlices,
} from '../utils/patwariAnalytics';
import {
  exportDashboardToExcel,
  downloadElementAsPdf,
  buildPdfReportMetadata,
  PdfReportMode,
} from '../utils/exportUtils';

interface OfficialReportModalProps {
  kpis: OverallKpis;
  summaries: PatwariSummary[];
  comparison: PeriodComparison;
  selectedPeriod: 'day' | 'week' | 'month';
  records?: PatwariRecord[];
  allRecords?: PatwariRecord[];
  matrixRows?: PatwariDateMatrixRow[];
  dates?: string[];
  initialReportMode?: PdfReportMode;
  onSelectDate?: (date: string) => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  onClose: () => void;
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  kpis,
  summaries,
  comparison,
  selectedPeriod,
  records = [],
  allRecords = [],
  matrixRows = [],
  dates = [],
  initialReportMode = 'full',
  onSelectDate,
  onRefreshData,
  isRefreshing = false,
  onClose,
}) => {
  const [reportMode, setReportMode] = useState<PdfReportMode>(initialReportMode);
  const [includeVillages, setIncludeVillages] = useState(false);
  const [includeMatrix, setIncludeMatrix] = useState(true);
  const [generatingMode, setGeneratingMode] = useState<PdfReportMode | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setReportMode(initialReportMode);
  }, [initialReportMode]);

  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      setStatusMessage('एक्सेल फाइल (.xlsx) तैयार की जा रही है...');

      exportDashboardToExcel({
        kpis,
        summaries,
        records: records.length > 0 ? records : summaries.flatMap((s) => s.villages),
        matrixRows: matrixRows.length > 0 ? matrixRows : undefined,
        dates: dates.length > 0 ? dates : undefined,
        selectedDate: comparison.currentDate,
        selectedPeriod,
        tehsilName: 'तामिया',
        districtName: 'छिंदवाड़ा (म.प्र.)',
      });

      setStatusMessage('एक्सेल रिपोर्ट सफलतापूर्वक डाउनलोड हुई!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      setStatusMessage('एक्सेल एक्सपोर्ट में त्रुटि हुई।');
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadSpecificPdf = async (targetMode: PdfReportMode) => {
    if (generatingMode) return;
    try {
      setGeneratingMode(targetMode);
      if (reportMode !== targetMode) {
        setReportMode(targetMode);
        // Wait for React to commit the target mode DOM layout before capturing
        await new Promise((resolve) => setTimeout(resolve, 140));
      }
      if (!reportRef.current) return;

      const meta = buildPdfReportMetadata(targetMode, comparison.currentDate, kpis);
      await downloadElementAsPdf(
        reportRef.current,
        meta.fileName,
        (msg) => setStatusMessage(msg),
        {
          orientation: 'portrait',
          backgroundColor: '#ffffff',
        }
      );

      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setStatusMessage('पीडीएफ निर्माण में त्रुटि। कृपया प्रिंट विकल्प का उपयोग करें।');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setGeneratingMode(null);
    }
  };

  const periodTitle =
    selectedPeriod === 'day'
      ? 'दैनिक प्रगति प्रतिवेदन (Daily Progress Report)'
      : selectedPeriod === 'week'
      ? 'साप्ताहिक प्रगति समीक्षा (Weekly Progress Review)'
      : 'मासिक प्रगति समीक्षा (Monthly Progress Review)';

  const activeVillagesData = records.length > 0 ? records : summaries.flatMap((s) => s.villages);
  const currentMeta = useMemo(
    () => buildPdfReportMetadata(reportMode, comparison.currentDate, kpis),
    [reportMode, comparison.currentDate, kpis]
  );

  // Analytics calculations for Charts PDF mode
  const trendRecords = allRecords.length > 0 ? allRecords : activeVillagesData;
  const trendData = useMemo(() => calculateDateTrends(trendRecords), [trendRecords]);
  const statusSlices = useMemo(() => calculateStatusSlices(kpis, 'pipeline'), [kpis]);
  const topBarPatwaris = useMemo(() => {
    return [...summaries].sort((a, b) => b.completed - a.completed).slice(0, 8);
  }, [summaries]);
  const maxBarCompleted = useMemo(
    () => Math.max(...topBarPatwaris.map((p) => Math.max(p.completed, p.patwariVerification, p.registryInitiated)), 1),
    [topBarPatwaris]
  );

  // SVG Pie Slices for Charts PDF
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
      const r = 72;
      const cx = 85;
      const cy = 85;
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
      return { ...slice, pathData };
    });
  }, [statusSlices]);

  // SVG Donut metrics for Charts PDF
  const donutRadius = 60;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const completionPct = Math.min(100, Math.max(0, kpis.pctCompleted));
  const completionOffset = donutCircumference - (completionPct / 100) * donutCircumference;
  const verificationPct = kpis.totalPlots > 0 ? (kpis.patwariVerification / kpis.totalPlots) * 100 : 0;
  const outerRadius = 72;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerOffset = outerCircumference - (Math.min(100, verificationPct) / 100) * outerCircumference;

  // SVG Trend Line metrics for Charts PDF
  const trendSvg = useMemo(() => {
    if (trendData.length === 0) return null;
    const width = 560;
    const height = 175;
    const padX = 42;
    const padY = 26;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;
    const maxVal =
      Math.max(...trendData.map((d) => Math.max(d.registryInitiated, d.patwariVerification, d.completed, 10))) * 1.15;
    const getX = (idx: number) =>
      trendData.length <= 1 ? padX + chartW / 2 : padX + (idx / (trendData.length - 1)) * chartW;
    const getY = (val: number) => height - padY - (val / maxVal) * chartH;
    const makePolyline = (vals: number[]) =>
      vals.map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');
    return {
      width,
      height,
      padX,
      padY,
      maxVal,
      getX,
      getY,
      compPoints: makePolyline(trendData.map((d) => d.completed)),
      verifPoints: makePolyline(trendData.map((d) => d.patwariVerification)),
      initPoints: makePolyline(trendData.map((d) => d.registryInitiated)),
    };
  }, [trendData]);

  // Funnel steps for Card Data PDF & Charts PDF
  const funnelSteps = [
    {
      step: 'चरण 1',
      title: 'कुल भूखंड लक्ष्य (Total Target Plots)',
      count: kpis.totalPlots,
      pct: '100%',
      sub: `${kpis.totalVillages} ग्राम • ${kpis.totalBeneficiaries.toLocaleString()} हितग्राही`,
      color: 'border-blue-400 bg-blue-50/70 text-blue-900',
      barColor: 'bg-blue-600',
      pctNum: 100,
    },
    {
      step: 'चरण 2',
      title: 'पंजीयन प्रारंभ (Registry Initiated)',
      count: kpis.registryInitiated,
      pct: `${kpis.totalPlots > 0 ? ((kpis.registryInitiated / kpis.totalPlots) * 100).toFixed(1) : 0}%`,
      sub: `परिवर्तन: ${comparison.deltaInitiated >= 0 ? `+${comparison.deltaInitiated}` : comparison.deltaInitiated} आवेदन`,
      color: 'border-amber-400 bg-amber-50/70 text-amber-900',
      barColor: 'bg-amber-500',
      pctNum: kpis.totalPlots > 0 ? (kpis.registryInitiated / kpis.totalPlots) * 100 : 0,
    },
    {
      step: 'चरण 3',
      title: 'पटवारी सत्यापन (Field Verified)',
      count: kpis.patwariVerification,
      pct: `${kpis.totalPlots > 0 ? ((kpis.patwariVerification / kpis.totalPlots) * 100).toFixed(1) : 0}%`,
      sub: `लंबित सत्यापन: ${kpis.pendingVerification} आवेदन`,
      color: 'border-indigo-400 bg-indigo-50/70 text-indigo-900',
      barColor: 'bg-indigo-600',
      pctNum: kpis.totalPlots > 0 ? (kpis.patwariVerification / kpis.totalPlots) * 100 : 0,
    },
    {
      step: 'चरण 4',
      title: 'अंतिम पूर्ण पंजीयन (Completed)',
      count: kpis.completed,
      pct: `${kpis.pctCompleted}%`,
      sub: `परिवर्तन: ${comparison.deltaCompleted >= 0 ? `+${comparison.deltaCompleted}` : comparison.deltaCompleted} पूर्ण`,
      color: 'border-emerald-500 bg-emerald-50/80 text-emerald-950',
      barColor: 'bg-emerald-600',
      pctNum: kpis.pctCompleted,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Top Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span>PDF जनरेशन एवं एक्सपोर्ट सेंटर (Separate Cards &amp; Charts PDF)</span>
                {dates.length > 0 && onSelectDate ? (
                  <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-700 rounded-lg px-2 py-0.5 text-xs">
                    <Calendar className="h-3 w-3 text-emerald-400" />
                    <select
                      value={comparison.currentDate}
                      onChange={(e) => onSelectDate(e.target.value)}
                      className="bg-transparent text-emerald-200 font-mono font-bold focus:outline-none cursor-pointer"
                      aria-label="रिपोर्ट दिनांक चुनें"
                    >
                      {dates.map((d, idx) => (
                        <option key={d} value={d} className="bg-slate-900 text-white">
                          {d} {idx === dates.length - 1 ? '(नवीनतम)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    {comparison.currentDate}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                अलग-अलग <strong>कार्ड डेटा PDF</strong>, <strong>डैशबोर्ड चार्ट्स PDF</strong> अथवा <strong>संपूर्ण शासकीय रिपोर्ट PDF</strong> डाउनलोड करें
              </p>
            </div>
          </div>

          {/* Right Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                disabled={isRefreshing}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/70 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                title="Google Sheet एवं GitHub से नवीनतम डेटा अभी सिंक करें"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>लाइव सिंक</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              title="सभी 4 शीट्स सहित एक्सेल वर्कबुक डाउनलोड करें"
            >
              {isExportingExcel ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>एक्सेल (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="सिस्टम प्रिंटर या 'Save as PDF' से प्रिंट करें"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">प्रिंट</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-1"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dedicated Separate PDF Mode Selector & 1-Click Download Bar */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 print:hidden">
          {/* Mode Tabs (Preview Switcher) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">PDF प्रारूप चुनें:</span>
            <button
              type="button"
              onClick={() => setReportMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                reportMode === 'cards'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>1. कार्ड डेटा PDF (Card Data Only)</span>
            </button>

            <button
              type="button"
              onClick={() => setReportMode('charts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                reportMode === 'charts'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>2. डैशबोर्ड चार्ट्स PDF (Charts Only)</span>
            </button>

            <button
              type="button"
              onClick={() => setReportMode('full')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                reportMode === 'full'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>3. संपूर्ण शासकीय रिपोर्ट (Full Report)</span>
            </button>
          </div>

          {/* 3 Separate 1-Click Direct PDF Download Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadSpecificPdf('cards')}
              disabled={generatingMode !== null}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
              title="केवल डैशबोर्ड कार्ड डेटा का अलग PDF डाउनलोड करें"
            >
              {generatingMode === 'cards' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>कार्ड डेटा PDF डाउनलोड</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadSpecificPdf('charts')}
              disabled={generatingMode !== null}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
              title="केवल डैशबोर्ड चार्ट्स (बार, पाई, ट्रेंड, डोनट) का अलग PDF डाउनलोड करें"
            >
              {generatingMode === 'charts' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>चार्ट्स PDF डाउनलोड</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadSpecificPdf('full')}
              disabled={generatingMode !== null}
              className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
              title="संपूर्ण शासकीय प्रतिवेदन PDF डाउनलोड करें"
            >
              {generatingMode === 'full' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>संपूर्ण PDF डाउनलोड</span>
            </button>
          </div>
        </div>

        {/* Sub-options & Status Message Bar */}
        <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-400 font-mono text-[11px]">
              फाइल: <strong className="text-emerald-300">{currentMeta.fileName}</strong>
            </span>
            {reportMode === 'full' && (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={includeMatrix}
                    onChange={(e) => setIncludeMatrix(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
                  />
                  <span>दिनांकवार मैट्रिक्स शामिल करें</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={includeVillages}
                    onChange={(e) => setIncludeVillages(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
                  />
                  <span>ग्रामवार विस्तृत सूची संलग्न करें ({activeVillagesData.length} ग्राम)</span>
                </label>
              </>
            )}
          </div>

          {statusMessage && (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/80 animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Printable & Exportable Official Document Body */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-slate-950/40">
          <div
            ref={reportRef}
            id="administrative-report-document"
            className="print-document max-w-4xl mx-auto bg-white text-slate-900 p-6 sm:p-9 rounded-xl shadow-lg border border-slate-200 font-sans space-y-6"
          >
            {/* Official Letterhead Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  MP
                </div>
                <div className="text-xs uppercase font-extrabold tracking-widest text-slate-700">
                  मध्य प्रदेश शासन • राजस्व विभाग (Madhya Pradesh Government)
                </div>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentMeta.titleHindi}
              </h1>
              <div className="text-xs font-bold text-slate-600 mt-0.5">
                {currentMeta.titleEnglish}
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                वृत्त: तामिया • तहसील: तामिया • जिला: छिंदवाड़ा (मध्य प्रदेश)
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <span className="bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-bold text-slate-800">
                  {periodTitle}
                </span>
                <span className="bg-emerald-50 border border-emerald-300 px-3 py-1 rounded text-xs font-bold text-emerald-900 font-mono">
                  समीक्षा दिनांक: {comparison.currentDate}
                </span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded text-xs text-slate-500 font-mono">
                  प्रिंट समय: {new Date().toLocaleTimeString('hi-IN')}
                </span>
              </div>
            </div>

            {/* ================================================================= */}
            {/* MODE 1: SEPARATE DASHBOARD CARD DATA PDF REPORT                   */}
            {/* ================================================================= */}
            {reportMode === 'cards' && (
              <div className="space-y-6">
                {/* Section A: Visual 4 Executive KPI Cards */}
                <div className="page-break-avoid">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      1. डैशबोर्ड प्रमुख प्रगति सूचकांक कार्ड्स (Executive KPI Cards Data):
                    </h3>
                    <span className="text-[11px] font-mono text-slate-600">
                      दिनांक: {comparison.currentDate} (तुलना: {comparison.previousDate})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Card 1 */}
                    <div className="border-2 border-blue-200 bg-blue-50/40 rounded-xl p-4">
                      <div className="flex items-center justify-between text-blue-900 mb-1.5">
                        <span className="text-xs font-extrabold uppercase">1. कुल लक्ष्य भूखंड (Total Plots)</span>
                        <Layers className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 font-mono">
                          {kpis.totalPlots.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold">भूखंड (Plots)</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs text-slate-700 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-blue-600" />
                          कुल ग्राम: <strong>{kpis.totalVillages}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-blue-600" />
                          हितग्राही: <strong>{kpis.totalBeneficiaries.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="border-2 border-amber-200 bg-amber-50/40 rounded-xl p-4">
                      <div className="flex items-center justify-between text-amber-900 mb-1.5">
                        <span className="text-xs font-extrabold uppercase">2. पंजीयन प्रारंभ (Registry Initiated)</span>
                        <FileCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-amber-900 font-mono">
                            {kpis.registryInitiated.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-600 font-semibold">आवेदन</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold font-mono flex items-center gap-0.5">
                          {comparison.deltaInitiated >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {comparison.deltaInitiated >= 0 ? `+${comparison.deltaInitiated}` : comparison.deltaInitiated}
                        </span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs text-slate-700 font-medium">
                        <span>कुल भूखंड का हिस्सा:</span>
                        <strong className="font-mono text-amber-900">
                          {kpis.totalPlots > 0 ? ((kpis.registryInitiated / kpis.totalPlots) * 100).toFixed(1) : 0}% प्रारंभ
                        </strong>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="border-2 border-indigo-200 bg-indigo-50/40 rounded-xl p-4">
                      <div className="flex items-center justify-between text-indigo-900 mb-1.5">
                        <span className="text-xs font-extrabold uppercase">3. पटवारी सत्यापन (Patwari Verified)</span>
                        <Clock className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-indigo-900 font-mono">
                            {kpis.patwariVerification.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-600 font-semibold">सत्यापित</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-100 border border-indigo-300 text-indigo-900 text-xs font-bold font-mono flex items-center gap-0.5">
                          {comparison.deltaVerified >= 0 ? `+${comparison.deltaVerified}` : comparison.deltaVerified}
                        </span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-indigo-200/80 flex items-center justify-between text-xs font-medium">
                        <span className="text-rose-700 font-bold">
                          लंबित सत्यापन: {kpis.pendingVerification}
                        </span>
                        <span className="text-indigo-900 font-mono font-bold">
                          {kpis.registryInitiated > 0
                            ? ((kpis.patwariVerification / kpis.registryInitiated) * 100).toFixed(0)
                            : 0}
                          % रूपांतरण
                        </span>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="border-2 border-emerald-400 bg-emerald-50/60 rounded-xl p-4">
                      <div className="flex items-center justify-between text-emerald-950 mb-1.5">
                        <span className="text-xs font-extrabold uppercase">4. अंतिम पूर्ण पंजीयन (Completed)</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-emerald-800 font-mono">
                            {kpis.completed.toLocaleString()}
                          </span>
                          <span className="text-xs text-emerald-900 font-semibold">भूखंड पूर्ण</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white text-xs font-black font-mono">
                          {kpis.pctCompleted}%
                        </span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-emerald-300/80">
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-1.5">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(kpis.pctCompleted, 2))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                          <span>सक्रिय पटवारी: <strong>{comparison.activePatwarisCount}</strong></span>
                          <span>शेष लक्ष्य: <strong className="font-mono">{(kpis.totalPlots - kpis.completed).toLocaleString()}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: 4-Stage Workflow Pipeline Cards */}
                <div className="page-break-avoid">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5">
                    2. राजस्व कार्यप्रवाह पाइपलाइन कार्ड्स (4-Stage Workflow Funnel Cards):
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {funnelSteps.map((s) => (
                      <div key={s.step} className={`border rounded-xl p-3 ${s.color}`}>
                        <div className="text-[10px] font-bold uppercase opacity-75">{s.step}</div>
                        <div className="text-xs font-extrabold mt-0.5">{s.title}</div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xl font-black font-mono">{s.count.toLocaleString()}</span>
                          <span className="text-xs font-mono font-bold">({s.pct})</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden my-2 border border-slate-300/50">
                          <div
                            className={`h-full ${s.barColor}`}
                            style={{ width: `${Math.min(100, Math.max(s.pctNum, 3))}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-medium opacity-90">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section C: Complete 12-Parameter Card Data Summary Table */}
                <div className="page-break-avoid">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                    3. संपूर्ण कार्ड डेटा सूचकांक विवरण तालिका (Complete Card Data Breakdown):
                  </h3>
                  <table className="w-full text-xs border border-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-800">
                        <th className="p-2 border-r border-slate-400 text-center w-10">क्र.</th>
                        <th className="p-2 border-r border-slate-400 text-left">कार्ड सूचकांक (Dashboard Card Metric)</th>
                        <th className="p-2 border-r border-slate-400 text-right">वर्तमान मान ({comparison.currentDate})</th>
                        <th className="p-2 border-r border-slate-400 text-right">दैनिक अंतर (Delta)</th>
                        <th className="p-2 text-left">प्रशासनिक स्थिति / विवरण (Status Note)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      <tr>
                        <td className="p-2 border-r border-slate-300 text-center font-mono">1</td>
                        <td className="p-2 border-r border-slate-300 font-bold">कुल आबादी ग्राम (Total Villages)</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{kpis.totalVillages}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">-</td>
                        <td className="p-2 text-slate-700">सक्रिय ग्राम: {kpis.activeVillages} • शून्य प्रगति: {kpis.zeroProgressVillages}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-2 border-r border-slate-300 text-center font-mono">2</td>
                        <td className="p-2 border-r border-slate-300 font-bold">कुल हल्का पटवारी (Total Patwaris)</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{kpis.totalPatwaris}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">-</td>
                        <td className="p-2 text-slate-700">प्रगतिशील पटवारी: {comparison.activePatwarisCount}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-300 text-center font-mono">3</td>
                        <td className="p-2 border-r border-slate-300 font-bold">कुल लक्षित भूखंड (Total Target Plots)</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{kpis.totalPlots.toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">-</td>
                        <td className="p-2 text-slate-700">कुल दर्ज हितग्राही: {kpis.totalBeneficiaries.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-amber-50/40">
                        <td className="p-2 border-r border-slate-300 text-center font-mono">4</td>
                        <td className="p-2 border-r border-slate-300 font-bold text-amber-900">पंजीयन प्रारंभ (Registry Initiated)</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-amber-900">{kpis.registryInitiated.toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-amber-900">
                          {comparison.deltaInitiated >= 0 ? `+${comparison.deltaInitiated}` : comparison.deltaInitiated}
                        </td>
                        <td className="p-2 text-amber-900">कुल लक्ष्य का {kpis.totalPlots > 0 ? ((kpis.registryInitiated / kpis.totalPlots) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr className="bg-indigo-50/40">
                        <td className="p-2 border-r border-slate-300 text-center font-mono">5</td>
                        <td className="p-2 border-r border-slate-300 font-bold text-indigo-900">पटवारी सत्यापन पूर्ण (Patwari Verified)</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-indigo-900">{kpis.patwariVerification.toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-indigo-900">
                          {comparison.deltaVerified >= 0 ? `+${comparison.deltaVerified}` : comparison.deltaVerified}
                        </td>
                        <td className="p-2 text-indigo-900">लंबित सत्यापन: {kpis.pendingVerification} आवेदन</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-300 text-center font-mono">6</td>
                        <td className="p-2 border-r border-slate-300 font-bold">अग्रसारित / प्रस्तुत (Submitted)</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{kpis.submitted.toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">
                          {comparison.deltaSubmitted >= 0 ? `+${comparison.deltaSubmitted}` : comparison.deltaSubmitted}
                        </td>
                        <td className="p-2 text-slate-700">पंजीयन प्रक्रियाधीन (In-Process): {kpis.registrationIn}</td>
                      </tr>
                      <tr className="bg-emerald-50/70">
                        <td className="p-2 border-r border-slate-300 text-center font-mono">7</td>
                        <td className="p-2 border-r border-slate-300 font-black text-emerald-900">अंतिम पूर्ण पंजीयन (Completed Registrations)</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-black text-emerald-900">{kpis.completed.toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-black text-emerald-900">
                          {comparison.deltaCompleted >= 0 ? `+${comparison.deltaCompleted}` : comparison.deltaCompleted}
                        </td>
                        <td className="p-2 font-bold text-emerald-900">समग्र पूर्णता दर: {kpis.pctCompleted}% (शेष: {(kpis.totalPlots - kpis.completed).toLocaleString()})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MODE 2: SEPARATE DASHBOARD CHARTS PDF REPORT                      */}
            {/* ================================================================= */}
            {reportMode === 'charts' && (
              <div className="space-y-6">
                {/* Compact KPI Strip at top of Charts PDF */}
                <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-xl p-3 text-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">कुल भूखंड लक्ष्य</div>
                    <div className="text-lg font-black font-mono text-slate-900">{kpis.totalPlots.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-amber-800">पंजीयन प्रारंभ</div>
                    <div className="text-lg font-black font-mono text-amber-700">{kpis.registryInitiated.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-indigo-800">पटवारी सत्यापन</div>
                    <div className="text-lg font-black font-mono text-indigo-700">{kpis.patwariVerification.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800">अंतिम पूर्ण ({kpis.pctCompleted}%)</div>
                    <div className="text-lg font-black font-mono text-emerald-700">{kpis.completed.toLocaleString()}</div>
                  </div>
                </div>

                {/* CHART 1: Patwari Performance Bar Chart */}
                <div className="border border-slate-300 rounded-xl p-4 bg-white page-break-avoid">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        1. पटवारी प्रदर्शन तुलनात्मक बार चार्ट (Top 12 Patwaris Performance Bar Chart • {comparison.currentDate})
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">पूर्ण पंजीयन एवं प्रगति %</span>
                  </div>

                  <div className="space-y-2">
                    {topBarPatwaris.map((p, idx) => {
                      const widthPct = Math.max(4, (p.completed / maxBarCompleted) * 100);
                      return (
                        <div key={p.patwariName} className="grid grid-cols-12 items-center gap-2 text-xs">
                          <div className="col-span-4 sm:col-span-3 truncate font-semibold text-slate-800">
                            <span className="font-mono text-slate-400 mr-1">{idx + 1}.</span>
                            {p.patwariName}
                          </div>
                          <div className="col-span-6 sm:col-span-7 bg-slate-100 h-4 rounded-md overflow-hidden border border-slate-200 relative">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-r"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <div className="col-span-2 text-right font-mono text-[11px] font-bold text-slate-900">
                            {p.completed} <span className="text-emerald-700">({p.pctCompleted}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CHART 2 & CHART 3: Pie Chart + Donut Chart Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 page-break-avoid">
                  {/* Chart 2: Pipeline Distribution Pie Chart */}
                  <div className="border border-slate-300 rounded-xl p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                      <PieIcon className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        2. पाइपलाइन स्थिति पाई चार्ट (Pipeline Pie Chart)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="135" height="135" viewBox="0 0 170 170" className="flex-shrink-0">
                        {pieSlices.map((s) =>
                          s.pathData ? (
                            <path
                              key={s.id}
                              d={s.pathData}
                              fill={s.colorFrom}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          ) : null
                        )}
                        <circle cx="85" cy="85" r="32" fill="#ffffff" />
                        <text x="85" y="83" textAnchor="middle" className="text-[11px] font-bold fill-slate-800">
                          {kpis.pctCompleted}%
                        </text>
                        <text x="85" y="96" textAnchor="middle" className="text-[8px] fill-slate-500">
                          पूर्ण
                        </text>
                      </svg>
                      <div className="space-y-1.5 flex-1 min-w-0 text-[11px]">
                        {statusSlices.map((s) => (
                          <div key={s.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                            <span className="flex items-center gap-1.5 font-medium text-slate-800 min-w-0">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: s.colorFrom }}
                              />
                              <span className="truncate">{s.labelHi}</span>
                            </span>
                            <span className="font-mono font-bold text-slate-900 whitespace-nowrap flex-shrink-0">
                              {s.count.toLocaleString()} ({s.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chart 3: Target Completion Donut Chart */}
                  <div className="border border-slate-300 rounded-xl p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                      <Target className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        3. लक्ष्य प्राप्ति डोनट मीटर (Target Donut Chart)
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center flex-shrink-0">
                        <svg width="165" height="165" viewBox="0 0 170 170" className="-rotate-90">
                          <circle cx="85" cy="85" r={outerRadius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle
                            cx="85"
                            cy="85"
                            r={outerRadius}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="8"
                            strokeDasharray={outerCircumference}
                            strokeDashoffset={outerOffset}
                            strokeLinecap="round"
                          />
                          <circle cx="85" cy="85" r={donutRadius} fill="none" stroke="#e2e8f0" strokeWidth="11" />
                          <circle
                            cx="85"
                            cy="85"
                            r={donutRadius}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="11"
                            strokeDasharray={donutCircumference}
                            strokeDashoffset={completionOffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-[9px] font-bold uppercase text-slate-500">पूर्णता दर</span>
                          <span className="text-xl font-black text-emerald-700 font-mono">{kpis.pctCompleted}%</span>
                          <span className="text-[9px] font-mono text-slate-600">
                            {kpis.completed}/{kpis.totalPlots}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 text-xs">
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <div className="font-bold text-emerald-900">आंतरिक रिंग: अंतिम पूर्ण</div>
                          <div className="font-mono font-black text-emerald-700 text-sm">
                            {kpis.completed.toLocaleString()} ({kpis.pctCompleted}%)
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                          <div className="font-bold text-indigo-900">बाहरी रिंग: पटवारी सत्यापन</div>
                          <div className="font-mono font-black text-indigo-700 text-sm">
                            {kpis.patwariVerification.toLocaleString()} ({verificationPct.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHART 4: Multi-Date Trend Line Chart */}
                {trendSvg && trendData.length > 0 && (
                  <div className="border border-slate-300 rounded-xl p-4 bg-white page-break-avoid">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          4. दिनांक-वार प्रगति ट्रेंड लाइन ग्राफ (Date-wise Trend Line Chart: {trendData[0]?.date} से {trendData[trendData.length - 1]?.date})
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="text-emerald-700">● पूर्ण (Completed)</span>
                        <span className="text-indigo-700">● सत्यापित (Verified)</span>
                        <span className="text-amber-700">● प्रारंभ (Initiated)</span>
                      </div>
                    </div>

                    <svg
                      viewBox={`0 0 ${trendSvg.width} ${trendSvg.height}`}
                      className="w-full h-44 border border-slate-100 rounded bg-slate-50/50"
                    >
                      {/* Horizontal grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = trendSvg.padY + ratio * (trendSvg.height - trendSvg.padY * 2);
                        const val = Math.round(trendSvg.maxVal * (1 - ratio));
                        return (
                          <g key={idx}>
                            <line
                              x1={trendSvg.padX}
                              y1={y}
                              x2={trendSvg.width - trendSvg.padX}
                              y2={y}
                              stroke="#cbd5e1"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                            <text x={trendSvg.padX - 6} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Lines */}
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        points={trendSvg.initPoints}
                      />
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        points={trendSvg.verifPoints}
                      />
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        points={trendSvg.compPoints}
                      />

                      {/* Data points & X-axis labels */}
                      {trendData.map((d, i) => {
                        const x = trendSvg.getX(i);
                        const yComp = trendSvg.getY(d.completed);
                        const yVerif = trendSvg.getY(d.patwariVerification);
                        const yInit = trendSvg.getY(d.registryInitiated);
                        return (
                          <g key={d.date}>
                            <circle cx={x} cy={yInit} r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1" />
                            <circle cx={x} cy={yVerif} r="3.5" fill="#6366f1" stroke="#fff" strokeWidth="1" />
                            <circle cx={x} cy={yComp} r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                            <text
                              x={x}
                              y={yComp - 7}
                              textAnchor="middle"
                              className="text-[9px] font-bold fill-emerald-800 font-mono"
                            >
                              {d.completed}
                            </text>
                            <text
                              x={x}
                              y={trendSvg.height - 7}
                              textAnchor="middle"
                              className="text-[9px] fill-slate-700 font-mono font-semibold"
                            >
                              {d.date.slice(0, 5)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* MODE 3: FULL ADMINISTRATIVE REPORT PDF                            */}
            {/* ================================================================= */}
            {reportMode === 'full' && (
              <>
                {/* 1. Abstract / Summary KPI Table */}
                <div className="page-break-avoid">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      1. वृत्त स्तरीय समग्र प्रगति सारांश (Tehsil Executive Abstract):
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">वृत्त: तामिया</span>
                  </div>

                  <table className="w-full text-xs border border-slate-400 border-collapse">
                    <tbody>
                      <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-800 text-center">
                        <td className="p-2 border-r border-slate-400">कुल ग्राम</td>
                        <td className="p-2 border-r border-slate-400">सक्रिय पटवारी</td>
                        <td className="p-2 border-r border-slate-400">कुल लक्ष्य भूखंड</td>
                        <td className="p-2 border-r border-slate-400">कुल हितग्राही</td>
                        <td className="p-2 border-r border-slate-400 text-amber-900 bg-amber-50/50">पंजीयन प्रारंभ</td>
                        <td className="p-2 border-r border-slate-400 text-indigo-900 bg-indigo-50/50">पटवारी सत्यापन</td>
                        <td className="p-2 border-r border-slate-400 text-emerald-900 bg-emerald-50/50">पूर्ण पंजीयन</td>
                        <td className="p-2 text-emerald-900 bg-emerald-100/60 font-black">पूर्णता दर (%)</td>
                      </tr>
                      <tr className="font-mono text-center font-bold">
                        <td className="p-2.5 border-r border-slate-400 text-slate-900">{kpis.totalVillages}</td>
                        <td className="p-2.5 border-r border-slate-400 text-slate-900">{kpis.totalPatwaris}</td>
                        <td className="p-2.5 border-r border-slate-400 text-slate-900">{kpis.totalPlots}</td>
                        <td className="p-2.5 border-r border-slate-400 text-slate-900">{kpis.totalBeneficiaries}</td>
                        <td className="p-2.5 border-r border-slate-400 text-amber-800 font-black bg-amber-50/30">
                          {kpis.registryInitiated}
                        </td>
                        <td className="p-2.5 border-r border-slate-400 text-indigo-800 font-black bg-indigo-50/30">
                          {kpis.patwariVerification}
                        </td>
                        <td className="p-2.5 border-r border-slate-400 text-emerald-800 font-black bg-emerald-50/30">
                          {kpis.completed}
                        </td>
                        <td className="p-2.5 text-emerald-800 font-black text-sm bg-emerald-100/40">
                          {kpis.pctCompleted}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Bottleneck / Verification Lag Indicator */}
                <div className="page-break-avoid bg-amber-50/80 border-l-4 border-amber-500 border-y border-r border-slate-300 rounded-r p-3 text-xs text-amber-950">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>प्रशासनिक समीक्षा टीप एवं बॉटलनेक विश्लेषण (Administrative Audit):</span>
                  </div>
                  <p className="leading-relaxed">
                    कुल <strong>{kpis.registryInitiated}</strong> पंजीयन आवेदनों में से <strong>{kpis.patwariVerification}</strong> का पटवारी सत्यापन पूर्ण हुआ है तथा वर्तमान में <strong>{kpis.pendingVerification}</strong> आवेदन पटवारी स्तर पर सत्यापन हेतु लंबित हैं।
                    पूर्व दिनांक ({comparison.previousDate}) की तुलना में पूर्ण पंजीयन में <strong>{comparison.deltaCompleted >= 0 ? `+${comparison.deltaCompleted}` : comparison.deltaCompleted}</strong> भूखंडों की वृद्धि दर्ज की गई है।
                  </p>
                </div>

                {/* 3. Patwari Rankwise Table */}
                <div className="page-break-avoid">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      2. हल्का पटवारी-वार प्रगति विवरण एवं रैंकिंग (Patwari Performance Status):
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">कुल पटवारी: {summaries.length}</span>
                  </div>

                  <table className="w-full text-[11px] border border-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-800">
                        <th className="p-1.5 border-r border-slate-400 text-center w-8">क्र.</th>
                        <th className="p-1.5 border-r border-slate-400 text-left">पटवारी का नाम</th>
                        <th className="p-1.5 border-r border-slate-400 text-center">ग्राम संख्या</th>
                        <th className="p-1.5 border-r border-slate-400 text-right">कुल भूखंड</th>
                        <th className="p-1.5 border-r border-slate-400 text-right text-amber-900 bg-amber-50/40">प्रारंभ</th>
                        <th className="p-1.5 border-r border-slate-400 text-right text-indigo-900 bg-indigo-50/40">सत्यापित</th>
                        <th className="p-1.5 border-r border-slate-400 text-right text-rose-900 bg-rose-50/40">लंबित जांच</th>
                        <th className="p-1.5 border-r border-slate-400 text-right text-emerald-900 bg-emerald-50/40">पूर्ण</th>
                        <th className="p-1.5 border-r border-slate-400 text-right text-emerald-900 bg-emerald-100/50">प्रगति %</th>
                        <th className="p-1.5 text-center">श्रेणी</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {summaries.map((s, idx) => {
                        const tierLabel =
                          s.performanceTier === 'high'
                            ? 'उत्कृष्ट'
                            : s.performanceTier === 'moderate'
                            ? 'संतोषजनक'
                            : s.performanceTier === 'lagging'
                            ? 'धीमी'
                            : 'गंभीर';
                        const tierColor =
                          s.performanceTier === 'high'
                            ? 'text-emerald-800 font-bold'
                            : s.performanceTier === 'moderate'
                            ? 'text-blue-800'
                            : s.performanceTier === 'lagging'
                            ? 'text-amber-800'
                            : 'text-rose-800 font-bold';

                        return (
                          <tr key={s.patwariName} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-300 font-bold text-slate-900">{s.patwariName}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono">{s.villagesCount}</td>
                            <td className="p-1.5 border-r border-slate-300 text-right font-mono font-medium">{s.totalPlots}</td>
                            <td className="p-1.5 border-r border-slate-300 text-right font-mono font-semibold text-amber-800 bg-amber-50/20">
                              {s.registryInitiated}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-right font-mono font-semibold text-indigo-800 bg-indigo-50/20">
                              {s.patwariVerification}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-right font-mono text-rose-700 bg-rose-50/20">
                              {s.pendingVerification}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20">
                              {s.completed}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-right font-mono font-extrabold text-emerald-800 bg-emerald-100/30">
                              {s.pctCompleted}%
                            </td>
                            <td className={`p-1.5 text-center text-[10px] ${tierColor}`}>
                              {tierLabel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. Optional Date Comparison Matrix Table */}
                {includeMatrix && matrixRows.length > 0 && dates.length > 0 && (
                  <div className="page-break-avoid">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        3. दिनांक-वार प्रगति तुलना मैट्रिक्स (Date-wise Performance Matrix):
                      </h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {dates.join(' • ')}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] border border-slate-400 border-collapse">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-800 text-center">
                            <th className="p-1 border-r border-slate-400 w-6">क्र.</th>
                            <th className="p-1 border-r border-slate-400 text-left">पटवारी का नाम</th>
                            <th className="p-1 border-r border-slate-400">भूखंड</th>
                            {dates.map((d) => (
                              <th key={d} className="p-1 border-r border-slate-400">
                                {d}
                              </th>
                            ))}
                            <th className="p-1 text-right text-emerald-900 bg-emerald-100/50">प्रगति %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {matrixRows.map((r, idx) => {
                            const latestDate = dates.length > 0 ? dates[dates.length - 1] : '';
                            const latestDm = latestDate ? r.dateMetrics[latestDate] : null;

                            return (
                              <tr key={r.patwariName} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="p-1 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                                <td className="p-1 border-r border-slate-300 font-medium text-slate-900">{r.patwariName}</td>
                                <td className="p-1 border-r border-slate-300 text-center font-mono">{r.totalPlots}</td>
                                {dates.map((d) => {
                                  const dm = r.dateMetrics[d];
                                  return (
                                    <td key={d} className="p-1 border-r border-slate-300 text-center font-mono">
                                      {dm ? (
                                        <span>
                                          <strong>{dm.completed}</strong> <span className="text-slate-500">({dm.pctCompleted}%)</span>
                                        </span>
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="p-1 text-right font-mono font-bold text-emerald-800 bg-emerald-100/30">
                                  {latestDm ? `${latestDm.pctCompleted}%` : '0%'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Optional Village Detail Register */}
                {includeVillages && activeVillagesData.length > 0 && (
                  <div className="page-break-avoid">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        4. ग्राम-वार विस्तृत राजस्व अभिलेख सूची (Village Master Inventory):
                      </h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        कुल ग्राम: {activeVillagesData.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-96 print:max-h-none">
                      <table className="w-full text-[10px] border border-slate-400 border-collapse">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-800">
                            <th className="p-1 border-r border-slate-400 text-center w-6">क्र.</th>
                            <th className="p-1 border-r border-slate-400 text-left">ग्राम का नाम</th>
                            <th className="p-1 border-r border-slate-400 text-left">पटवारी</th>
                            <th className="p-1 border-r border-slate-400 text-right">भूखंड</th>
                            <th className="p-1 border-r border-slate-400 text-right">हितग्राही</th>
                            <th className="p-1 border-r border-slate-400 text-right">प्रारंभ</th>
                            <th className="p-1 border-r border-slate-400 text-right">सत्यापित</th>
                            <th className="p-1 border-r border-slate-400 text-right">पूर्ण</th>
                            <th className="p-1 text-right text-emerald-900 bg-emerald-100/50">प्रगति %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {activeVillagesData.map((v, idx) => (
                            <tr key={`${v.village}-${v.patwariName}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-1 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                              <td className="p-1 border-r border-slate-300 font-medium text-slate-900">{v.village}</td>
                              <td className="p-1 border-r border-slate-300 text-slate-700">{v.patwariName}</td>
                              <td className="p-1 border-r border-slate-300 text-right font-mono">{v.plots}</td>
                              <td className="p-1 border-r border-slate-300 text-right font-mono">{v.beneficiaries}</td>
                              <td className="p-1 border-r border-slate-300 text-right font-mono text-amber-800">{v.registryInitiated}</td>
                              <td className="p-1 border-r border-slate-300 text-right font-mono text-indigo-800">{v.patwariVerification}</td>
                              <td className="p-1 border-r border-slate-300 text-right font-mono font-bold text-emerald-800">{v.completed}</td>
                              <td className="p-1 text-right font-mono font-bold text-emerald-800 bg-emerald-100/30">{v.pctCompleted}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Official Signatures Block */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs page-break-avoid border-t border-slate-300">
              <div>
                <div className="border-t border-slate-900 pt-2 font-bold text-slate-900">
                  हस्ताक्षर राजस्व निरीक्षक (RI)
                </div>
                <div className="text-[10px] text-slate-600 font-medium mt-0.5">वृत्त: तामिया</div>
                <div className="text-[9px] text-slate-400 mt-1 font-mono">तहसील तामिया, छिंदवाड़ा</div>
              </div>

              <div>
                <div className="border-t border-slate-900 pt-2 font-bold text-slate-900">
                  हस्ताक्षर नायब तहसीलदार
                </div>
                <div className="text-[10px] text-slate-600 font-medium mt-0.5">वृत्त: तामिया</div>
                <div className="text-[9px] text-slate-400 mt-1 font-mono">तहसील तामिया, छिंदवाड़ा</div>
              </div>

              <div>
                <div className="border-t border-slate-900 pt-2 font-black text-slate-950">
                  तहसीलदार / अनुविभागीय अधिकारी (राजस्व)
                </div>
                <div className="text-[10px] text-slate-700 font-bold mt-0.5">तामिया, जिला छिंदवाड़ा (म.प्र.)</div>
                <div className="text-[9px] text-slate-400 mt-1 font-mono">शासकीय मुहर / Seal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

