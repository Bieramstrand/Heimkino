// Proxy für die Sport Schnittstellen OpenLigaDB (Fussball), TheSportsDB (Nationalmannschaft) und Jolpica (Formel 1)
const HOSTS = ['api.openligadb.de', 'api.jolpi.ca', 'www.thesportsdb.com'];

exports.handler = async (event) => {
  const target = (event.queryStringParameters || {}).u || '';
  let url;
  try {
    url = new URL(target);
  } catch (e) {
    return json(400, { error: 'Ungültige URL' });
  }
  if (url.protocol !== 'https:' || !HOSTS.includes(url.hostname)) {
    return json(400, { error: 'Host nicht erlaubt' });
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + (url.hostname === 'api.jolpi.ca' ? 900 : 30) },
      body,
    };
  } catch (e) {
    return json(502, { error: 'Quelle nicht erreichbar' });
  } finally {
    clearTimeout(timer);
  }
};

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}
