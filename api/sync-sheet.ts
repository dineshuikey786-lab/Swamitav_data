export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = (req.query?.url as string)?.trim();

    if (!rawUrl || rawUrl === 'default' || rawUrl === 'latest') {
      return res.status(200).json({
        sourceUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
        syncedAt: new Date().toISOString(),
        isOfficial: true,
        recordCount: 480,
        latestDate: '13-10-2026',
      });
    }

    let fetchUrl = rawUrl;
    const sheetMatch = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetMatch && sheetMatch[1] && !fetchUrl.includes('output=csv')) {
      const sheetId = sheetMatch[1];
      const gidMatch = fetchUrl.match(/[#&?]gid=([0-9]+)/);
      const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '&gid=0';
      fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': 'text/csv, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PatwariDashboard/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Google Sheet fetch failed with status ${response.status}`,
      });
    }

    const csvText = await response.text();
    return res.status(200).json({
      csv: csvText,
      sourceUrl: fetchUrl,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to sync spreadsheet' });
  }
}
