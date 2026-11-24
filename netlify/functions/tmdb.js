// Proxy für TMDB: der API Schlüssel liegt nur hier auf dem Server (Netlify Umgebungsvariable TMDB_API_KEY)
const ALLOWED = [
  /^\/trending\/(all|movie|tv)\/(day|week)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/search\/multi$/,
  /^\/(movie|tv)\/\d+$/,
  /^\/(movie|tv)\/\d+\/watch\/providers$/,
  /^\/movie\/\d+\/release_dates$/,
  /^\/movie\/(upcoming|now_playing|popular|top_rated)$/,
  /^\/tv\/(airing_today|on_the_air|popular|top_rated)$/,
];

exports.handler = async (event) => {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return json(500, { error: 'TMDB_API_KEY fehlt in den Netlify Umgebungsvariablen' });
  }
  const params = event.queryStringParameters || {};
  const path = params.path || '';
  if (!ALLOWED.some((re) => re.test(path))) {
    return json(400, { error: 'Pfad nicht erlaubt' });
  }
  const url = new URL('https://api.themoviedb.org/3' + path);
  Object.entries(params).forEach(([k, v]) => {
    if (k !== 'path' && k !== 'api_key') url.searchParams.set(k, v);
  });
  if (!url.searchParams.has('language')) url.searchParams.set('language', 'de-DE');
  // TMDB Schlüssel: v3 Schlüssel (32 Zeichen) als Parameter, v4 Token als Bearer
  const headers = { accept: 'application/json' };
  if (key.length > 40) headers.Authorization = 'Bearer ' + key;
  else url.searchParams.set('api_key', key);

  try {
    const res = await fetch(url, { headers });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=600',
      },
      body,
    };
  } catch (e) {
    return json(502, { error: 'TMDB nicht erreichbar' });
  }
};

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}
