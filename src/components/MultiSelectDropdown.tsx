import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
  badge?: string;
  badgeColor?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  allLabel?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  icon?: React.ReactNode;
  maxDisplay?: number;
  className?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  allLabel = 'सभी (All)',
  options,
  selectedValues,
  onChange,
  icon,
  maxDisplay = 2,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isAllSelected =
    selectedValues.length === 0 ||
    selectedValues.includes('all') ||
    selectedValues.length === options.length;

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (val: string) => {
    if (isAllSelected) {
      onChange([val]);
      return;
    }

    if (selectedValues.includes(val)) {
      const next = selectedValues.filter((v) => v !== val);
      onChange(next.length === 0 ? [] : next);
    } else {
      const next = [...selectedValues, val];
      if (next.length === options.length) {
        onChange([]);
      } else {
        onChange(next);
      }
    }
  };

  const selectAll = () => {
    onChange([]);
  };

  const clearAll = () => {
    onChange(['none']);
  };

  const triggerLabel = () => {
    if (isAllSelected) {
      return `${label}: ${allLabel} (${options.length})`;
    }
    if (selectedValues.length === 1) {
      const found = options.find((o) => o.value === selectedValues[0]);
      return `${label}: ${found ? found.label : selectedValues[0]}`;
    }
    return `${label}: ${selectedValues.length} चयनित (${selectedValues.length} Selected)`;
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
          isOpen || (!isAllSelected && selectedValues.length > 0)
            ? isDark
              ? 'bg-slate-800 border-emerald-500/70 text-emerald-300'
              : 'bg-emerald-50 border-emerald-500 text-emerald-800'
            : isDark
            ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-sm'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[240px]">
          {icon}
          <span className="truncate">{triggerLabel()}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            isOpen ? 'rotate-180 text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-1.5 w-64 sm:w-72 border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Search box inside dropdown */}
          <div className={`p-2 border-b ${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50'}`}>
            <div className="relative">
              <Search
                className={`h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="text"
                placeholder="सूची में खोजें..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full border rounded-lg pl-7 pr-7 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Action Row: Select All / Clear */}
          <div
            className={`px-2.5 py-1.5 border-b flex items-center justify-between text-[11px] ${
              isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={selectAll}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              सभी चुनें (Select All)
            </button>
            <button
              type="button"
              onClick={clearAll}
              className={`font-medium ${isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'}`}
            >
              हटाएं (Clear)
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                कोई विकल्प नहीं मिला
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = isAllSelected || selectedValues.includes(opt.value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-950/40 text-emerald-200'
                          : 'bg-emerald-50 text-emerald-900 font-medium'
                        : isDark
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : isDark
                            ? 'border-slate-600 bg-slate-950'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            opt.badgeColor || (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {opt.count !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {opt.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer showing count */}
          <div
            className={`p-1.5 border-t text-center text-[10px] ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}
          >
            {isAllSelected
              ? `सभी ${options.length} आइटम चयनित`
              : `${selectedValues.length} / ${options.length} चयनित`}
          </div>
        </div>
      )}
    </div>
  );
};
