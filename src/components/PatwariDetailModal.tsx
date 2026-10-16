import React, { useState } from 'react';
import { PatwariSummary } from '../utils/patwariAnalytics';
import {
  X,
  User,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';

interface PatwariDetailModalProps {
  patwari: PatwariSummary | null;
  onClose: () => void;
  onDraftNotice?: (patwariName: string) => void;
}

export const PatwariDetailModal: React.FC<PatwariDetailModalProps> = ({
  patwari,
  onClose,
  onDraftNotice,
}) => {
  const [copied, setCopied] = useState(false);
  const [showNoticeDraft, setShowNoticeDraft] = useState(false);

  if (!patwari) return null;

  const deltaTotal = patwari.dailyDelta.completedDelta + patwari.dailyDelta.verificationDelta;

  const noticeText = `कार्यालय तहसीलदार / उपखंड अधिकारी (राजस्व), वृत्त तामिया
क्रमांक: राज/सर्वे/2026/....                                  दिनांक: 12-10-2026

विषय: स्वामित्व / आबादी भूमि सर्वे पंजीयन कार्य में धीमी प्रगति एवं समीक्षा बाबत।
प्रति,
श्री/श्रीमती ${patwari.patwariName}, हल्का पटवारी।

संदर्भित विषय में आपके प्रभार अंतर्गत कुल ${patwari.villagesCount} ग्रामों के ${patwari.totalPlots} भूखंडों का सर्वे एवं पंजीयन प्रगति की समीक्षा की गई।
समीक्षा में पाया गया कि:
1. कुल लक्ष्य: ${patwari.totalPlots} भूखंड
2. पंजीयन हेतु प्रारंभ: ${patwari.registryInitiated}
3. पटवारी सत्यापन पूर्ण: ${patwari.patwariVerification}
4. अंतिम पूर्ण पंजीयन: ${patwari.completed} (${patwari.pctCompleted}%)
5. सत्यापन स्तर पर लंबित आवेदन: ${patwari.pendingVerification}

अतः आपको निर्देशित किया जाता है कि आगामी 3 दिवस के भीतर लंबित पटवारी सत्यापन का कार्य पूर्ण कर प्रतिवेदन प्रस्तुत करें। लापरवाही पाए जाने पर अनुशासनात्मक कार्रवाई की जावेगी।

(तहसीलदार / उपखंड अधिकारी)
वृत्त तामिया`;

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(noticeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{patwari.patwariName}</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    patwari.performanceTier === 'high'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : patwari.performanceTier === 'moderate'
                      ? 'bg-blue-950 text-blue-300 border-blue-700'
                      : patwari.performanceTier === 'lagging'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {patwari.performanceTier === 'high'
                    ? 'उत्कृष्ट प्रगति'
                    : patwari.performanceTier === 'moderate'
                    ? 'प्रगतिरत'
                    : patwari.performanceTier === 'lagging'
                    ? 'सत्यापन शेष'
                    : 'शून्य प्रगति'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                हल्का पटवारी व्यक्तिगत कार्य निष्पादन एवं ग्रामवार विवरण
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 uppercase font-medium">आवंटित ग्राम</span>
              <div className="text-xl font-bold text-white mt-1">{patwari.villagesCount}</div>
              <span className="text-[10px] text-slate-500">{patwari.totalPlots} कुल भूखंड</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-amber-400 uppercase font-medium">प्रारंभ आवेदन</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{patwari.registryInitiated}</div>
              <span className="text-[10px] text-slate-500">
                {patwari.totalPlots > 0 ? ((patwari.registryInitiated / patwari.totalPlots) * 100).toFixed(0) : 0}% कुल का
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-indigo-400 uppercase font-medium">पटवारी सत्यापन</span>
              <div className="text-xl font-bold text-indigo-400 mt-1">{patwari.patwariVerification}</div>
              <span className="text-[10px] text-rose-400">
                {patwari.pendingVerification} शेष जांच
              </span>
            </div>

            <div className="bg-slate-950/70 border border-emerald-900/60 rounded-xl p-3">
              <span className="text-[11px] text-emerald-400 uppercase font-medium">पूर्ण पंजीयन</span>
              <div className="text-xl font-extrabold text-emerald-300 mt-1">{patwari.completed}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">{patwari.pctCompleted}% पूर्ण</span>
            </div>
          </div>

          {/* Daily Delta Banner */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-300 font-medium">दैनिक प्रगति विश्लेषण (Day Delta):</span>
              <span className="text-slate-400">
                सत्यापन: <strong className="text-indigo-400 font-mono">+{patwari.dailyDelta.verificationDelta}</strong> | पूर्ण पंजीयन: <strong className="text-emerald-400 font-mono">+{patwari.dailyDelta.completedDelta}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowNoticeDraft(!showNoticeDraft)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{showNoticeDraft ? 'नोटिस प्रारूप छुपाएं' : 'समीक्षा नोटिस प्रारूप देखें'}</span>
            </button>
          </div>

          {/* Notice Draft Preview Box */}
          {showNoticeDraft && (
            <div className="bg-slate-950 border border-amber-900/50 rounded-xl p-4 text-xs font-mono text-slate-300 relative">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  प्रारूप: प्रशासनिक प्रगति समीक्षा / शो-कॉज नोटिस
                </span>
                <button
                  type="button"
                  onClick={handleCopyNotice}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'कॉपी हो गया' : 'कॉपी करें'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-hindi text-slate-300 leading-relaxed">
                {noticeText}
              </pre>
            </div>
          )}

          {/* Assigned Villages List */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>प्रभार के ग्राम ({patwari.villages.length})</span>
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3">ग्राम</th>
                    <th className="py-2 px-3">LGD कोड</th>
                    <th className="py-2 px-3 text-right">भूखंड</th>
                    <th className="py-2 px-3 text-right">हितग्राही</th>
                    <th className="py-2 px-3 text-right">प्रारंभ</th>
                    <th className="py-2 px-3 text-right">सत्यापित</th>
                    <th className="py-2 px-3 text-right">पूर्ण</th>
                    <th className="py-2 px-3 text-right">प्रगति %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {patwari.villages.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-hindi font-medium text-white">{v.village}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{v.lgdCode}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">{v.plots}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">{v.beneficiaries}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">{v.registryInitiated}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-400 font-semibold">{v.patwariVerification}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">{v.completed}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            v.pctCompleted > 0
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {v.pctCompleted}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
