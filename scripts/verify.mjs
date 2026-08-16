const base = process.env.DASHBOARD_URL || 'http://localhost:5182';
const fetchJson = async (path) => {
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return res.json();
};

const eps = await fetchJson('/data/episodes.json');
if (!Array.isArray(eps) || eps.length < 22) throw new Error('Expected episodes 20-41');
for (const ep of [31, 38, 39, 40, 41]) {
  const data = await fetchJson(`/data/episodes/${ep}.json`);
  if (!data.kpi?.revenue || !data.funnelRows?.length) throw new Error(`Episode ${ep} missing data`);
  if ('jsonPath' in data || JSON.stringify(data).includes('C:/Users') || JSON.stringify(data).includes('C:\\Users')) {
    throw new Error(`Episode ${ep} exposes local path`);
  }
}
const html = await fetch(base).then(r => r.text());
for (const needle of ['Raihan KataUHA Dashboard', 'episodeSelect', 'Funnel Performance', 'Episode Benchmark', 'benchmarkMetric', 'benchmarkTrends', 'Simulasi Raihan', 'cumulativeYearFilter']) {
  if (!html.includes(needle)) throw new Error(`Missing ${needle}`);
}
const simHtml = await fetch(`${base}/simulasi.html`).then(r => r.text());
for (const needle of ['Simulasi Raihan KataUHA', 'baselineSelect', 'Target Revenue', 'Skenario Cepat']) {
  if (!simHtml.includes(needle)) throw new Error(`Simulation page missing ${needle}`);
}
const simJs = await fetch(`${base}/simulasi.js`).then(r => r.text());
for (const needle of ['Required Paid', 'Daily Revenue Needed', 'Required Clicks']) {
  if (!simJs.includes(needle)) throw new Error(`Simulation JS missing ${needle}`);
}
console.log(JSON.stringify({ ok: true, episodes: eps.map(e => e.episode), latest: eps.at(-1)?.label, dataSource: 'static-public-data', simulation: true }, null, 2));
