// Perplexity Zugang: der Schlüssel liegt nur hier auf dem Server (Netlify Variable PERPLEXITY_API_KEY).
// Die Fragen werden hier zusammengesetzt, die App kann also keine beliebigen Anfragen schicken.
const MODEL = 'sonar';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Nur POST erlaubt' });
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return json(500, { error: 'PERPLEXITY_API_KEY fehlt in den Netlify Umgebungsvariablen' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Ungültige Anfrage' }); }

  const today = new Intl.DateTimeFormat('de-DE', { dateStyle: 'full', timeZone: 'Europe/Berlin' }).format(new Date());
  let prompt, recency;
  if (body.mode === 'week') {
    recency = 'week';
    prompt = 'Heute ist ' + today + '. Fasse für Deutschland in höchstens 6 kurzen Punkten zusammen, was diese Woche bei Filmen, Serien, Streaming (Netflix, Prime Video, Disney Plus, Paramount Plus, HBO Max, WOW) und Blu ray Veröffentlichungen wichtig ist: große Starts, gehypte Serien, spannende Ankündigungen. ' +
      'Jeder Punkt steht in einer eigenen Zeile und beginnt mit einem Punkt als Aufzählungszeichen. Kurze Sätze, auf Deutsch, keine Quellenverweise in eckigen Klammern, keine Bindestriche.';
  } else if (body.mode === 'title') {
    const title = String(body.title || '').trim().slice(0, 120);
    const kind = body.type === 'tv' ? 'Serie' : 'Film';
    const year = /^\d{4}$/.test(String(body.year || '')) ? ' (' + body.year + ')' : '';
    if (!title) return json(400, { error: 'Titel fehlt' });
    prompt = 'Kurze Einschätzung zu der ' + (kind === 'Serie' ? 'Serie' : 'dem Film') + ' „' + title + '“' + year + ': Worum geht es in zwei Sätzen, wie wird sie von Kritik und Publikum aufgenommen, für wen lohnt sie sich. ' +
      'Am Ende ein klares Fazit in einem Satz, ob es sich lohnt. Höchstens 90 Wörter, auf Deutsch, ohne Spoiler, keine Quellenverweise in eckigen Klammern, keine Bindestriche.';
  } else {
    return json(400, { error: 'Unbekannter Modus' });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 22000);
  try {
    const payload = { model: MODEL, messages: [
      { role: 'system', content: 'Du schreibst knapp, sachlich und auf Deutsch für eine private Film und Serien App.' },
      { role: 'user', content: prompt }
    ] };
    if (recency) payload.search_recency_filter = recency;
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json(res.status === 401 ? 500 : 502, { error: 'Perplexity Fehler ' + res.status + (res.status === 401 ? ' (Schlüssel prüfen)' : '') });
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
    return json(200, { text, sources: (data.citations || []).slice(0, 4) });
  } catch (e) {
    return json(502, { error: 'Perplexity nicht erreichbar' });
  } finally {
    clearTimeout(timer);
  }
};

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}
