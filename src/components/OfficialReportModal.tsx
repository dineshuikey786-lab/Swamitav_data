import React, { useState, useRef } from 'react';
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
  ChevronDown,
  Loader2,
  Calendar,
  Building,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  OverallKpis,
  PatwariSummary,
  PeriodComparison,
  PatwariRecord,
  PatwariDateMatrixRow,
} from '../utils/patwariAnalytics';
import { exportDashboardToExcel, downloadElementAsPdf } from '../utils/exportUtils';

interface OfficialReportModalProps {
  kpis: OverallKpis;
  summaries: PatwariSummary[];
  comparison: PeriodComparison;
  selectedPeriod: 'day' | 'week' | 'month';
  records?: PatwariRecord[];
  matrixRows?: PatwariDateMatrixRow[];
  dates?: string[];
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
  matrixRows = [],
  dates = [],
  onSelectDate,
  onRefreshData,
  isRefreshing = false,
  onClose,
}) => {
  const [includeVillages, setIncludeVillages] = useState(false);
  const [includeMatrix, setIncludeMatrix] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const cleanDate = comparison.currentDate.replace(/[^a-zA-Z0-9-]/g, '_');
      const fileName = `Tamia_Patwari_Administrative_Report_${cleanDate}.pdf`;

      await downloadElementAsPdf(reportRef.current, fileName, (msg) => {
        setStatusMessage(msg);
      });

      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setStatusMessage('पीडीएफ निर्माण में त्रुटि। कृपया प्रिंट विकल्प का उपयोग करें।');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const periodTitle =
    selectedPeriod === 'day'
      ? 'दैनिक प्रगति प्रतिवेदन (Daily Progress Report)'
      : selectedPeriod === 'week'
      ? 'साप्ताहिक प्रगति समीक्षा (Weekly Progress Review)'
      : 'मासिक प्रगति समीक्षा (Monthly Progress Review)';

  const activeVillagesData = records.length > 0 ? records : summaries.flatMap((s) => s.villages);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Controls Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span>शासकीय प्रगति प्रतिवेदन एवं एक्सपोर्ट</span>
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal border border-emerald-500/30">
                    {comparison.currentDate}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                प्रशासनिक शेयरिंग हेतु स्वच्छ PDF और विस्तृत एक्सेल (.xlsx) प्रारूप ({kpis.totalVillages} ग्राम • {kpis.completed} पूर्ण)
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Refresh Button inside Report */}
            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                disabled={isRefreshing}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/70 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                title="Google Sheet एवं GitHub से नवीनतम डेटा अभी सिंक करें"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>लाइव डेटा सिंक</span>
              </button>
            )}

            {/* Excel Export Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
              title="सभी 4 शीट्स सहित एक्सेल वर्कबुक डाउनलोड करें"
            >
              {isExportingExcel ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
              )}
              <span>एक्सेल (.xlsx) एक्सपोर्ट</span>
            </button>

            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
              title="क्लीन फॉर्मेटेड प्रशासनिक PDF सीधे डाउनलोड करें"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-rose-200" />
              )}
              <span>PDF डाउनलोड</span>
            </button>

            {/* Print / System PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="सिस्टम प्रिंटर या 'Save as PDF' से प्रिंट करें"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">प्रिंट</span>
            </button>

            {/* Close Button */}
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

        {/* Options & Status Bar */}
        <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 print:hidden">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium">रिपोर्ट सामग्री विकल्प:</span>
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
            className="print-document max-w-4xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 font-sans space-y-6"
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
                कार्यालय अनुविभागीय अधिकारी (राजस्व) / तहसीलदार
              </h1>
              <div className="text-sm font-bold text-slate-800">
                वृत्त: तामिया • तहसील: तामिया • जिला: छिंदवाड़ा (मध्य प्रदेश)
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-1">
                स्वामित्व योजना (SVAMITVA Scheme) / आबादी भूमि अधिकार अभिलेख एवं पंजीयन निगरानी
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <span className="bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-bold text-slate-800">
                  {periodTitle}
                </span>
                <span className="bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-bold text-slate-800 font-mono">
                  समीक्षा दिनांक: {comparison.currentDate}
                </span>
                <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded text-xs text-slate-500 font-mono">
                  प्रिंट समय: {new Date().toLocaleTimeString('hi-IN')}
                </span>
              </div>
            </div>

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

            {/* 6. Official Signatures Block */}
            <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs page-break-avoid border-t border-slate-300">
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
