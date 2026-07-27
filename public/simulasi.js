const DATA_BASE = '/data';
const state = { episodes: [], details: new Map(), baseline: null };

const els = {
  baselineSelect: document.querySelector('#baselineSelect'),
  baselineTitle: document.querySelector('#baselineTitle'),
  baselineMeta: document.querySelector('#baselineMeta'),
  baselineQuick: document.querySelector('#baselineQuick'),
  targetRevenue: document.querySelector('#targetRevenue'),
  targetAvgInfaq: document.querySelector('#targetAvgInfaq'),
  targetConversion: document.querySelector('#targetConversion'),
  targetSpendPct: document.querySelector('#targetSpendPct'),
  targetRoas: document.querySelector('#targetRoas'),
  daysRemaining: document.querySelector('#daysRemaining'),
  simulationResults: document.querySelector('#simulationResults'),
  simulationInsight: document.querySelector('#simulationInsight'),
  scenarioButtons: document.querySelector('#scenarioButtons'),
  resetBaseline: document.querySelector('#resetBaseline')
};

const fmt = new Intl.NumberFormat('id-ID');
const rp = (n) => `Rp${fmt.format(Math.round(Number(n) || 0))}`;
const num = (n) => fmt.format(Math.round(Number(n) || 0));
const pct = (n) => `${(Number(n) || 0).toFixed(2).replace('.', ',')}%`;
const x = (n) => `${(Number(n) || 0).toFixed(2).replace('.', ',')}x`;

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

function daysUntil(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 7;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(1, Math.ceil((target - start) / 86400000));
}

function metricCard(label, value, note, cls = '') {
  return `<div class="sim-metric ${cls}"><span>${label}</span><strong>${value}</strong><small>${note || ''}</small></div>`;
}

function sum(rows, picker) {
  return rows.reduce((total, row) => total + (Number(picker(row)) || 0), 0);
}

function weightedBaseline(id, label, rows) {
  const count = Math.max(rows.length, 1);
  const revenue = sum(rows, r => r.kpi.revenue) / count;
  const paid = sum(rows, r => r.kpi.paid) / count;
  const checkout = sum(rows, r => r.kpi.checkout) / count;
  const clicks = sum(rows, r => r.kpi.trackedClicks) / count;
  const adsSpendWithPpn = sum(rows, r => r.kpi.adsSpendWithPpn) / count;
  const adsFunnelRevenue = sum(rows, r => r.kpi.adsFunnelRevenue) / count;
  const promoDays = Math.round(sum(rows, r => r.promoDays) / count) || 1;
  return {
    id,
    label,
    shortLabel: label,
    title: label,
    source: rows.some(r => r.dataQuality?.includes('legacy')) ? 'Campuran data; traffic/ads lebih aman dari episode validated-json' : 'Gabungan episode tervalidasi',
    dataQuality: rows.some(r => r.dataQuality?.includes('legacy')) ? 'mixed-baseline' : 'validated-json',
    eventStart: rows.at(-1)?.eventStart,
    kpi: {
      revenue,
      paid,
      checkout,
      avgInfaq: paid ? revenue / paid : 28000,
      checkoutToPaidPct: checkout ? (paid / checkout) * 100 : 75,
      trackedClicks: clicks,
      adsSpendWithPpn,
      adsFunnelRevenue,
      roasAdsFunnelWithPpn: adsSpendWithPpn ? adsFunnelRevenue / adsSpendWithPpn : 2.5,
      adsSpendToRevenuePct: revenue ? (adsSpendWithPpn / revenue) * 100 : 20
    },
    promoDays
  };
}

function baselines() {
  const fullRows = [...state.details.values()].sort((a, b) => a.episode - b.episode);
  const validated = fullRows.filter(r => r.dataQuality === 'validated-json');
  return [
    ...fullRows.map(row => ({ id: `ep-${row.episode}`, label: row.label, row })),
    { id: 'avg-validated', label: 'Rata-rata KU38-KU40', row: weightedBaseline('avg-validated', 'Rata-rata KU38-KU40', validated.length ? validated : fullRows) },
    { id: 'avg-all', label: 'Rata-rata semua episode', row: weightedBaseline('avg-all', 'Rata-rata semua episode', fullRows) },
    { id: 'best-revenue', label: 'Benchmark revenue terbaik', row: [...fullRows].sort((a, b) => b.kpi.revenue - a.kpi.revenue)[0] }
  ];
}

function currentInputs() {
  return {
    targetRevenue: Number(els.targetRevenue.value) || 0,
    targetAvgInfaq: Number(els.targetAvgInfaq.value) || 1,
    targetConversion: (Number(els.targetConversion.value) || 1) / 100,
    targetSpendPct: (Number(els.targetSpendPct.value) || 0) / 100,
    targetRoas: Number(els.targetRoas.value) || 0,
    daysRemaining: Math.max(Number(els.daysRemaining.value) || 1, 1)
  };
}

function setInputsFromBaseline(row) {
  els.targetRevenue.value = 180000000;
  els.targetAvgInfaq.value = Math.round(row.kpi.avgInfaq || 28000);
  els.targetConversion.value = Math.round((row.kpi.checkoutToPaidPct || 75) * 10) / 10;
  els.targetSpendPct.value = 20;
  els.targetRoas.value = Math.max(Math.round((row.kpi.roasAdsFunnelWithPpn || 2.5) * 10) / 10, 2.5);
  els.daysRemaining.value = daysUntil(row.eventStart);
}

function loadBaseline(id, resetInputs = true) {
  const item = baselines().find(b => b.id === id) || baselines().find(b => b.id === 'ep-40') || baselines()[0];
  state.baseline = item.row;
  if (resetInputs) setInputsFromBaseline(item.row);
  render();
}

function renderBaseline(row) {
  const k = row.kpi;
  const legacyWarning = row.dataQuality !== 'validated-json'
    ? '<span class="sim-warning">Baseline mengandung data legacy/partial. Estimasi traffic/clicks bisa kurang akurat.</span>'
    : '';
  els.baselineTitle.textContent = `${row.label || row.shortLabel} - ${row.title || 'Baseline'}`;
  els.baselineMeta.innerHTML = `${row.source || 'Aggregate JSON'} ${legacyWarning}`;
  els.baselineQuick.innerHTML = [
    metricCard('Revenue baseline', rp(k.revenue), 'posisi data saat ini'),
    metricCard('Paid baseline', num(k.paid), `${pct(k.checkoutToPaidPct)} dari checkout`),
    metricCard('Avg Infaq baseline', rp(k.avgInfaq), 'revenue / paid'),
    metricCard('ROAS baseline', x(k.roasAdsFunnelWithPpn), 'ads funnel')
  ].join('');
}

function render() {
  const row = state.baseline;
  if (!row) return;
  renderBaseline(row);
  const k = row.kpi;
  const input = currentInputs();
  const requiredPaid = input.targetRevenue / input.targetAvgInfaq;
  const requiredCheckout = requiredPaid / input.targetConversion;
  const gapRevenue = input.targetRevenue - k.revenue;
  const gapPaid = requiredPaid - k.paid;
  const gapCheckout = requiredCheckout - k.checkout;
  const dailyRevenue = Math.max(gapRevenue, 0) / input.daysRemaining;
  const dailyPaid = Math.max(gapPaid, 0) / input.daysRemaining;
  const maxAdsSpend = input.targetRevenue * input.targetSpendPct;
  const requiredAdsFunnelRevenue = maxAdsSpend * input.targetRoas;
  const clickToPaid = k.trackedClicks ? k.paid / k.trackedClicks : 0;
  const requiredClicks = clickToPaid ? requiredPaid / clickToPaid : 0;
  const gapClicks = requiredClicks - k.trackedClicks;
  const currentDailyRevenue = k.promoDays ? k.revenue / k.promoDays : 0;
  const paceEnough = currentDailyRevenue >= dailyRevenue;

  els.simulationResults.innerHTML = [
    metricCard('Target Revenue', rp(input.targetRevenue), `Gap ${rp(gapRevenue)}`, gapRevenue <= 0 ? 'good' : ''),
    metricCard('Required Paid', num(requiredPaid), `Gap ${num(gapPaid)} peserta`, gapPaid <= 0 ? 'good' : ''),
    metricCard('Required Checkout', num(requiredCheckout), `Gap ${num(gapCheckout)} checkout`, gapCheckout <= 0 ? 'good' : ''),
    metricCard('Daily Revenue Needed', rp(dailyRevenue), `${num(input.daysRemaining)} hari tersisa`, paceEnough ? 'good' : 'watch'),
    metricCard('Daily Paid Needed', num(dailyPaid), 'rata-rata peserta/hari'),
    metricCard('Max Ads Spend + PPN', rp(maxAdsSpend), `Cap ${pct(input.targetSpendPct * 100)}`),
    metricCard('Required Ads Funnel Revenue', rp(requiredAdsFunnelRevenue), `ROAS target ${x(input.targetRoas)}`),
    metricCard('Required Clicks', requiredClicks ? num(requiredClicks) : '-', requiredClicks ? `Gap ${num(gapClicks)} clicks` : 'click baseline belum cukup')
  ].join('');

  const paidText = `${num(Math.max(gapPaid, 0))} peserta`;
  const revenueText = rp(Math.max(gapRevenue, 0));
  const paceText = paceEnough
    ? 'Pace revenue baseline saat ini sudah cukup untuk daily target simulasi.'
    : `Pace perlu dikejar: sekitar ${rp(dailyRevenue)}/hari atau ${num(dailyPaid)} peserta/hari.`;
  els.simulationInsight.innerHTML = `<strong>Insight:</strong> Dengan target ${rp(input.targetRevenue)} dan avg infaq ${rp(input.targetAvgInfaq)}, dibutuhkan sekitar <strong>${num(requiredPaid)} peserta bayar</strong>. Dari baseline saat ini masih perlu ${paidText} dan ${revenueText}. ${paceText}`;
}

async function init() {
  state.episodes = await fetchJson(`${DATA_BASE}/episodes.json`);
  const details = await Promise.all(state.episodes.map(ep => fetchJson(`${DATA_BASE}/episodes/${ep.episode}.json`)));
  details.forEach(row => state.details.set(row.episode, row));
  const options = baselines().map(b => `<option value="${b.id}">${b.label}</option>`).join('');
  els.baselineSelect.innerHTML = options;
  els.baselineSelect.value = state.details.has(40) ? 'ep-40' : baselines()[0]?.id;
  loadBaseline(els.baselineSelect.value, true);
}

els.baselineSelect.addEventListener('change', e => loadBaseline(e.target.value, true));
[els.targetRevenue, els.targetAvgInfaq, els.targetConversion, els.targetSpendPct, els.targetRoas, els.daysRemaining]
  .forEach(input => input.addEventListener('input', render));
els.scenarioButtons.addEventListener('click', event => {
  const button = event.target.closest('button[data-field]');
  if (!button) return;
  const target = els[button.dataset.field];
  if (!target) return;
  target.value = button.dataset.value;
  render();
});
els.resetBaseline.addEventListener('click', () => setInputsFromBaseline(state.baseline) || render());

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<pre style="padding:24px;color:#b91c1c">${err.stack || err.message}</pre>`;
});
