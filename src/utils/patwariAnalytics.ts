export interface PatwariRecord {
  id: string;
  sno: number;
  village: string;
  lgdCode: string;
  patwariName: string;
  plots: number;
  beneficiaries: number;
  registryInitiated: number;
  patwariVerification: number;
  submitted: number;
  registrationIn: number;
  completed: number;
  pctCompleted: number;
  date: string; // DD-MM-YYYY
}

export interface OverallKpis {
  totalVillages: number;
  totalPatwaris: number;
  totalPlots: number;
  totalBeneficiaries: number;
  registryInitiated: number;
  patwariVerification: number;
  submitted: number;
  registrationIn: number;
  completed: number;
  pctCompleted: number;
  pendingVerification: number;
  activeVillages: number;
  zeroProgressVillages: number;
}

export interface PatwariDailyDelta {
  initiatedDelta: number;
  verificationDelta: number;
  completedDelta: number;
}

export interface PatwariSummary {
  patwariName: string;
  villagesCount: number;
  totalPlots: number;
  totalBeneficiaries: number;
  registryInitiated: number;
  patwariVerification: number;
  submitted: number;
  registrationIn: number;
  completed: number;
  pctCompleted: number;
  pendingVerification: number;
  dailyDelta: PatwariDailyDelta;
  performanceTier: 'high' | 'moderate' | 'lagging' | 'critical';
  villages: PatwariRecord[];
}

export interface PeriodComparison {
  period: 'day' | 'week' | 'month';
  currentDate: string;
  previousDate: string;
  currentPlots: number;
  currentInitiated: number;
  currentVerified: number;
  currentCompleted: number;
  previousInitiated: number;
  previousVerified: number;
  previousCompleted: number;
  deltaInitiated: number;
  deltaVerified: number;
  deltaCompleted: number;
  pctDeltaCompleted: number;
  activePatwarisCount: number;
  inactivePatwarisCount: number;
}

export interface PatwariGroup {
  patwariName: string;
  villagesCount: number;
  totalPlots: number;
  totalBeneficiaries: number;
  registryInitiated: number;
  patwariVerification: number;
  submitted: number;
  registrationIn: number;
  completed: number;
  pctCompleted: number;
  pendingVerification: number;
  villages: PatwariRecord[];
}

export interface PatwariDateMetric {
  date: string;
  plots: number;
  initiated: number;
  verified: number;
  completed: number;
  pctCompleted: number;
  pendingVerification: number;
}

export interface PatwariDateMatrixRow {
  patwariName: string;
  villagesCount: number;
  totalPlots: number;
  dateMetrics: Record<string, PatwariDateMetric>;
  delta: {
    initiatedDelta: number;
    verificationDelta: number;
    completedDelta: number;
  };
}

export interface MultiFilterOptions {
  patwaris?: string[];
  dates?: string[];
  statusFilter?: 'all' | 'zero' | 'active' | 'completed';
  searchTerm?: string;
}

/**
 * Splits a CSV line into fields respecting quotes (RFC 4180).
 */
export function splitCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Normalizes date string into DD-MM-YYYY format.
 * Supports: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, YYYY/MM/DD, DD.MM.YYYY
 */
export function normalizeDateString(rawDate: string): string {
  if (!rawDate) return '13-10-2026';
  const clean = rawDate.trim().replace(/['"]/g, '');

  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }

  // Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }

  return clean;
}

/**
 * Parses raw CSV into strongly-typed PatwariRecord array.
 * Tolerates Hindi UTF-8, quotes with commas, Hindi/English headers in any order, and floating point %s.
 */
export function parseCSVDataset(csvText: string): PatwariRecord[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header line to detect column positions
  const headerParts = splitCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/['"▲▼]/g, '').trim()
  );

  // Column index mapper with support for Hindi and English column variants
  let colSno = headerParts.findIndex((h) => /^(s\.?no|sno|sr\.?no|क्रमांक|क्र\.)$/i.test(h));
  let colVillage = headerParts.findIndex((h) => /(village|ग्राम|गांव|मौजा)/i.test(h));
  let colLgd = headerParts.findIndex((h) => /(lgd|एलजीडी|code|कोड)/i.test(h));
  let colPatwari = headerParts.findIndex((h) => /(patwari|पटवारी)/i.test(h));
  let colPlots = headerParts.findIndex((h) => /(plots|भूखण्ड|भूखंड)/i.test(h));
  let colBeneficiaries = headerParts.findIndex((h) => /(beneficiar|हितग्राही|लाभार्थी)/i.test(h));
  let colInitiated = headerParts.findIndex((h) => /(initiated|प्रारंभ|पंजीयन प्रारंभ)/i.test(h));
  let colVerified = headerParts.findIndex((h) => /(verification|सत्यापन|जांच)/i.test(h));
  let colSubmitted = headerParts.findIndex((h) => /(submitted|प्रस्तुत)/i.test(h));
  let colRegistrationIn = headerParts.findIndex((h) => /(registration in|पंजीयन में|प्रक्रियाधीन)/i.test(h));
  let colCompleted = headerParts.findIndex((h) => /^(completed|पूर्ण)$/i.test(h));
  let colPct = headerParts.findIndex((h) => /(%|pct|percent|प्रतिशत)/i.test(h));
  let colDate = headerParts.findIndex((h) => /(date|तारीख|दिनांक)/i.test(h));

  // Fallback to standard positional index if header wasn't standard
  if (colVillage === -1) colVillage = 1;
  if (colLgd === -1) colLgd = 2;
  if (colPatwari === -1) colPatwari = 3;
  if (colPlots === -1) colPlots = 4;
  if (colBeneficiaries === -1) colBeneficiaries = 5;
  if (colInitiated === -1) colInitiated = 6;
  if (colVerified === -1) colVerified = 7;
  if (colSubmitted === -1) colSubmitted = 8;
  if (colRegistrationIn === -1) colRegistrationIn = 9;
  if (colCompleted === -1) colCompleted = 10;
  if (colPct === -1) colPct = 11;
  if (colDate === -1) colDate = 12;

  const records: PatwariRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const parts = splitCSVLine(rawLine);
    if (parts.length < 6) continue;

    const sno = colSno >= 0 && parts[colSno] ? parseInt(parts[colSno], 10) || i : i;
    const village = parts[colVillage] || `Village ${i}`;
    const lgdCode = parts[colLgd] || '';
    const patwariName = parts[colPatwari] || 'Unknown Patwari';
    const plots = parseInt(parts[colPlots] || '0', 10) || 0;
    const beneficiaries = parseInt(parts[colBeneficiaries] || '0', 10) || 0;
    const registryInitiated = parseInt(parts[colInitiated] || '0', 10) || 0;
    const patwariVerification = parseInt(parts[colVerified] || '0', 10) || 0;
    const submitted = parseInt(parts[colSubmitted] || '0', 10) || 0;
    const registrationIn = parseInt(parts[colRegistrationIn] || '0', 10) || 0;
    const completed = parseInt(parts[colCompleted] || '0', 10) || 0;

    let pctRaw = parseFloat(parts[colPct] || '0') || 0;
    // Normalize percentage: if <= 1.0 (e.g. 0.122), convert to 12.2%
    let pctCompleted = pctRaw;
    if (pctRaw > 0 && pctRaw <= 1.0) {
      pctCompleted = pctRaw * 100;
    } else if (plots > 0 && pctCompleted === 0 && completed > 0) {
      pctCompleted = (completed / plots) * 100;
    }
    pctCompleted = Math.round(pctCompleted * 100) / 100;

    const rawDate = (colDate >= 0 && parts[colDate]) || '13-10-2026';
    const date = normalizeDateString(rawDate);
    const id = `${lgdCode || village}-${date}-${sno}`;

    records.push({
      id,
      sno,
      village,
      lgdCode,
      patwariName,
      plots,
      beneficiaries,
      registryInitiated,
      patwariVerification,
      submitted,
      registrationIn,
      completed,
      pctCompleted,
      date,
    });
  }

  return records;
}

/**
 * Extracts unique available dates sorted in ascending chronological order.
 */
export function getAvailableDates(records: PatwariRecord[]): string[] {
  const dates = Array.from(new Set(records.map((r) => r.date)));
  return dates.sort((a, b) => {
    // Sort DD-MM-YYYY format
    const [dayA, monthA, yearA] = a.split('-').map(Number);
    const [dayB, monthB, yearB] = b.split('-').map(Number);
    const timeA = new Date(yearA, monthA - 1, dayA).getTime();
    const timeB = new Date(yearB, monthB - 1, dayB).getTime();
    return timeA - timeB;
  });
}

/**
 * Calculates overall KPIs for a specific date or dataset.
 */
export function calculateKpis(records: PatwariRecord[]): OverallKpis {
  const totalVillages = records.length;
  const patwarisSet = new Set(records.map((r) => r.patwariName.trim()));
  const totalPatwaris = patwarisSet.size;

  let totalPlots = 0;
  let totalBeneficiaries = 0;
  let registryInitiated = 0;
  let patwariVerification = 0;
  let submitted = 0;
  let registrationIn = 0;
  let completed = 0;
  let activeVillages = 0;
  let zeroProgressVillages = 0;

  for (const r of records) {
    totalPlots += r.plots;
    totalBeneficiaries += r.beneficiaries;
    registryInitiated += r.registryInitiated;
    patwariVerification += r.patwariVerification;
    submitted += r.submitted;
    registrationIn += r.registrationIn;
    completed += r.completed;

    if (r.registryInitiated > 0 || r.patwariVerification > 0 || r.completed > 0) {
      activeVillages++;
    } else {
      zeroProgressVillages++;
    }
  }

  const pctCompleted = totalPlots > 0 ? Math.round((completed / totalPlots) * 10000) / 100 : 0;
  // Pending verification is work initiated but verification pending
  const pendingVerification = Math.max(0, registryInitiated - patwariVerification);

  return {
    totalVillages,
    totalPatwaris,
    totalPlots,
    totalBeneficiaries,
    registryInitiated,
    patwariVerification,
    submitted,
    registrationIn,
    completed,
    pctCompleted,
    pendingVerification,
    activeVillages,
    zeroProgressVillages,
  };
}

/**
 * Groups records by Patwari and calculates summaries including daily deltas.
 */
export function calculatePatwariSummaries(
  allRecords: PatwariRecord[],
  targetDate?: string
): PatwariSummary[] {
  const dates = getAvailableDates(allRecords);
  const effectiveDate = targetDate || (dates.length > 0 ? dates[dates.length - 1] : '');
  const targetRecords = effectiveDate ? allRecords.filter((r) => r.date === effectiveDate) : allRecords;

  // Determine previous date if available
  const targetIdx = effectiveDate ? dates.indexOf(effectiveDate) : -1;
  const prevDate = targetIdx > 0 ? dates[targetIdx - 1] : null;
  const prevRecords = prevDate ? allRecords.filter((r) => r.date === prevDate) : [];

  // Group current records by Patwari
  const patwariMap = new Map<string, PatwariRecord[]>();
  for (const rec of targetRecords) {
    const pName = rec.patwariName.trim();
    if (!patwariMap.has(pName)) {
      patwariMap.set(pName, []);
    }
    patwariMap.get(pName)!.push(rec);
  }

  // Group previous records by Patwari
  const prevPatwariMap = new Map<string, { initiated: number; verified: number; completed: number }>();
  for (const rec of prevRecords) {
    const pName = rec.patwariName.trim();
    const curr = prevPatwariMap.get(pName) || { initiated: 0, verified: 0, completed: 0 };
    curr.initiated += rec.registryInitiated;
    curr.verified += rec.patwariVerification;
    curr.completed += rec.completed;
    prevPatwariMap.set(pName, curr);
  }

  const summaries: PatwariSummary[] = [];

  patwariMap.forEach((villages, patwariName) => {
    let totalPlots = 0;
    let totalBeneficiaries = 0;
    let registryInitiated = 0;
    let patwariVerification = 0;
    let submitted = 0;
    let registrationIn = 0;
    let completed = 0;

    for (const v of villages) {
      totalPlots += v.plots;
      totalBeneficiaries += v.beneficiaries;
      registryInitiated += v.registryInitiated;
      patwariVerification += v.patwariVerification;
      submitted += v.submitted;
      registrationIn += v.registrationIn;
      completed += v.completed;
    }

    const pctCompleted = totalPlots > 0 ? Math.round((completed / totalPlots) * 10000) / 100 : 0;
    const pendingVerification = Math.max(0, registryInitiated - patwariVerification);

    // Calculate delta against previous day
    const prev = prevPatwariMap.get(patwariName) || { initiated: 0, verified: 0, completed: 0 };
    const dailyDelta: PatwariDailyDelta = {
      initiatedDelta: registryInitiated - prev.initiated,
      verificationDelta: patwariVerification - prev.verified,
      completedDelta: completed - prev.completed,
    };

    // Determine performance tier
    let performanceTier: PatwariSummary['performanceTier'] = 'critical';
    if (pctCompleted >= 5 || completed >= 5) {
      performanceTier = 'high';
    } else if (pctCompleted > 0 || completed > 0 || patwariVerification >= 3) {
      performanceTier = 'moderate';
    } else if (registryInitiated > 0) {
      performanceTier = 'lagging';
    } else {
      performanceTier = 'critical';
    }

    summaries.push({
      patwariName,
      villagesCount: villages.length,
      totalPlots,
      totalBeneficiaries,
      registryInitiated,
      patwariVerification,
      submitted,
      registrationIn,
      completed,
      pctCompleted,
      pendingVerification,
      dailyDelta,
      performanceTier,
      villages,
    });
  });

  // Sort by Completed desc, then by % Completed desc, then by Verification desc
  return summaries.sort((a, b) => {
    if (b.completed !== a.completed) return b.completed - a.completed;
    if (b.pctCompleted !== a.pctCompleted) return b.pctCompleted - a.pctCompleted;
    if (b.patwariVerification !== a.patwariVerification) return b.patwariVerification - a.patwariVerification;
    return b.registryInitiated - a.registryInitiated;
  });
}

/**
 * Calculates Period Comparison (Day / Week / Month).
 */
export function calculatePeriodComparison(
  allRecords: PatwariRecord[],
  period: 'day' | 'week' | 'month',
  selectedDate: string
): PeriodComparison {
  const dates = getAvailableDates(allRecords);
  const currentDate = selectedDate || (dates.length > 0 ? dates[dates.length - 1] : '12-10-2026');
  const targetIdx = dates.indexOf(currentDate);
  const previousDate = targetIdx > 0 ? dates[targetIdx - 1] : currentDate;

  const currentRecords = allRecords.filter((r) => r.date === currentDate);
  const prevRecords = allRecords.filter((r) => r.date === previousDate);

  const curKpis = calculateKpis(currentRecords);
  const prevKpis = calculateKpis(prevRecords);

  // Multipliers or scaling for week/month context
  let multiplier = 1;
  if (period === 'week') multiplier = 7;
  if (period === 'month') multiplier = 30;

  const deltaInitiated = curKpis.registryInitiated - prevKpis.registryInitiated;
  const deltaVerified = curKpis.patwariVerification - prevKpis.patwariVerification;
  const deltaCompleted = curKpis.completed - prevKpis.completed;
  const pctDeltaCompleted = Math.round((curKpis.pctCompleted - prevKpis.pctCompleted) * 100) / 100;

  // Count active vs inactive patwaris on this date
  const summaries = calculatePatwariSummaries(allRecords, currentDate);
  const activePatwarisCount = summaries.filter(
    (p) => p.completed > 0 || p.patwariVerification > 0 || p.registryInitiated > 0
  ).length;
  const inactivePatwarisCount = summaries.length - activePatwarisCount;

  return {
    period,
    currentDate,
    previousDate,
    currentPlots: curKpis.totalPlots,
    currentInitiated: curKpis.registryInitiated * (period === 'day' ? 1 : 1),
    currentVerified: curKpis.patwariVerification,
    currentCompleted: curKpis.completed,
    previousInitiated: prevKpis.registryInitiated,
    previousVerified: prevKpis.patwariVerification,
    previousCompleted: prevKpis.completed,
    deltaInitiated: period === 'day' ? deltaInitiated : deltaInitiated * multiplier,
    deltaVerified: period === 'day' ? deltaVerified : deltaVerified * multiplier,
    deltaCompleted: period === 'day' ? deltaCompleted : deltaCompleted * multiplier,
    pctDeltaCompleted,
    activePatwarisCount,
    inactivePatwarisCount,
  };
}

/**
 * Formats a Google Sheet URL to an exported CSV URL.
 */
export function formatGoogleSheetCsvUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // If already a direct CSV URL
  if (trimmed.includes('output=csv') || trimmed.endsWith('.csv')) {
    return trimmed;
  }

  // Standard sheet URL: https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID}
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check for gid
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '&gid=0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  }

  return trimmed;
}

/**
  * Filters records with multi-selection for Patwaris, Dates, Statuses, and Search Term.
  */
export function filterRecordsMulti(
  records: PatwariRecord[],
  options: MultiFilterOptions
): PatwariRecord[] {
  const { patwaris, dates, statusFilter = 'all', searchTerm = '' } = options;
  const term = searchTerm.trim().toLowerCase();

  return records.filter((r) => {
    // Patwari multi-filter
    if (patwaris && patwaris.length > 0 && !patwaris.includes('all')) {
      if (!patwaris.includes(r.patwariName.trim())) {
        return false;
      }
    }

    // Dates multi-filter
    if (dates && dates.length > 0 && !dates.includes('all')) {
      if (!dates.includes(r.date)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter === 'zero') {
      if (r.registryInitiated !== 0 || r.patwariVerification !== 0 || r.completed !== 0) {
        return false;
      }
    } else if (statusFilter === 'active') {
      if (r.registryInitiated === 0 && r.patwariVerification === 0 && r.completed === 0) {
        return false;
      }
    } else if (statusFilter === 'completed') {
      if (r.completed <= 0) {
        return false;
      }
    }

    // Search term (village, lgdCode, patwari)
    if (term) {
      const match =
        r.village.toLowerCase().includes(term) ||
        r.lgdCode.toLowerCase().includes(term) ||
        r.patwariName.toLowerCase().includes(term);
      if (!match) return false;
    }

    return true;
  });
}

/**
  * Groups a list of Patwari records by Patwari Name and computes group summaries.
  */
export function groupRecordsByPatwari(records: PatwariRecord[]): PatwariGroup[] {
  const map = new Map<string, PatwariRecord[]>();

  for (const r of records) {
    const name = r.patwariName.trim();
    if (!map.has(name)) {
      map.set(name, []);
    }
    map.get(name)!.push(r);
  }

  const groups: PatwariGroup[] = [];

  map.forEach((villages, patwariName) => {
    let totalPlots = 0;
    let totalBeneficiaries = 0;
    let registryInitiated = 0;
    let patwariVerification = 0;
    let submitted = 0;
    let registrationIn = 0;
    let completed = 0;

    for (const v of villages) {
      totalPlots += v.plots;
      totalBeneficiaries += v.beneficiaries;
      registryInitiated += v.registryInitiated;
      patwariVerification += v.patwariVerification;
      submitted += v.submitted;
      registrationIn += v.registrationIn;
      completed += v.completed;
    }

    const pctCompleted =
      totalPlots > 0 ? Math.round((completed / totalPlots) * 10000) / 100 : 0;
    const pendingVerification = Math.max(0, registryInitiated - patwariVerification);

    groups.push({
      patwariName,
      villagesCount: villages.length,
      totalPlots,
      totalBeneficiaries,
      registryInitiated,
      patwariVerification,
      submitted,
      registrationIn,
      completed,
      pctCompleted,
      pendingVerification,
      villages: villages.sort((a, b) => b.plots - a.plots),
    });
  });

  return groups.sort((a, b) => {
    if (b.completed !== a.completed) return b.completed - a.completed;
    if (b.pctCompleted !== a.pctCompleted) return b.pctCompleted - a.pctCompleted;
    return a.patwariName.localeCompare(b.patwariName);
  });
}

/**
  * Computes Patwari-wise & Date-wise Cross Matrix for easy monitoring across dates.
  */
export function calculatePatwariDateMatrix(
  allRecords: PatwariRecord[],
  selectedPatwaris?: string[],
  selectedDates?: string[]
): PatwariDateMatrixRow[] {
  const allDates = getAvailableDates(allRecords);
  const dates =
    selectedDates && selectedDates.length > 0 && !selectedDates.includes('all')
      ? selectedDates
      : allDates;

  // Filter patwaris if requested
  const allPatwariNames = Array.from(new Set(allRecords.map((r) => r.patwariName.trim())));
  const patwariNames =
    selectedPatwaris && selectedPatwaris.length > 0 && !selectedPatwaris.includes('all')
      ? allPatwariNames.filter((p) => selectedPatwaris.includes(p))
      : allPatwariNames;

  const matrixRows: PatwariDateMatrixRow[] = [];

  for (const pName of patwariNames) {
    const pRecords = allRecords.filter((r) => r.patwariName.trim() === pName);
    const dateMetrics: Record<string, PatwariDateMetric> = {};

    let totalPlots = 0;
    let villagesSet = new Set<string>();

    for (const d of dates) {
      const recordsOnDate = pRecords.filter((r) => r.date === d);
      let plots = 0;
      let initiated = 0;
      let verified = 0;
      let completed = 0;

      for (const r of recordsOnDate) {
        plots += r.plots;
        initiated += r.registryInitiated;
        verified += r.patwariVerification;
        completed += r.completed;
        villagesSet.add(r.lgdCode || r.village);
      }

      if (plots > totalPlots) totalPlots = plots;

      const pctCompleted =
        plots > 0 ? Math.round((completed / plots) * 10000) / 100 : 0;
      const pendingVerification = Math.max(0, initiated - verified);

      dateMetrics[d] = {
        date: d,
        plots,
        initiated,
        verified,
        completed,
        pctCompleted,
        pendingVerification,
      };
    }

    // Delta between latest selected date and previous selected date
    let initiatedDelta = 0;
    let verificationDelta = 0;
    let completedDelta = 0;

    if (dates.length >= 2) {
      const latestDate = dates[dates.length - 1];
      const prevDate = dates[dates.length - 2];
      const latest = dateMetrics[latestDate];
      const prev = dateMetrics[prevDate];
      if (latest && prev) {
        initiatedDelta = latest.initiated - prev.initiated;
        verificationDelta = latest.verified - prev.verified;
        completedDelta = latest.completed - prev.completed;
      }
    }

    matrixRows.push({
      patwariName: pName,
      villagesCount: villagesSet.size,
      totalPlots,
      dateMetrics,
      delta: {
        initiatedDelta,
        verificationDelta,
        completedDelta,
      },
    });
  }

  // Sort by completed in latest date or total completed
  const latestDate = dates.length > 0 ? dates[dates.length - 1] : '';
  return matrixRows.sort((a, b) => {
    const aLatestComp = latestDate && a.dateMetrics[latestDate] ? a.dateMetrics[latestDate].completed : 0;
    const bLatestComp = latestDate && b.dateMetrics[latestDate] ? b.dateMetrics[latestDate].completed : 0;
    if (bLatestComp !== aLatestComp) return bLatestComp - aLatestComp;
    return a.patwariName.localeCompare(b.patwariName);
  });
}

export interface DateTrendPoint {
  date: string;
  totalPlots: number;
  registryInitiated: number;
  patwariVerification: number;
  completed: number;
  pctCompleted: number;
  pendingVerification: number;
  deltaInitiated: number;
  deltaVerified: number;
  deltaCompleted: number;
}

/**
 * Computes chronological date-by-date totals and deltas for trend line charts.
 */
export function calculateDateTrends(allRecords: PatwariRecord[]): DateTrendPoint[] {
  const dates = getAvailableDates(allRecords);
  const trendPoints: DateTrendPoint[] = [];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const recsOnDate = allRecords.filter((r) => r.date === date);

    let totalPlots = 0;
    let registryInitiated = 0;
    let patwariVerification = 0;
    let completed = 0;

    for (const r of recsOnDate) {
      totalPlots += r.plots;
      registryInitiated += r.registryInitiated;
      patwariVerification += r.patwariVerification;
      completed += r.completed;
    }

    const pctCompleted = totalPlots > 0 ? Math.round((completed / totalPlots) * 10000) / 100 : 0;
    const pendingVerification = Math.max(0, registryInitiated - patwariVerification);

    let deltaInitiated = 0;
    let deltaVerified = 0;
    let deltaCompleted = 0;

    if (i > 0 && trendPoints.length > 0) {
      const prev = trendPoints[i - 1];
      deltaInitiated = registryInitiated - prev.registryInitiated;
      deltaVerified = patwariVerification - prev.patwariVerification;
      deltaCompleted = completed - prev.completed;
    }

    trendPoints.push({
      date,
      totalPlots,
      registryInitiated,
      patwariVerification,
      completed,
      pctCompleted,
      pendingVerification,
      deltaInitiated,
      deltaVerified,
      deltaCompleted,
    });
  }

  return trendPoints;
}

export interface StatusSlice {
  id: string;
  label: string;
  labelHi: string;
  count: number;
  percentage: number;
  gradientId: string;
  colorFrom: string;
  colorTo: string;
  badgeBg: string;
}

/**
 * Computes status slices for pie and donut charts from overall KPIs.
 * Accurately accounts for Completed, Submitted/In-Process, Verified, and Pending Verification from Google Sheet.
 */
export function calculateStatusSlices(
  kpis: OverallKpis,
  mode: 'pipeline' | 'target' = 'pipeline'
): StatusSlice[] {
  const initiatedTotal = kpis.registryInitiated || 1;
  const targetTotal = kpis.totalPlots || 1;

  const completed = kpis.completed;
  const submittedAndInProcess = (kpis.submitted || 0) + (kpis.registrationIn || 0);
  const verifiedOnly = Math.max(0, kpis.patwariVerification - completed - submittedAndInProcess);
  const pendingVerification = Math.max(0, kpis.registryInitiated - kpis.patwariVerification);

  if (mode === 'pipeline') {
    // Exact initiated workload pipeline breakdown (sum = kpis.registryInitiated)
    return [
      {
        id: 'completed',
        label: 'Final Completed',
        labelHi: 'पूर्ण पंजीयन (अभिलेख वितरित)',
        count: completed,
        percentage: Math.round((completed / initiatedTotal) * 10000) / 100,
        gradientId: 'gradCompleted',
        colorFrom: '#10b981',
        colorTo: '#059669',
        badgeBg: 'bg-emerald-500',
      },
      {
        id: 'submitted',
        label: 'Submitted / In-Process',
        labelHi: 'प्रस्तुत एवं पंजीयन प्रक्रियाधीन',
        count: submittedAndInProcess,
        percentage: Math.round((submittedAndInProcess / initiatedTotal) * 10000) / 100,
        gradientId: 'gradSubmitted',
        colorFrom: '#06b6d4',
        colorTo: '#2563eb',
        badgeBg: 'bg-cyan-500',
      },
      {
        id: 'verified',
        label: 'Verified Pipeline',
        labelHi: 'पटवारी सत्यापन पूर्ण (अग्रिम चरण)',
        count: verifiedOnly,
        percentage: Math.round((verifiedOnly / initiatedTotal) * 10000) / 100,
        gradientId: 'gradVerified',
        colorFrom: '#8b5cf6',
        colorTo: '#6366f1',
        badgeBg: 'bg-indigo-500',
      },
      {
        id: 'pending_verification',
        label: 'Pending Verification',
        labelHi: 'पटवारी सत्यापन स्तर पर लंबित (बॉटलनेक)',
        count: pendingVerification,
        percentage: Math.round((pendingVerification / initiatedTotal) * 10000) / 100,
        gradientId: 'gradInitiated',
        colorFrom: '#f59e0b',
        colorTo: '#ea580c',
        badgeBg: 'bg-amber-500',
      },
    ];
  }

  // mode === 'target' (Overall circle target breakdown of all plots)
  const notInitiated = Math.max(0, targetTotal - kpis.registryInitiated);
  return [
    {
      id: 'completed',
      label: 'Final Completed',
      labelHi: 'पूर्ण पंजीयन',
      count: completed,
      percentage: Math.round((completed / targetTotal) * 10000) / 100,
      gradientId: 'gradCompleted',
      colorFrom: '#10b981',
      colorTo: '#059669',
      badgeBg: 'bg-emerald-500',
    },
    {
      id: 'submitted',
      label: 'Submitted / In-Process',
      labelHi: 'प्रस्तुत व प्रक्रियाधीन',
      count: submittedAndInProcess,
      percentage: Math.round((submittedAndInProcess / targetTotal) * 10000) / 100,
      gradientId: 'gradSubmitted',
      colorFrom: '#06b6d4',
      colorTo: '#2563eb',
      badgeBg: 'bg-cyan-500',
    },
    {
      id: 'verified',
      label: 'Verified',
      labelHi: 'पटवारी सत्यापित',
      count: verifiedOnly,
      percentage: Math.round((verifiedOnly / targetTotal) * 10000) / 100,
      gradientId: 'gradVerified',
      colorFrom: '#8b5cf6',
      colorTo: '#6366f1',
      badgeBg: 'bg-indigo-500',
    },
    {
      id: 'pending_verification',
      label: 'Pending Verification',
      labelHi: 'सत्यापन लंबित (बॉटलनेक)',
      count: pendingVerification,
      percentage: Math.round((pendingVerification / targetTotal) * 10000) / 100,
      gradientId: 'gradInitiated',
      colorFrom: '#f59e0b',
      colorTo: '#ea580c',
      badgeBg: 'bg-amber-500',
    },
    {
      id: 'remaining',
      label: 'Pending Initiation',
      labelHi: 'पंजीयन प्रारंभ शेष भूखंड',
      count: notInitiated,
      percentage: Math.round((notInitiated / targetTotal) * 10000) / 100,
      gradientId: 'gradRemaining',
      colorFrom: '#38bdf8',
      colorTo: '#2563eb',
      badgeBg: 'bg-sky-500',
    },
  ];
}
