import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCSVDataset,
  getAvailableDates,
  calculateKpis,
  calculatePatwariSummaries,
  calculatePeriodComparison,
  formatGoogleSheetCsvUrl,
  groupRecordsByPatwari,
  filterRecordsMulti,
  calculatePatwariDateMatrix,
  calculateDateTrends,
  calculateStatusSlices,
} from './patwariAnalytics.ts';

const SAMPLE_CSV = `S.No,Village ▲,LGD Code,Patwari Name,Plots,Beneficiaries,Registry_Initiated,Patwari_Verification,Submitted,Registration in,Completed,% Completed,Date
1,अन्होनी,493692,Ruchin Arjariya,89,169,11,3,0,0,0,0,11-10-2026
7,कठोतिया,493826,Sushma Indorker,41,67,0,0,0,0,5,0.122,11-10-2026
161,अन्होनी,493692,Ruchin Arjariya,89,169,10,4,0,0,0,0,12-10-2026
167,कठोतिया,493826,Sushma Indorker,41,67,0,0,0,0,5,0.122,12-10-2026
181,खडुआ,493790,Lokendra Narganwa,11,20,2,4,0,0,1,0.0909,12-10-2026
`;

test('parseCSVDataset correctly parses records and normalizes percentages', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  assert.equal(records.length, 5);

  const kathotiya = records.find((r) => r.village === 'कठोतिया' && r.date === '11-10-2026');
  assert.ok(kathotiya);
  assert.equal(kathotiya.patwariName, 'Sushma Indorker');
  assert.equal(kathotiya.completed, 5);
  // 0.122 normalized to 12.2%
  assert.equal(kathotiya.pctCompleted, 12.2);

  const dates = getAvailableDates(records);
  assert.deepEqual(dates, ['11-10-2026', '12-10-2026']);
});

test('calculateKpis calculates overall metrics accurately', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const oct12Records = records.filter((r) => r.date === '12-10-2026');
  const kpis = calculateKpis(oct12Records);

  assert.equal(kpis.totalVillages, 3);
  assert.equal(kpis.totalPlots, 89 + 41 + 11);
  assert.equal(kpis.completed, 5 + 1);
  assert.equal(kpis.patwariVerification, 4 + 0 + 4);
  assert.equal(kpis.activeVillages, 3);
  assert.equal(kpis.zeroProgressVillages, 0);
});

test('calculatePatwariSummaries computes leaderboards and daily delta', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const summaries = calculatePatwariSummaries(records, '12-10-2026');

  assert.equal(summaries.length, 3);
  const sushma = summaries.find((s) => s.patwariName === 'Sushma Indorker');
  assert.ok(sushma);
  assert.equal(sushma.completed, 5);
  assert.equal(sushma.performanceTier, 'high');

  const ruchin = summaries.find((s) => s.patwariName === 'Ruchin Arjariya');
  assert.ok(ruchin);
  // Ruchin on 11th had verification 3, on 12th had verification 4 -> delta = +1
  assert.equal(ruchin.dailyDelta.verificationDelta, 1);
});

test('calculatePeriodComparison compares consecutive dates', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const comparison = calculatePeriodComparison(records, 'day', '12-10-2026');

  assert.equal(comparison.currentDate, '12-10-2026');
  assert.equal(comparison.previousDate, '11-10-2026');
  assert.ok(comparison.activePatwarisCount > 0);
});

test('formatGoogleSheetCsvUrl converts standard Google Sheets links', () => {
  const normalUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
  const formatted = formatGoogleSheetCsvUrl(normalUrl);
  assert.equal(
    formatted,
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=0'
  );

  const directCsv = 'https://example.com/data.csv';
  assert.equal(formatGoogleSheetCsvUrl(directCsv), directCsv);
});

test('groupRecordsByPatwari groups villages under each Patwari with aggregated metrics', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const oct12Records = records.filter((r) => r.date === '12-10-2026');
  const groups = groupRecordsByPatwari(oct12Records);

  assert.equal(groups.length, 3);
  const sushmaGroup = groups.find((g) => g.patwariName === 'Sushma Indorker');
  assert.ok(sushmaGroup);
  assert.equal(sushmaGroup.completed, 5);
  assert.equal(sushmaGroup.villages.length, 1);
  assert.equal(sushmaGroup.villages[0].village, 'कठोतिया');
});

test('filterRecordsMulti filters by multiple patwaris, multiple dates, and status', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  
  // Filter by 2 patwaris
  const filteredPatwaris = filterRecordsMulti(records, {
    patwaris: ['Sushma Indorker', 'Ruchin Arjariya'],
  });
  assert.equal(filteredPatwaris.length, 4);

  // Filter by single date
  const filteredDate = filterRecordsMulti(records, {
    dates: ['11-10-2026'],
  });
  assert.equal(filteredDate.length, 2);

  // Filter by completed status
  const completedOnly = filterRecordsMulti(records, {
    statusFilter: 'completed',
  });
  assert.equal(completedOnly.length, 3); // 2 Kathotiya + 1 Khadua
});

test('splitCSVLine and parseCSVDataset handle quoted fields with commas', () => {
  const quotedCsv = `S.No,Village,LGD Code,Patwari Name,Plots,Beneficiaries,Registry_Initiated,Patwari_Verification,Submitted,Registration in,Completed,% Completed,Date
1,"तामिया, छिंदवाड़ा",493776,"Shatrughan, Kumre",285,501,20,10,0,0,5,0.0175,2026-10-13
`;
  const records = parseCSVDataset(quotedCsv);
  assert.equal(records.length, 1);
  assert.equal(records[0].village, 'तामिया, छिंदवाड़ा');
  assert.equal(records[0].patwariName, 'Shatrughan, Kumre');
  assert.equal(records[0].date, '13-10-2026');
  assert.equal(records[0].completed, 5);
});

test('calculatePatwariDateMatrix creates comparative matrix across dates', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const matrix = calculatePatwariDateMatrix(records, ['Ruchin Arjariya', 'Sushma Indorker'], ['11-10-2026', '12-10-2026']);

  assert.equal(matrix.length, 2);
  const ruchinRow = matrix.find((m) => m.patwariName === 'Ruchin Arjariya');
  assert.ok(ruchinRow);
  assert.ok(ruchinRow.dateMetrics['11-10-2026']);
  assert.ok(ruchinRow.dateMetrics['12-10-2026']);
  // Verified went from 3 to 4, delta = +1
  assert.equal(ruchinRow.delta.verificationDelta, 1);
});

test('parseCSVDataset handles Hindi headers correctly', () => {
  const hindiCsv = `क्र.,ग्राम,एलजीडी कोड,पटवारी नाम,कुल भूखण्ड,हितग्राही,पंजीयन प्रारंभ,पटवारी सत्यापन,प्रस्तुत,पंजीयन में,पूर्ण,% पूर्ण,तारीख
1,अन्होनी,493692,Ruchin Arjariya,89,169,14,8,4,2,3,3.37,13/10/2026
`;
  const records = parseCSVDataset(hindiCsv);
  assert.equal(records.length, 1);
  assert.equal(records[0].village, 'अन्होनी');
  assert.equal(records[0].patwariVerification, 8);
  assert.equal(records[0].completed, 3);
  assert.equal(records[0].date, '13-10-2026');
});

test('calculateDateTrends and calculateStatusSlices compute valid data', () => {
  const records = parseCSVDataset(SAMPLE_CSV);
  const trends = calculateDateTrends(records);
  assert.equal(trends.length, 2);
  assert.equal(trends[0].date, '11-10-2026');
  assert.equal(trends[1].date, '12-10-2026');
  assert.ok(trends[1].totalPlots > 0);

  const kpis = calculateKpis(records.filter((r) => r.date === '12-10-2026'));
  const slices = calculateStatusSlices(kpis);
  assert.equal(slices.length, 4);
  assert.equal(slices[0].id, 'completed');
  assert.ok(slices[0].count >= 0);
});


