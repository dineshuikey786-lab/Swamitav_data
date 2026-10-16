import React, { useState, useEffect } from 'react';
import { X, CheckCircle, PlusCircle, Edit2, AlertCircle } from 'lucide-react';
import { PatwariRecord } from '../utils/patwariAnalytics';

interface AddEditRecordModalProps {
  initialRecord: PatwariRecord | null;
  patwariList: string[];
  currentDate: string;
  onSave: (record: PatwariRecord) => void;
  onClose: () => void;
}

export const AddEditRecordModal: React.FC<AddEditRecordModalProps> = ({
  initialRecord,
  patwariList,
  currentDate,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialRecord);

  const [village, setVillage] = useState(initialRecord?.village || '');
  const [lgdCode, setLgdCode] = useState(initialRecord?.lgdCode || '');
  const [patwariName, setPatwariName] = useState(initialRecord?.patwariName || patwariList[0] || '');
  const [date, setDate] = useState(initialRecord?.date || currentDate || '12-10-2026');
  const [plots, setPlots] = useState(initialRecord?.plots || 0);
  const [beneficiaries, setBeneficiaries] = useState(initialRecord?.beneficiaries || 0);
  const [registryInitiated, setRegistryInitiated] = useState(initialRecord?.registryInitiated || 0);
  const [patwariVerification, setPatwariVerification] = useState(initialRecord?.patwariVerification || 0);
  const [submitted, setSubmitted] = useState(initialRecord?.submitted || 0);
  const [registrationIn, setRegistrationIn] = useState(initialRecord?.registrationIn || 0);
  const [completed, setCompleted] = useState(initialRecord?.completed || 0);
  const [error, setError] = useState('');

  const calculatedPct =
    plots > 0 ? Math.round((completed / plots) * 10000) / 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!village.trim()) {
      setError('कृपया गांव का नाम दर्ज करें।');
      return;
    }
    if (!patwariName.trim()) {
      setError('कृपया पटवारी का नाम चुनें या दर्ज करें।');
      return;
    }

    const newRecord: PatwariRecord = {
      id: initialRecord?.id || `${lgdCode || village}-${date}-${Date.now()}`,
      sno: initialRecord?.sno || Math.floor(Math.random() * 900) + 100,
      village: village.trim(),
      lgdCode: lgdCode.trim(),
      patwariName: patwariName.trim(),
      plots: Number(plots) || 0,
      beneficiaries: Number(beneficiaries) || 0,
      registryInitiated: Number(registryInitiated) || 0,
      patwariVerification: Number(patwariVerification) || 0,
      submitted: Number(submitted) || 0,
      registrationIn: Number(registrationIn) || 0,
      completed: Number(completed) || 0,
      pctCompleted: calculatedPct,
      date: date.trim(),
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              {isEditing ? <Edit2 className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'ग्राम रिकॉर्ड संपादित करें' : 'नया दैनिक प्रगति रिकॉर्ड जोड़ें'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? `ग्राम: ${village} • LGD: ${lgdCode}` : 'दैनिक राजस्व प्रगति अपडेट'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                गांव का नाम (Village Name) *
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="उदा. अन्होनी / आमढाना"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-hindi"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                LGD कोड (LGD Code)
              </label>
              <input
                type="text"
                value={lgdCode}
                onChange={(e) => setLgdCode(e.target.value)}
                placeholder="उदा. 493692"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                प्रभारी पटवारी (Patwari Name) *
              </label>
              <input
                type="text"
                list="patwari-suggestions"
                required
                value={patwariName}
                onChange={(e) => setPatwariName(e.target.value)}
                placeholder="पटवारी का नाम..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <datalist id="patwari-suggestions">
                {patwariList.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                दिनांक (Date DD-MM-YYYY)
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="12-10-2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              प्रगति आंकड़े (Progress Numbers)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">कुल भूखंड (Plots)</label>
                <input
                  type="number"
                  min="0"
                  value={plots}
                  onChange={(e) => setPlots(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">हितग्राही</label>
                <input
                  type="number"
                  min="0"
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-amber-400 mb-1">पंजीयन प्रारंभ</label>
                <input
                  type="number"
                  min="0"
                  value={registryInitiated}
                  onChange={(e) => setRegistryInitiated(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-indigo-400 mb-1">पटवारी सत्यापन</label>
                <input
                  type="number"
                  min="0"
                  value={patwariVerification}
                  onChange={(e) => setPatwariVerification(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-indigo-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">प्रस्तुत (Submitted)</label>
                <input
                  type="number"
                  min="0"
                  value={submitted}
                  onChange={(e) => setSubmitted(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">पंजीयन प्रक्रियाधीन</label>
                <input
                  type="number"
                  min="0"
                  value={registrationIn}
                  onChange={(e) => setRegistrationIn(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-emerald-400 mb-1">पूर्ण पंजीयन (Completed)</label>
                <input
                  type="number"
                  min="0"
                  value={completed}
                  onChange={(e) => setCompleted(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-emerald-700/80 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">गणना प्रतिशत (%)</label>
                <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400">
                  {calculatedPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30"
            >
              {isEditing ? 'अपडेट सुरक्षित करें' : 'रिकॉर्ड जोड़ें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
