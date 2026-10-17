// Netlify Serverless Function for Google Sheets & CSV sync
// Path: /.netlify/functions/sync-sheet

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const rawUrl = event.queryStringParameters?.url?.trim();

    if (!rawUrl || rawUrl === 'default' || rawUrl === 'latest') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          sourceUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
          syncedAt: new Date().toISOString(),
          isOfficial: true,
          recordCount: 480,
          latestDate: '13-10-2026',
        }),
      };
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
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Google Sheet fetch failed with status ${response.status}`,
        }),
      };
    }

    const csvText = await response.text();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        csv: csvText,
        sourceUrl: fetchUrl,
        syncedAt: new Date().toISOString(),
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Failed to sync spreadsheet' }),
    };
  }
};
