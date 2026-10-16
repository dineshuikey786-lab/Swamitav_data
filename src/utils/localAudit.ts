import { OverallKpis, PatwariSummary, PeriodComparison } from './patwariAnalytics';

export function generateLocalRevenueAudit(
  prompt: string,
  kpis: OverallKpis,
  summaries: PatwariSummary[],
  comparison: PeriodComparison
): string {
  const topPerformers = summaries.slice(0, 5);
  const criticalPerformers = summaries.filter((s) => s.performanceTier === 'critical').slice(0, 6);
  const laggingPerformers = summaries.filter((s) => s.performanceTier === 'lagging').slice(0, 6);

  const topList = topPerformers
    .map(
      (s, i) =>
        `${i + 1}. **${s.patwariName}**: ${s.completed} पूर्ण (${s.pctCompleted}%), ${s.registryInitiated} प्रारंभ, ${s.villagesCount} ग्राम`
    )
    .join('\n');

  const criticalList =
    criticalPerformers.length > 0
      ? criticalPerformers
          .map(
            (s, i) =>
              `${i + 1}. **${s.patwariName}**: 0 पूर्ण पंजीयन (लक्ष्य: ${s.totalPlots} भूखंड, ${s.villagesCount} ग्राम)`
          )
          .join('\n')
      : 'कोई भी पटवारी शून्य श्रेणी में नहीं है।';

  return `### 📋 शासकीय राजस्व प्रगति समीक्षा एवं प्रशासनिक विश्लेषण (वृत्त: तामिया)

**समीक्षा दिनांक**: ${comparison.currentDate} | **समीक्षा अवधि**: ${
    comparison.period === 'day' ? 'दैनिक' : comparison.period === 'week' ? 'साप्ताहिक' : 'मासिक'
  }

---

#### 1. वृत्त स्तरीय प्रमुख प्रगति सूचकांक (Executive KPIs)
* **कुल लक्षित भूखंड**: ${kpis.totalPlots.toLocaleString('en-IN')} (${kpis.totalVillages} ग्राम, ${kpis.totalPatwaris} हल्का पटवारी)
* **पंजीयन प्रारंभ**: ${kpis.registryInitiated.toLocaleString('en-IN')} आवेदन
* **पटवारी सत्यापन पूर्ण**: ${kpis.patwariVerification.toLocaleString('en-IN')} आवेदन
* **पटवारी स्तर पर लंबित सत्यापन**: **${kpis.pendingVerification.toLocaleString('en-IN')} आवेदन** ⚠️
* **अंतिम पूर्ण पंजीयन**: **${kpis.completed.toLocaleString('en-IN')} भूखंड** (${kpis.pctCompleted}% समग्र पूर्णता दर)
* **पूर्व दिनांक से वृद्धि (Delta)**: **${comparison.deltaCompleted >= 0 ? `+${comparison.deltaCompleted}` : comparison.deltaCompleted} पूर्ण भूखंड**

---

#### 2. प्राथमिक प्रशासनिक बॉटलनेक (Critical Verification Bottleneck)
वृत्त तामिया में कुल **${kpis.registryInitiated}** पंजीयन प्रारंभ किए गए हैं, किंतु पटवारी स्तर पर केवल **${kpis.patwariVerification}** का ही सत्यापन हो सका है।
वर्तमान में **${kpis.pendingVerification} आवेदन पटवारी स्तर पर भौतिक जांच/सत्यापन हेतु लंबित हैं**। यह संपूर्ण वितरण प्रक्रिया में मुख्य अवरोध (Bottleneck) बना हुआ है।

---

#### 3. उत्कृष्ट कार्य करने वाले शीर्ष 5 हल्का पटवारी (Top Performers)
${topList}

---

#### 4. शून्य एवं चिंताजनक प्रगति वाले पटवारी (Critical Review List)
${criticalList}

---

#### 5. अनुविभागीय अधिकारी (राजस्व) / तहसीलदार महोदय हेतु कार्ययोजना (Action Plan)
1. **48 घंटे का सत्यापन अभियान**: लंबित ${kpis.pendingVerification} आवेदनों के निपटारे हेतु संबंधित पटवारियों को 48 घंटे में सत्यापन पूर्ण करने का लिखित आदेश जारी किया जाए।
2. **समीक्षा बैठक**: शून्य प्रगति वाले पटवारियों को कारण बताओ नोटिस (Show-Cause Notice) जारी कर कार्य में तेजी लाने के निर्देश दिए जाएं।
3. **दैनिक प्रगति अनुश्रवण**: आर.आई. (Revenue Inspector) स्तर पर प्रतिदिन शाम 5 बजे सत्यापन की प्रगति दर्ज करने की व्यवस्था लागू की जाए।`;
}
