import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const GAPI = 'C:/Users/AUROS/AppData/Local/hermes/skills/productivity/google-workspace/scripts/google_api.py';
const episodes = {
  38: { sheetId: '1-Zq2x7eB-ntcgIOCCD-AK0eGK-NoPAfeQxqic2iA4wM', jsonPath: 'C:/Users/AUROS/reports/katauha38/katauha38_dashboard_updated.json' },
  39: { sheetId: '127eQRE828qVCNbL2k3iRDVaXcfldZ1iSZaAUd47AG8Q', jsonPath: 'C:/Users/AUROS/reports/katauha39/katauha39_dashboard_updated.json' },
  40: { sheetId: '1wCZ7ehrO3jgZff7foStnoQBb6mUYTwvNmuQptsf6aSo', jsonPath: 'C:/Users/AUROS/reports/katauha40/katauha40_dashboard_updated.json' }
};

function parseMetric(value) {
  const s = String(value ?? '').replace('Rp', '').replace('%', '').replace('x', '').replace(/,/g, '').trim();
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`Cannot parse metric: ${value}`);
  return n;
}

function sheetRows(sheetId) {
  const out = execFileSync('python', [GAPI, 'sheets', 'get', sheetId, 'Dashboard!A1:F22'], { encoding: 'utf8' });
  return JSON.parse(out);
}

function expectedFromJson(data) {
  const agg = data.aggregate || {};
  const meta = data.meta_summary || {};
  return {
    'Revenue': agg.revenue,
    'Peserta Bayar': agg.paid,
    'Checkout / Daftar': agg.checkout,
    'Avg Infaq': agg.paid ? Math.round(agg.revenue / agg.paid) : 0,
    'Checkout → Paid': agg.checkout ? Math.round((agg.paid / agg.checkout * 100) * 100) / 100 : 0,
    'Tracked Link Clicks': data.sid_total_clicks || 0,
    'Tracked Unique Clicks': data.sid_total_unique || 0,
    'Ads Funnel Revenue': meta.adsFunnelRevenue || 0,
    'Ads Spend': Math.round(meta.spend || 0),
    'PPN 11%': Math.round(meta.ppn || 0),
    'Ads Spend + PPN': Math.round(meta.spendWithPpn || 0),
    'Ads Spend / Revenue': agg.revenue ? Math.round((meta.spendWithPpn / agg.revenue * 100) * 100) / 100 : 0,
    'ROAS Ads Funnel (Revenue funnel ads / Spend+PPN)': Math.round((meta.roasAdsFunnelWithPpn || 0) * 100) / 100
  };
}

const report = [];
let hasMismatch = false;
for (const [episode, cfg] of Object.entries(episodes)) {
  const json = JSON.parse(fs.readFileSync(cfg.jsonPath, 'utf8'));
  const rows = sheetRows(cfg.sheetId);
  const byLabel = Object.fromEntries(rows.filter(r => r?.length).map(r => [r[0], r]));
  const expected = expectedFromJson(json);
  const mismatches = [];
  for (const [label, exp] of Object.entries(expected)) {
    const actualRaw = byLabel[label]?.[2];
    const actual = parseMetric(actualRaw);
    const tolerance = ['Checkout → Paid', 'Ads Spend / Revenue', 'ROAS Ads Funnel (Revenue funnel ads / Spend+PPN)'].includes(label) ? 0.02 : 0.5;
    if (Math.abs(actual - exp) > tolerance) mismatches.push({ label, json: exp, sheet: actualRaw, parsed: actual });
  }
  if (mismatches.length) hasMismatch = true;
  report.push({ episode: Number(episode), checkedMetrics: Object.keys(expected).length, mismatches });
}

console.log(JSON.stringify({ ok: !hasMismatch, report }, null, 2));
if (hasMismatch) process.exit(1);
