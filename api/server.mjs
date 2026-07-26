import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const port = Number(process.env.PORT || 5182);

const EPISODES = {
  31: {
    episode: 31,
    label: 'KataUHA 31',
    shortLabel: 'KU31',
    title: 'Dimana Tuhan Saat Aku Jatuh',
    eventStart: '2025-11-18',
    spreadsheetId: '',
    spreadsheetUrl: '',
    jsonPath: 'C:/Users/AUROS/reports/katauha31/katauha31_dashboard_updated.json'
  },
  32: {
    episode: 32,
    label: 'KataUHA 32',
    shortLabel: 'KU32',
    title: 'Life After Break Up',
    eventStart: '2025-12-09',
    spreadsheetId: '',
    spreadsheetUrl: '',
    jsonPath: 'C:/Users/AUROS/reports/katauha32/katauha32_dashboard_updated.json'
  },
  33: {
    episode: 33,
    label: 'KataUHA 33',
    shortLabel: 'KU33',
    title: 'Why Do I Feel Empty',
    eventStart: '2026-01-20',
    spreadsheetId: '',
    spreadsheetUrl: '',
    jsonPath: 'C:/Users/AUROS/reports/katauha33/katauha33_dashboard_updated.json'
  },
  34: {
    episode: 34,
    label: 'KataUHA 34',
    shortLabel: 'KU34',
    title: 'Manifesting: Karir, Cinta, Rezeki',
    eventStart: '2026-02-24',
    spreadsheetId: '',
    spreadsheetUrl: '',
    jsonPath: 'C:/Users/AUROS/reports/katauha34/katauha34_dashboard_updated.json'
  },
  35: {
    episode: 35,
    label: 'KataUHA 35',
    shortLabel: 'KU35',
    title: 'Memaafkan, Tapi Bukan Melupakan',
    eventStart: '2026-03-13',
    spreadsheetId: '',
    spreadsheetUrl: '',
    jsonPath: 'C:/Users/AUROS/reports/katauha35/katauha35_dashboard_updated.json'
  },
  36: {
    episode: 36,
    label: 'KataUHA 36',
    shortLabel: 'KU36',
    title: 'Ngga Nikah, Gapapa Kan?',
    eventStart: '2026-04-14',
    spreadsheetId: '',
    spreadsheetUrl: '',
    jsonPath: 'C:/Users/AUROS/reports/katauha36/katauha36_dashboard_updated.json'
  },
  37: {
    episode: 37,
    label: 'KataUHA 37',
    shortLabel: 'KU37',
    title: 'Memantaskan Diri atau Mencari yang Pasti?',
    eventStart: 'Tuesday, 28 April 2026',
    spreadsheetId: '',
    spreadsheetUrl: '',
    jsonPath: 'C:/Users/AUROS/reports/katauha37/katauha37_dashboard_updated.json'
  },
  38: {
    episode: 38,
    label: 'KataUHA 38',
    shortLabel: 'KU38',
    title: 'Ya Allah, Ini Arahnya Kemana Ya?',
    eventStart: 'Tuesday, 09 June 2026',
    spreadsheetId: '1-Zq2x7eB-ntcgIOCCD-AK0eGK-NoPAfeQxqic2iA4wM',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1-Zq2x7eB-ntcgIOCCD-AK0eGK-NoPAfeQxqic2iA4wM/edit',
    jsonPath: 'C:/Users/AUROS/reports/katauha38/katauha38_dashboard_updated.json'
  },
  39: {
    episode: 39,
    label: 'KataUHA 39',
    shortLabel: 'KU39',
    title: 'Overthinking: Jodoh, Karir, Takdir',
    eventStart: 'Tuesday, 14 July 2026',
    spreadsheetId: '127eQRE828qVCNbL2k3iRDVaXcfldZ1iSZaAUd47AG8Q',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/127eQRE828qVCNbL2k3iRDVaXcfldZ1iSZaAUd47AG8Q/edit',
    jsonPath: 'C:/Users/AUROS/reports/katauha39/katauha39_dashboard_updated.json'
  },
  40: {
    episode: 40,
    label: 'KataUHA 40',
    shortLabel: 'KU40',
    title: 'Testing - Judul belum fix',
    eventStart: 'Tuesday, 04 August 2026',
    spreadsheetId: '1wCZ7ehrO3jgZff7foStnoQBb6mUYTwvNmuQptsf6aSo',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1wCZ7ehrO3jgZff7foStnoQBb6mUYTwvNmuQptsf6aSo/edit',
    jsonPath: 'C:/Users/AUROS/reports/katauha40/katauha40_dashboard_updated.json'
  }
};

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function pct(n) { return Number.isFinite(n) ? n : 0; }
function round(n, d = 2) { const p = 10 ** d; return Math.round((Number(n) || 0) * p) / p; }
function sum(rows, key) { return rows.reduce((a, r) => a + (Number(r[key]) || 0), 0); }

async function sendJson(res, obj, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

async function readEpisode(ep) {
  const meta = EPISODES[ep];
  if (!meta) return null;
  const stat = await fs.stat(meta.jsonPath);
  const raw = JSON.parse(await fs.readFile(meta.jsonPath, 'utf8'));
  const aggregate = raw.aggregate || {};
  const metaSummary = raw.meta_summary || {};
  const targets = raw.kpi_targets || {};
  const kpi = {
    revenue: Number(aggregate.revenue) || 0,
    paid: Number(aggregate.paid) || 0,
    checkout: Number(aggregate.checkout) || 0,
    unfinished: Number(aggregate.unfinished) || 0,
    avgInfaq: aggregate.paid ? Math.round(aggregate.revenue / aggregate.paid) : 0,
    checkoutToPaidPct: aggregate.checkout ? round((aggregate.paid / aggregate.checkout) * 100) : 0,
    trackedClicks: Number(raw.sid_total_clicks) || 0,
    trackedUniqueClicks: Number(raw.sid_total_unique) || 0,
    adsFunnelRevenue: Number(metaSummary.adsFunnelRevenue) || 0,
    adsSpend: Number(metaSummary.spend) || 0,
    adsPpn: Number(metaSummary.ppn) || 0,
    adsSpendWithPpn: Number(metaSummary.spendWithPpn) || 0,
    adsSpendToRevenuePct: aggregate.revenue ? round((metaSummary.spendWithPpn / aggregate.revenue) * 100) : 0,
    roasAdsFunnelWithPpn: round(Number(metaSummary.roasAdsFunnelWithPpn) || 0),
    metaRevenue: Number(metaSummary.metaRevenue) || 0,
    metaRoas: round(Number(metaSummary.metaRoas) || 0)
  };
  const funnelRows = (raw.funnel_rows || []).map(r => ({
    suffix: r.suffix || '',
    productName: r.productName || '',
    revenue: Number(r.revenue) || 0,
    paid: Number(r.paid) || 0,
    checkout: Number(r.checkout) || 0,
    unfinished: Number(r.unfinished) || 0,
    avgInfaq: Number(r.avgInfaq) || 0,
    checkoutToPaidPct: pct(Number(r.checkoutToPaidPct)),
    linkClicks: Number(r.linkClicks) || 0,
    uniqueClicks: Number(r.uniqueClicks) || 0,
    clickSource: r.clickSource || '',
    clickToPaidPct: pct(Number(r.clickToPaidPct)),
    recommendation: r.recommendation || ''
  })).sort((a, b) => b.revenue - a.revenue);
  const dailyRevenue = (raw.daily_revenue_history || []).map(r => ({ date: r.date, revenue: Number(r.revenue) || 0 })).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return {
    ...meta,
    jsonPath: meta.jsonPath,
    jsonModifiedAt: stat.mtime.toISOString(),
    promoStart: raw.promo_start || '',
    promoDays: Number(raw.promo_days) || 0,
    title: raw.eventTitle || meta.title,
    eventStart: raw.eventStart || meta.eventStart,
    source: raw.legacy_source?.dataQuality ? 'Legacy normalized Raihan workbook' : 'Existing KataUHA dashboard JSON',
    dataQuality: raw.legacy_source?.dataQuality || 'validated-json',
    dataWarnings: raw.legacy_source?.warnings || [],
    kpiTargets: targets,
    kpi,
    aggregate,
    metaSummary,
    funnelRows,
    dailyRevenue,
    audit: {
      funnelCount: funnelRows.length,
      funnelRevenueSum: sum(funnelRows, 'revenue'),
      funnelPaidSum: sum(funnelRows, 'paid'),
      funnelCheckoutSum: sum(funnelRows, 'checkout')
    }
  };
}

async function listEpisodes() {
  const rows = [];
  for (const ep of Object.keys(EPISODES).map(Number).sort((a, b) => a - b)) {
    const full = await readEpisode(ep);
    rows.push({ episode: full.episode, label: full.label, shortLabel: full.shortLabel, title: full.title, eventStart: full.eventStart, promoStart: full.promoStart, promoDays: full.promoDays, jsonModifiedAt: full.jsonModifiedAt, kpi: full.kpi, spreadsheetUrl: full.spreadsheetUrl });
  }
  return rows;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/health') return sendJson(res, { ok: true, app: 'raihan-katauha-dashboard-v1' });
    if (url.pathname === '/api/episodes') return sendJson(res, await listEpisodes());
    const match = url.pathname.match(/^\/api\/episodes\/(\d+)$/);
    if (match) {
      const data = await readEpisode(Number(match[1]));
      return data ? sendJson(res, data) : sendJson(res, { error: 'Episode not found' }, 404);
    }
    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const filePath = path.join(publicDir, safePath || 'index.html');
    if (!filePath.startsWith(publicDir)) return sendJson(res, { error: 'Forbidden' }, 403);
    const stat = await fs.stat(filePath).catch(() => null);
    const finalPath = stat?.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const data = await fs.readFile(finalPath);
    res.writeHead(200, { 'content-type': types[path.extname(finalPath)] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') return sendJson(res, { error: 'Not found', detail: err.message }, 404);
    return sendJson(res, { error: err.message }, 500);
  }
});

server.listen(port, () => {
  console.log(`Raihan KataUHA dashboard running at http://localhost:${port}`);
});
