import * as XLSX from 'xlsx';
import type { jsPDF } from 'jspdf';
import type { OverallKpis, PatwariSummary, PatwariRecord, PatwariDateMatrixRow } from './patwariAnalytics.ts';

export interface ExportDataOptions {
  kpis: OverallKpis;
  summaries: PatwariSummary[];
  records: PatwariRecord[];
  matrixRows?: PatwariDateMatrixRow[];
  dates?: string[];
  selectedDate: string;
  selectedPeriod?: 'day' | 'week' | 'month';
  tehsilName?: string;
  districtName?: string;
}

/**
 * Builds table rows for the Executive Tehsil Summary sheet
 */
export function buildTehsilSummarySheetData(options: ExportDataOptions): (string | number)[][] {
  const { kpis, selectedDate, selectedPeriod = 'day', tehsilName = 'तामिया', districtName = 'छिंदवाड़ा (म.प्र.)' } = options;

  const periodLabel =
    selectedPeriod === 'day'
      ? 'दैनिक प्रगति प्रतिवेदन (Daily Progress Report)'
      : selectedPeriod === 'week'
      ? 'साप्ताहिक समीक्षा (Weekly Progress Review)'
      : 'मासिक प्रगति समीक्षा (Monthly Progress Review)';

  return [
    ['मध्य प्रदेश शासन - राजस्व विभाग (Government of Madhya Pradesh - Revenue Department)'],
    [`कार्यालय अनुविभागीय अधिकारी (राजस्व) / तहसीलदार - वृत्त: ${tehsilName}, जिला: ${districtName}`],
    ['स्वामित्व योजना / आबादी भूमि अधिकार अभिलेख एवं पंजीयन निगरानी डैशबोर्ड'],
    [`प्रतिवेदन प्रारूप: ${periodLabel}`, `समीक्षा दिनांक: ${selectedDate}`, `रिपोर्ट जनरेशन: ${new Date().toLocaleString('hi-IN')}`],
    [],
    ['1. वृत्त स्तरीय प्रमुख प्रगति सूचकांक (TEHSIL EXECUTIVE KPIS & SUMMARY)'],
    ['प्रमुख सूचक (Metric Parameter)', 'मूल्य (Count / Value)', 'इकाई / विवरण (Unit / Description)'],
    ['कुल आबादी ग्राम (Total Abadi Villages)', kpis.totalVillages, 'ग्राम संख्या'],
    ['सक्रिय हल्का पटवारी (Total Patwaris)', kpis.totalPatwaris, 'पटवारी'],
    ['कुल लक्षित भूखंड (Total Target Plots)', kpis.totalPlots, 'भूखंड'],
    ['कुल दर्ज हितग्राही (Total Beneficiaries)', kpis.totalBeneficiaries, 'हितग्राही'],
    ['पंजीयन प्रारंभ (Registry Initiated)', kpis.registryInitiated, 'आवेदन'],
    ['पटवारी सत्यापन पूर्ण (Patwari Verified)', kpis.patwariVerification, 'सत्यापित आवेदन'],
    ['पटवारी स्तर पर लंबित सत्यापन (Pending Patwari Verification)', kpis.pendingVerification, 'जांच हेतु शेष'],
    ['अग्रसारित / प्रस्तुत (Submitted)', kpis.submitted, 'आवेदन'],
    ['पंजीयन प्रक्रियाधीन (Registration In-Process)', kpis.registrationIn, 'आवेदन'],
    ['अंतिम पूर्ण पंजीयन (Completed Registrations)', kpis.completed, 'पूर्ण भूखंड'],
    ['समग्र पूर्णता दर (Overall Completion Rate %)', `${kpis.pctCompleted}%`, 'प्रतिशत'],
    ['प्रगतिशील ग्राम संख्या (Active Villages > 0)', kpis.activeVillages, 'ग्राम'],
    ['शून्य प्रगति ग्राम संख्या (Zero Progress Villages)', kpis.zeroProgressVillages, 'ग्राम'],
    [],
    ['2. प्रशासनिक टिप्पणी एवं समीक्षा टीप (ADMINISTRATIVE BOTTLENECK AUDIT)'],
    [
      `कुल ${kpis.registryInitiated} प्रारंभ किए गए आवेदनों में से ${kpis.patwariVerification} का पटवारी सत्यापन पूर्ण हो चुका है। वर्तमान में ${kpis.pendingVerification} आवेदन पटवारी स्तर पर सत्यापन हेतु लंबित हैं। तत्काल निराकरण अपेक्षित है।`
    ],
  ];
}

/**
 * Builds table rows for the Patwari Performance sheet
 */
export function buildPatwariPerformanceSheetData(summaries: PatwariSummary[]): (string | number)[][] {
  const header = [
    'क्र. (Rank)',
    'पटवारी का नाम (Patwari Name)',
    'हल्का ग्राम संख्या (Villages)',
    'कुल भूखंड (Total Plots)',
    'हितग्राही (Beneficiaries)',
    'पंजीयन प्रारंभ (Initiated)',
    'सत्यापित (Verified)',
    'लंबित सत्यापन (Pending Verification)',
    'अग्रसारित (Submitted)',
    'प्रक्रियाधीन (Registration In)',
    'पूर्ण पंजीयन (Completed)',
    'पूर्णता दर (% Completed)',
    'दैनिक वृद्धि (Completed Delta)',
    'प्रदर्शन श्रेणी (Performance Tier)'
  ];

  const rows = summaries.map((s, idx) => {
    const tierHindi =
      s.performanceTier === 'high'
        ? 'उत्कृष्ट (High Performer)'
        : s.performanceTier === 'moderate'
        ? 'संतोषजनक (Moderate)'
        : s.performanceTier === 'lagging'
        ? 'प्रगति धीमी (Lagging)'
        : 'गंभीर / समीक्षा योग्य (Critical)';

    return [
      idx + 1,
      s.patwariName,
      s.villagesCount,
      s.totalPlots,
      s.totalBeneficiaries,
      s.registryInitiated,
      s.patwariVerification,
      s.pendingVerification,
      s.submitted,
      s.registrationIn,
      s.completed,
      s.pctCompleted,
      s.dailyDelta.completedDelta >= 0 ? `+${s.dailyDelta.completedDelta}` : `${s.dailyDelta.completedDelta}`,
      tierHindi
    ];
  });

  return [
    ['मध्य प्रदेश शासन - राजस्व विभाग • पटवारी-वार कार्य प्रगति एवं रैंकिंग विवरण'],
    [],
    header,
    ...rows
  ];
}

/**
 * Builds table rows for the Village Master Register sheet
 */
export function buildVillageRegisterSheetData(records: PatwariRecord[]): (string | number)[][] {
  const header = [
    'सरल क्र. (S.No)',
    'ग्राम का नाम (Village Name)',
    'LGD कोड (LGD Code)',
    'हल्का पटवारी (Patwari Name)',
    'दिनांक (Date)',
    'कुल भूखंड (Plots)',
    'हितग्राही (Beneficiaries)',
    'पंजीयन प्रारंभ (Initiated)',
    'पटवारी सत्यापन (Verified)',
    'लंबित सत्यापन (Pending)',
    'अग्रसारित (Submitted)',
    'प्रक्रियाधीन (In Process)',
    'पूर्ण पंजीयन (Completed)',
    'पूर्णता दर (% Completed)',
    'प्रगति स्थिति (Status)'
  ];

  const rows = records.map((r, idx) => {
    const pending = Math.max(0, r.registryInitiated - r.patwariVerification);
    const status =
      r.completed > 0 && r.pctCompleted >= 50
        ? 'तीव्र प्रगति (High)'
        : r.completed > 0
        ? 'प्रगतिशील (Active)'
        : r.registryInitiated > 0
        ? 'प्रारंभिक स्तर (Initiated)'
        : 'शून्य प्रगति (Zero Progress)';

    return [
      idx + 1,
      r.village,
      r.lgdCode,
      r.patwariName,
      r.date,
      r.plots,
      r.beneficiaries,
      r.registryInitiated,
      r.patwariVerification,
      pending,
      r.submitted,
      r.registrationIn,
      r.completed,
      r.pctCompleted,
      status
    ];
  });

  return [
    ['मध्य प्रदेश शासन - राजस्व विभाग • ग्राम-वार विस्तृत राजस्व अभिलेख रजिस्टर (Village Register)'],
    [],
    header,
    ...rows
  ];
}

/**
 * Builds table rows for the Date-wise Matrix sheet
 */
export function buildDateMatrixSheetData(
  matrixRows: PatwariDateMatrixRow[] = [],
  dates: string[] = []
): (string | number)[][] {
  const header: (string | number)[] = [
    'क्र. (S.No)',
    'पटवारी का नाम (Patwari Name)',
    'ग्राम संख्या (Villages)',
    'कुल भूखंड (Total Plots)',
  ];

  dates.forEach((d) => {
    header.push(`${d} (पूर्ण)`, `${d} (%)`);
  });

  header.push('नवीनतम पूर्ण (Latest Completed)', 'नवीनतम प्रगति (% Latest)', 'दैनिक अंतर (Delta)');

  const rows = matrixRows.map((r, idx) => {
    const row: (string | number)[] = [
      idx + 1,
      r.patwariName,
      r.villagesCount,
      r.totalPlots,
    ];

    dates.forEach((d) => {
      const dm = r.dateMetrics[d];
      if (dm) {
        row.push(dm.completed, `${dm.pctCompleted}%`);
      } else {
        row.push(0, '0%');
      }
    });

    const latestDate = dates.length > 0 ? dates[dates.length - 1] : '';
    const latestDm = latestDate ? r.dateMetrics[latestDate] : null;
    const completedVal = latestDm ? latestDm.completed : 0;
    const pctVal = latestDm ? `${latestDm.pctCompleted}%` : '0%';
    const deltaVal = r.delta.completedDelta >= 0 ? `+${r.delta.completedDelta}` : `${r.delta.completedDelta}`;

    row.push(completedVal, pctVal, deltaVal);
    return row;
  });

  return [
    ['मध्य प्रदेश शासन - राजस्व विभाग • दिनांक-वार पटवारी कार्य प्रगति तुलना मैट्रिक्स (Date Matrix)'],
    [],
    header,
    ...rows
  ];
}

/**
 * Exports the complete administrative report to a multi-sheet Microsoft Excel (.xlsx) file
 */
export function exportDashboardToExcel(options: ExportDataOptions): void {
  const wb = XLSX.utils.book_new();

  // 1. Tehsil Summary Sheet
  const summaryAoa = buildTehsilSummarySheetData(options);
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'वृत्त प्रगति सारांश (Summary)');

  // 2. Patwari Performance Sheet
  const patwariAoa = buildPatwariPerformanceSheetData(options.summaries);
  const wsPatwari = XLSX.utils.aoa_to_sheet(patwariAoa);
  wsPatwari['!cols'] = [
    { wch: 10 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPatwari, 'पटवारी रैंकिंग (Patwaris)');

  // 3. Date Matrix Sheet (if provided)
  if (options.matrixRows && options.dates && options.dates.length > 0) {
    const matrixAoa = buildDateMatrixSheetData(options.matrixRows, options.dates);
    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixAoa);
    wsMatrix['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'दिनांकवार मैट्रिक्स (Matrix)');
  }

  // 4. Village Register Sheet
  const villageAoa = buildVillageRegisterSheetData(options.records);
  const wsVillages = XLSX.utils.aoa_to_sheet(villageAoa);
  wsVillages['!cols'] = [
    { wch: 8 },
    { wch: 22 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVillages, 'ग्राम रजिस्टर (Villages)');

  const cleanDate = options.selectedDate.replace(/[^a-zA-Z0-9-]/g, '_');
  const fileName = `Patwari_Progress_Report_Tamia_${cleanDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export type PdfReportMode = 'cards' | 'charts' | 'full';

export interface PdfReportMetadata {
  mode: PdfReportMode;
  fileName: string;
  titleHindi: string;
  titleEnglish: string;
  subtitle: string;
  summaryLine: string;
}

/**
 * Generates standardized metadata and filenames for separate Card Data PDF, Charts PDF, and Full Administrative PDF
 */
export function buildPdfReportMetadata(
  mode: PdfReportMode,
  selectedDate: string,
  kpis: OverallKpis
): PdfReportMetadata {
  const cleanDate = (selectedDate || 'latest').replace(/[^a-zA-Z0-9-]/g, '_');

  if (mode === 'cards') {
    return {
      mode: 'cards',
      fileName: `Tamia_Dashboard_Card_Data_${cleanDate}.pdf`,
      titleHindi: 'डैशबोर्ड प्रमुख सूचकांक एवं कार्ड डेटा प्रतिवेदन',
      titleEnglish: 'Dashboard KPI Cards & Workflow Pipeline Summary Report',
      subtitle: `वृत्त: तामिया • जिला: छिंदवाड़ा (म.प्र.) • समीक्षा दिनांक: ${selectedDate}`,
      summaryLine: `कुल ग्राम: ${kpis.totalVillages} | कुल भूखंड: ${kpis.totalPlots} | प्रारंभ: ${kpis.registryInitiated} | सत्यापित: ${kpis.patwariVerification} | पूर्ण: ${kpis.completed} (${kpis.pctCompleted}%)`,
    };
  }

  if (mode === 'charts') {
    return {
      mode: 'charts',
      fileName: `Tamia_Dashboard_Charts_Analytics_${cleanDate}.pdf`,
      titleHindi: 'डैशबोर्ड विजुअल चार्ट्स एवं ग्राफिकल विश्लेषण प्रतिवेदन',
      titleEnglish: 'Dashboard Visual Charts & Graphical Analytics Report (Bar, Pie, Trend & Donut)',
      subtitle: `वृत्त: तामिया • जिला: छिंदवाड़ा (म.प्र.) • समीक्षा दिनांक: ${selectedDate}`,
      summaryLine: `बार चार्ट • पाई चार्ट • दिनांकवार ट्रेंड लाइन • लक्ष्य डोनट मीटर • कुल पूर्ण: ${kpis.completed} (${kpis.pctCompleted}%)`,
    };
  }

  return {
    mode: 'full',
    fileName: `Tamia_Patwari_Administrative_Report_${cleanDate}.pdf`,
    titleHindi: 'संपूर्ण शासकीय पटवारी प्रगति एवं राजस्व प्रतिवेदन',
    titleEnglish: 'Complete Official Administrative Patwari Progress Report',
    subtitle: `वृत्त: तामिया • जिला: छिंदवाड़ा (म.प्र.) • समीक्षा दिनांक: ${selectedDate}`,
    summaryLine: `कुल ग्राम: ${kpis.totalVillages} | सक्रिय पटवारी: ${kpis.totalPatwaris} | पूर्ण पंजीयन: ${kpis.completed} (${kpis.pctCompleted}%)`,
  };
}

export interface DownloadPdfOptions {
  orientation?: 'portrait' | 'landscape';
  backgroundColor?: string;
}

/**
 * Downloads a DOM element as a high-quality formatted PDF report.
 * Automatically hides elements with [data-pdf-ignore="true"] and temporarily reveals
 * elements with [data-pdf-show="true"] during capture.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  fileName: string,
  onProgress?: (status: string) => void,
  options?: DownloadPdfOptions
): Promise<void> {
  onProgress?.('पीडीएफ तैयार हो रहा है (Rendering PDF)...');

  const { toPng } = await import('html-to-image');
  const { jsPDF } = await import('jspdf');

  // Temporarily reveal any print/PDF-only header/table blocks inside the target element
  const pdfOnlyNodes = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-show="true"]'));
  const previousDisplays = pdfOnlyNodes.map((node) => node.style.display);
  pdfOnlyNodes.forEach((node) => {
    node.style.display = 'block';
  });

  let imgData: string;
  try {
    imgData = await toPng(element, {
      quality: 0.96,
      pixelRatio: 2,
      backgroundColor: options?.backgroundColor || '#ffffff',
      fontEmbedCSS: '',
      skipFonts: true,
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.dataset?.pdfIgnore === 'true') {
          return false;
        }
        return true;
      },
    });
  } catch (canvasErr) {
    pdfOnlyNodes.forEach((node, idx) => {
      node.style.display = previousDisplays[idx];
    });
    console.warn('Canvas capture fallback to print:', canvasErr);
    window.print();
    onProgress?.('प्रिंटर / PDF विंडो खोली गई');
    return;
  } finally {
    pdfOnlyNodes.forEach((node, idx) => {
      node.style.display = previousDisplays[idx];
    });
  }

  onProgress?.('पेज फॉर्मेटिंग एवं सेव हो रहा है...');

  const img = new Image();
  img.src = imgData;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const pdf = new jsPDF({
    orientation: options?.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 8; // 8mm margins

  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (img.height * contentWidth) / img.width;

  let heightLeft = contentHeight;
  let position = margin;

  // First page
  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
  heightLeft -= pdfHeight - margin * 2;

  // Multiple pages if document exceeds single page
  while (heightLeft > 0) {
    position = heightLeft - contentHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= pdfHeight - margin * 2;
  }

  pdf.save(fileName);
  onProgress?.('डाउनलोड संपन्न (Download Complete)!');
}

