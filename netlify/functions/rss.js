// Lädt RSS Feeds serverseitig (kein CORS Problem) und liefert eine einheitliche JSON Liste.
// Feeds lassen sich ändern, ohne die App anzufassen: einfach FEEDS anpassen.
const FEEDS = [
  { id: 'moviepilot', name: 'Moviepilot', url: 'https://www.moviepilot.de/news.rss', tag: 'News' },
  { id: 'bluray', name: 'Blu-ray.com', url: 'https://www.blu-ray.com/rss/newsfeed.xml', tag: 'Bluray' },
];

exports.handler = async () => {
  const results = await Promise.allSettled(FEEDS.map(loadFeed));
  const items = [];
  const status = [];
  results.forEach((r, i) => {
    const feed = FEEDS[i];
    if (r.status === 'fulfilled') {
      items.push(...r.value);
      status.push({ id: feed.id, ok: true, count: r.value.length });
    } else {
      status.push({ id: feed.id, ok: false, error: String(r.reason && r.reason.message || r.reason) });
    }
  });
  items.sort((a, b) => b.ts - a.ts);
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=600' },
    body: JSON.stringify({ items: items.slice(0, 60), status }),
  };
};

async function loadFeed(feed) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (MedienNewsApp)', accept: 'application/rss+xml, application/xml, text/xml, */*' },
    });
    if (!res.ok) throw new Error(feed.name + ' antwortet mit ' + res.status);
    const xml = await res.text();
    return parse(xml, feed);
  } finally {
    clearTimeout(timer);
  }
}

function parse(xml, feed) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, 30).map((b) => {
    const title = clean(tag(b, 'title'));
    let link = clean(tag(b, 'link'));
    if (!link) {
      const m = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = m ? m[1] : '';
    }
    const dateStr = tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date');
    const ts = Date.parse(clean(dateStr)) || 0;
    const descRaw = tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded');
    let image = '';
    const enc = b.match(/<enclosure[^>]*url=["']([^"']+)["']/i) || b.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i);
    if (enc) image = enc[1];
    if (!image) {
      const im = unwrap(descRaw).match(/<img[^>]*src=["']([^"']+)["']/i);
      if (im) image = im[1];
    }
    return {
      source: feed.name,
      tag: feed.tag,
      title,
      link,
      ts,
      image,
      summary: clean(unwrap(descRaw).replace(/<[^>]+>/g, ' ')).slice(0, 180),
    };
  }).filter((i) => i.title && i.link);
}

function tag(block, name) {
  const re = new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>', 'i');
  const m = block.match(re);
  return m ? m[1] : '';
}

function unwrap(s) {
  return String(s || '').replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
}

function clean(s) {
  return decode(unwrap(s)).replace(/\s+/g, ' ').trim();
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

exports._parse = parse;
