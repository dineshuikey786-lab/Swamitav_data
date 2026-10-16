import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCSVDataset,
  calculateKpis,
  calculatePatwariSummaries,
  calculatePatwariDateMatrix,
} from './patwariAnalytics.ts';
import {
  buildTehsilSummarySheetData,
  buildPatwariPerformanceSheetData,
  buildVillageRegisterSheetData,
  buildDateMatrixSheetData,
} from './exportUtils.ts';

const SAMPLE_CSV = `S.No,Village ▲,LGD Code,Patwari Name,Plots,Beneficiaries,Registry_Initiated,Patwari_Verification,Submitted,Registration in,Completed,% Completed,Date
1,अन्होनी,493692,Ruchin Arjariya,89,169,11,3,0,0,0,0,11-10-2026
7,कठोतिया,493826,Sushma Indorker,41,67,0,0,0,0,5,0.122,11-10-2026
161,अन्होनी,493692,Ruchin Arjariya,89,169,10,4,0,0,0,0,12-10-2026
167,कठोतिया,493826,Sushma Indorker,41,67,0,0,0,0,5,0.122,12-10-2026
181,खडुआ,493790,Lokendra Narganwa,11,20,2,4,0,0,1,0.0909,12-10-2026
`;

test('buildTehsilSummarySheetData formats official tehsil metrics correctly', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const records12 = records.filter((r) => r.date === '12-10-2026');
  const kpis = calculateKpis(records12);
  const summaries = calculatePatwariSummaries(records12);

  const rows = buildTehsilSummarySheetData({
    kpis,
    summaries,
    records: records12,
    selectedDate: '12-10-2026',
    selectedPeriod: 'day',
  });

  assert.ok(rows.length > 10);
  assert.equal(rows[0][0], 'मध्य प्रदेश शासन - राजस्व विभाग (Government of Madhya Pradesh - Revenue Department)');
  // Check total plots
  const plotRow = rows.find((r) => r[0] === 'कुल लक्षित भूखंड (Total Target Plots)');
  assert.ok(plotRow);
  assert.equal(plotRow[1], 141);
});

test('buildPatwariPerformanceSheetData generates ranking rows', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const records12 = records.filter((r) => r.date === '12-10-2026');
  const summaries = calculatePatwariSummaries(records12);

  const rows = buildPatwariPerformanceSheetData(summaries);
  assert.ok(rows.length >= 4); // title + empty + header + data rows
  const header = rows[2];
  assert.equal(header[1], 'पटवारी का नाम (Patwari Name)');
  assert.equal(header[10], 'पूर्ण पंजीयन (Completed)');
});

test('buildVillageRegisterSheetData generates formatted village inventory', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const records12 = records.filter((r) => r.date === '12-10-2026');

  const rows = buildVillageRegisterSheetData(records12);
  assert.ok(rows.length >= 5);
  const dataRow1 = rows[3];
  assert.equal(dataRow1[1], 'अन्होनी');
  assert.equal(dataRow1[2], '493692');
});

test('buildDateMatrixSheetData generates multi-date comparison rows', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const matrix = calculatePatwariDateMatrix(records, ['Ruchin Arjariya', 'Sushma Indorker'], ['11-10-2026', '12-10-2026']);

  const rows = buildDateMatrixSheetData(matrix, ['11-10-2026', '12-10-2026']);
  assert.ok(rows.length >= 4);
  const header = rows[2];
  assert.ok(header.includes('11-10-2026 (पूर्ण)'));
  assert.ok(header.includes('12-10-2026 (पूर्ण)'));
});
