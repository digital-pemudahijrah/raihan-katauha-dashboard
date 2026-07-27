const DATA_BASE = '/data';
const state = { episodes: [], current: null, query: '', sortBy: 'revenue', cumulativeSelection: new Set() };

const els = {
  episodeSelect: document.querySelector('#episodeSelect'),
  episodeMeta: document.querySelector('#episodeMeta'),
  episodeTitle: document.querySelector('#episodeTitle'),
  eventStart: document.querySelector('#eventStart'),
  promoStart: document.querySelector('#promoStart'),
  promoDays: document.querySelector('#promoDays'),
  lastUpdated: document.querySelector('#lastUpdated'),
  sheetLink: document.querySelector('#sheetLink'),
  heroRoas: document.querySelector('#heroRoas'),
  cumulativeSummary: document.querySelector('#cumulativeSummary'),
  cumulativeEpisodeChips: document.querySelector('#cumulativeEpisodeChips'),
  cumulativeStatus: document.querySelector('#cumulativeStatus'),
  selectAllEpisodes: document.querySelector('#selectAllEpisodes'),
  clearEpisodes: document.querySelector('#clearEpisodes'),
  kpiGrid: document.querySelector('#kpi'),
  progressList: document.querySelector('#progressList'),
  chart: document.querySelector('#chart'),
  search: document.querySelector('#search'),
  sortBy: document.querySelector('#sortBy'),
  funnelBody: document.querySelector('#funnelBody'),
  compareBody: document.querySelector('#compareBody'),
  baseEpisode: document.querySelector('#baseEpisode'),
  compareEpisode: document.querySelector('#compareEpisode'),
  deltaSummary: document.querySelector('#deltaSummary'),
  deltaChart: document.querySelector('#deltaChart'),
  deltaInsight: document.querySelector('#deltaInsight'),
  auditText: document.querySelector('#auditText'),
  navLinks: [...document.querySelectorAll('.side-nav a[data-section]')]
};

const fmt = new Intl.NumberFormat('id-ID');
const rp = (n) => `Rp${fmt.format(Math.round(Number(n) || 0))}`;
const num = (n) => fmt.format(Math.round(Number(n) || 0));
const pct = (n) => `${(Number(n) || 0).toFixed(2).replace('.', ',')}%`;
const x = (n) => `${(Number(n) || 0).toFixed(2).replace('.', ',')}x`;
const shortDate = (iso) => iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

function kpiCard(label, value, note) {
  return `<div class="kpi"><span>${label}</span><strong>${value}</strong><small>${note || ''}</small></div>`;
}

function selectedCumulativeEpisodes() {
  const selected = state.episodes.filter(ep => state.cumulativeSelection.has(ep.episode));
  return selected.length ? selected : state.episodes;
}

function sumEpisodes(rows, key) {
  return rows.reduce((total, ep) => total + (Number(ep.kpi?.[key]) || 0), 0);
}

function renderCumulativeChips() {
  els.cumulativeEpisodeChips.innerHTML = state.episodes.map(ep => {
    const active = state.cumulativeSelection.has(ep.episode);
    return `<button type="button" class="episode-chip ${active ? 'active' : ''}" data-episode="${ep.episode}">
      <strong>${ep.shortLabel}</strong><span>${shortDate(ep.eventStart)}</span>
    </button>`;
  }).join('');
}

function toggleCumulativeEpisode(episode) {
  if (state.cumulativeSelection.has(episode)) state.cumulativeSelection.delete(episode);
  else state.cumulativeSelection.add(episode);
  renderCumulativeChips();
  renderCumulativeSummary();
}

function renderCumulativeSummary() {
  const rows = selectedCumulativeEpisodes();
  const totalRevenue = sumEpisodes(rows, 'revenue');
  const totalPaid = sumEpisodes(rows, 'paid');
  const totalCheckout = sumEpisodes(rows, 'checkout');
  const totalUnfinished = sumEpisodes(rows, 'unfinished');
  const totalAdsSpend = sumEpisodes(rows, 'adsSpendWithPpn');
  const totalAdsRevenue = sumEpisodes(rows, 'adsFunnelRevenue');
  const totalClicks = sumEpisodes(rows, 'trackedClicks');
  const weightedAvgInfaq = totalPaid ? totalRevenue / totalPaid : 0;
  const checkoutToPaidPct = totalCheckout ? (totalPaid / totalCheckout) * 100 : 0;
  const adsSpendToRevenuePct = totalRevenue ? (totalAdsSpend / totalRevenue) * 100 : 0;
  const cumulativeRoas = totalAdsSpend ? totalAdsRevenue / totalAdsSpend : 0;
  const first = rows[0]?.shortLabel || '-';
  const last = rows.at(-1)?.shortLabel || '-';
  const isAll = rows.length === state.episodes.length;
  els.cumulativeStatus.textContent = isAll
    ? `Mode: Semua episode (${first} - ${last})`
    : `Mode: Custom ${rows.length} episode terpilih (${rows.map(ep => ep.shortLabel).join(', ')})`;
  els.cumulativeSummary.innerHTML = [
    kpiCard('Total Episode', num(rows.length), isAll ? `Semua: ${first} - ${last}` : 'Custom selection'),
    kpiCard('Total Revenue', rp(totalRevenue), isAll ? 'Akumulasi semua episode' : 'Akumulasi episode terpilih'),
    kpiCard('Total Peserta Bayar', num(totalPaid), `${pct(checkoutToPaidPct)} dari checkout`),
    kpiCard('Total Checkout', num(totalCheckout), `${num(totalUnfinished)} belum selesai`),
    kpiCard('Avg Infaq Gabungan', rp(weightedAvgInfaq), 'Total revenue / total paid'),
    kpiCard('Total Ads Spend + PPN', rp(totalAdsSpend), `Spend/revenue ${pct(adsSpendToRevenuePct)}`),
    kpiCard('Total Ads Funnel Revenue', rp(totalAdsRevenue), `ROAS gabungan ${x(cumulativeRoas)}`),
    kpiCard('Total Tracked Clicks', num(totalClicks), 'Akumulasi click KPI')
  ].join('');
}

function progressRow(label, value, target, formatter = num) {
  const ratio = target ? Math.min((value / target) * 100, 140) : 0;
  return `<div class="progress-row">
    <div class="progress-head"><span>${label}</span><span>${formatter(value)} / ${formatter(target)} (${pct(ratio)})</span></div>
    <div class="bar"><i style="width:${Math.min(ratio, 100)}%"></i></div>
  </div>`;
}

function renderEpisode(data) {
  state.current = data;
  const k = data.kpi;
  els.episodeMeta.textContent = `${data.label} • ${data.source}`;
  els.episodeTitle.textContent = data.title;
  els.eventStart.textContent = `Hari H event: ${shortDate(data.eventStart)}`;
  els.promoStart.textContent = `Start promosi: ${shortDate(data.promoStart)}`;
  els.promoDays.textContent = `Hari promosi: ${num(data.promoDays)}`;
  els.lastUpdated.textContent = `JSON update: ${shortDate(data.jsonModifiedAt)}`;
  els.sheetLink.href = data.spreadsheetUrl;
  els.sheetLink.style.display = data.spreadsheetUrl ? '' : 'none';
  els.heroRoas.textContent = x(k.roasAdsFunnelWithPpn);
  els.kpiGrid.innerHTML = [
    kpiCard('Total Revenue', rp(k.revenue), 'Mayar aggregate dari JSON'),
    kpiCard('Peserta Bayar', num(k.paid), `${pct(k.checkoutToPaidPct)} dari checkout`),
    kpiCard('Checkout / Daftar', num(k.checkout), `${num(k.unfinished)} belum selesai`),
    kpiCard('Avg Infaq', rp(k.avgInfaq), 'Revenue / paid'),
    kpiCard('Ads Spend + PPN', rp(k.adsSpendWithPpn), `Spend/revenue ${pct(k.adsSpendToRevenuePct)}`),
    kpiCard('Ads Funnel Revenue', rp(k.adsFunnelRevenue), 'Revenue suffix ads/tst'),
    kpiCard('Tracked Clicks', num(k.trackedClicks), `${num(k.trackedUniqueClicks)} unique`),
    kpiCard('Meta ROAS', x(k.metaRoas), `${rp(k.metaRevenue)} Meta revenue`)
  ].join('');
  renderProgress(data);
  renderChart(data.dailyRevenue || []);
  renderFunnel();
  renderAudit(data);
}

function renderProgress(data) {
  const t = data.kpiTargets || {};
  const targets = {
    revenue: t.targetRevenue || (data.episode === 38 ? 300000000 : 180000000),
    paid: t.targetPaid || (data.episode === 38 ? 15000 : 6500),
    checkout: t.targetCheckout || (data.episode === 38 ? 20000 : 9000),
    avgInfaq: t.targetAvgInfaq || 28000,
  };
  els.progressList.innerHTML = [
    progressRow('Revenue', data.kpi.revenue, targets.revenue, rp),
    progressRow('Peserta Bayar', data.kpi.paid, targets.paid, num),
    progressRow('Checkout', data.kpi.checkout, targets.checkout, num),
    progressRow('Avg Infaq', data.kpi.avgInfaq, targets.avgInfaq, rp),
  ].join('');
}

function renderChart(rows) {
  if (!rows.length) {
    els.chart.innerHTML = '<p class="muted">Belum ada daily revenue history.</p>';
    return;
  }
  const max = Math.max(...rows.map(r => r.revenue), 1);
  els.chart.innerHTML = rows.map(r => {
    const h = Math.max((r.revenue / max) * 100, 3);
    return `<div class="bar-col" style="height:${h}%" data-label="${r.date}: ${rp(r.revenue)}"></div>`;
  }).join('');
}

function renderFunnel() {
  const rows = [...(state.current?.funnelRows || [])];
  const q = state.query.toLowerCase().trim();
  const filtered = rows.filter(r => !q || `${r.productName} ${r.suffix} ${r.clickSource}`.toLowerCase().includes(q));
  const key = state.sortBy;
  filtered.sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
  els.funnelBody.innerHTML = filtered.map(r => `<tr>
    <td><strong>${r.productName}</strong><span class="badge">${r.suffix || '-'}</span></td>
    <td>${rp(r.revenue)}</td>
    <td>${num(r.paid)}</td>
    <td>${num(r.checkout)}</td>
    <td>${rp(r.avgInfaq)}</td>
    <td>${pct(r.checkoutToPaidPct)}</td>
    <td>${num(r.linkClicks)}<br><small>${num(r.uniqueClicks)} unique</small></td>
    <td>${r.clickSource || '-'}</td>
    <td>${r.recommendation || '-'}</td>
  </tr>`).join('') || '<tr><td colspan="9">Tidak ada data sesuai filter.</td></tr>';
}

function renderCompare() {
  els.compareBody.innerHTML = state.episodes.map(ep => `<tr>
    <td><strong>${ep.label}</strong><br><small>${ep.title}</small></td>
    <td>${rp(ep.kpi.revenue)}</td>
    <td>${num(ep.kpi.paid)}</td>
    <td>${num(ep.kpi.checkout)}</td>
    <td>${rp(ep.kpi.avgInfaq)}</td>
    <td>${rp(ep.kpi.adsSpendWithPpn)}</td>
    <td>${x(ep.kpi.roasAdsFunnelWithPpn)}</td>
  </tr>`).join('');
}

const days = (n) => `${num(n)} hari`;

const compareMetrics = [
  { key: 'revenue', label: 'Revenue', format: rp, mode: 'percent', good: 'up' },
  { key: 'paid', label: 'Peserta Bayar', format: num, mode: 'percent', good: 'up' },
  { key: 'checkout', label: 'Checkout', format: num, mode: 'percent', good: 'up' },
  { key: 'avgInfaq', label: 'Avg Infaq', format: rp, mode: 'percent', good: 'up' },
  { key: 'checkoutToPaidPct', label: 'Checkout -> Paid', format: pct, mode: 'points', good: 'up' },
  { key: 'adsSpendWithPpn', label: 'Ads Spend + PPN', format: rp, mode: 'percent', good: 'down' },
  { key: 'adsSpendToRevenuePct', label: 'Ads Spend / Revenue', format: pct, mode: 'points', good: 'down' },
  { key: 'roasAdsFunnelWithPpn', label: 'ROAS Ads Funnel', format: x, mode: 'percent', good: 'up' },
  { key: 'promoDays', label: 'Lama Promosi', format: days, mode: 'points', good: 'neutral', source: 'episode' }
];

function deltaValue(base, next, mode) {
  if (mode === 'points') return (Number(next) || 0) - (Number(base) || 0);
  if (!base) return next ? 100 : 0;
  return ((Number(next) - Number(base)) / Number(base)) * 100;
}

function deltaClass(metric, delta) {
  if (metric.good === 'neutral') return 'flat';
  if (Math.abs(delta) < 0.01) return 'flat';
  const improved = metric.good === 'down' ? delta < 0 : delta > 0;
  return improved ? 'good' : 'bad';
}

function deltaText(delta, mode) {
  const sign = delta > 0 ? '+' : '';
  const suffix = mode === 'points' ? ' poin' : '%';
  return `${sign}${delta.toFixed(2).replace('.', ',')}${suffix}`;
}

function renderDeltaComparison() {
  if (!state.episodes.length) return;
  const base = state.episodes.find(e => String(e.episode) === String(els.baseEpisode.value)) || state.episodes[0];
  const next = state.episodes.find(e => String(e.episode) === String(els.compareEpisode.value)) || state.episodes.at(-1);
  const rows = compareMetrics.map(metric => {
    const baseValue = Number(metric.source === 'episode' ? base[metric.key] : base.kpi[metric.key]) || 0;
    const nextValue = Number(metric.source === 'episode' ? next[metric.key] : next.kpi[metric.key]) || 0;
    const delta = deltaValue(baseValue, nextValue, metric.mode);
    return { metric, baseValue, nextValue, delta, cls: deltaClass(metric, delta) };
  });

  els.deltaSummary.innerHTML = rows.slice(0, 4).map(row => `<div class="delta-card ${row.cls}">
    <span>${row.metric.label}</span>
    <strong>${deltaText(row.delta, row.metric.mode)}</strong>
    <small>${next.shortLabel} ${row.metric.format(row.nextValue)} vs ${base.shortLabel} ${row.metric.format(row.baseValue)}</small>
  </div>`).join('');

  const maxAbs = Math.max(...rows.map(r => Math.abs(r.delta)), 1);
  els.deltaChart.innerHTML = rows.map(row => {
    const width = Math.max((Math.abs(row.delta) / maxAbs) * 50, 2);
    const style = row.delta >= 0 ? `left:50%;width:${width}%` : `right:50%;width:${width}%`;
    return `<div class="delta-row ${row.cls}">
      <div class="delta-label"><strong>${row.metric.label}</strong><small>${row.metric.format(row.nextValue)} vs ${row.metric.format(row.baseValue)}</small></div>
      <div class="delta-track"><i style="${style}"></i><b></b></div>
      <div class="delta-number">${deltaText(row.delta, row.metric.mode)}</div>
    </div>`;
  }).join('');

  const best = rows.filter(r => r.cls === 'good').sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const worst = rows.filter(r => r.cls === 'bad').sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const headline = `${next.label} dibanding ${base.label}`;
  const promoContext = `Durasi promosi: ${next.shortLabel} ${days(next.promoDays)} vs ${base.shortLabel} ${days(base.promoDays)}.`;
  els.deltaInsight.innerHTML = `<strong>${headline}</strong><br>${promoContext}<br>${best ? `Peningkatan terbaik: ${best.metric.label} (${deltaText(best.delta, best.metric.mode)}).` : 'Belum ada indikator yang membaik.'} ${worst ? `Area evaluasi utama: ${worst.metric.label} (${deltaText(worst.delta, worst.metric.mode)}).` : 'Tidak ada penurunan signifikan.'}`;
}

function renderAudit(data) {
  const warnings = (data.dataWarnings || []).length ? ` | Warning: ${(data.dataWarnings || []).join(' ')}` : '';
  els.auditText.textContent = `Quality: ${data.dataQuality || '-'} | Source: aggregate JSON tersanitasi | Funnel rows: ${data.audit.funnelCount} | Sum funnel revenue: ${rp(data.audit.funnelRevenueSum)}${warnings}`;
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

async function loadEpisode(ep) {
  const data = await fetchJson(`${DATA_BASE}/episodes/${ep}.json`);
  renderEpisode(data);
}

async function init() {
  state.episodes = await fetchJson(`${DATA_BASE}/episodes.json`);
  els.episodeSelect.innerHTML = state.episodes.map(e => `<option value="${e.episode}">${e.label}</option>`).join('');
  const options = state.episodes.map(e => `<option value="${e.episode}">${e.label}</option>`).join('');
  els.baseEpisode.innerHTML = options;
  els.compareEpisode.innerHTML = options;
  els.baseEpisode.value = state.episodes.at(-2)?.episode || state.episodes[0]?.episode;
  els.compareEpisode.value = state.episodes.at(-1)?.episode || state.episodes[0]?.episode;
  els.episodeSelect.value = state.episodes.at(-1)?.episode || 40;
  state.cumulativeSelection = new Set(state.episodes.map(ep => ep.episode));
  renderCumulativeChips();
  renderCumulativeSummary();
  renderCompare();
  renderDeltaComparison();
  await loadEpisode(els.episodeSelect.value);
}

els.episodeSelect.addEventListener('change', (e) => loadEpisode(e.target.value));
els.search.addEventListener('input', (e) => { state.query = e.target.value; renderFunnel(); });
els.sortBy.addEventListener('change', (e) => { state.sortBy = e.target.value; renderFunnel(); });
els.baseEpisode.addEventListener('change', renderDeltaComparison);
els.compareEpisode.addEventListener('change', renderDeltaComparison);
els.cumulativeEpisodeChips.addEventListener('click', (event) => {
  const chip = event.target.closest('.episode-chip');
  if (!chip) return;
  toggleCumulativeEpisode(Number(chip.dataset.episode));
});
els.selectAllEpisodes.addEventListener('click', () => {
  state.cumulativeSelection = new Set(state.episodes.map(ep => ep.episode));
  renderCumulativeChips();
  renderCumulativeSummary();
});
els.clearEpisodes.addEventListener('click', () => {
  state.cumulativeSelection.clear();
  renderCumulativeChips();
  renderCumulativeSummary();
});

function setActiveNav(id) {
  els.navLinks.forEach(link => link.classList.toggle('active', link.dataset.section === id));
}

els.navLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const id = link.dataset.section;
    const target = document.getElementById(id);
    if (!target) return;
    const isTop = id === 'akumulasi';
    const offset = window.matchMedia('(max-width: 1120px)').matches ? 92 : 24;
    const top = isTop ? 0 : target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveNav(id);
    history.replaceState(null, '', `#${id}`);
  });
});

const sections = ['akumulasi', 'overview', 'kpi', 'progress', 'monitoring', 'funnel', 'compare', 'delta', 'audit']
  .map(id => document.getElementById(id))
  .filter(Boolean);

window.addEventListener('scroll', () => {
  if (window.scrollY < 120) return setActiveNav('akumulasi');
  const offset = window.matchMedia('(max-width: 1120px)').matches ? 112 : 48;
  let current = sections[0]?.id || 'overview';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= offset) current = section.id;
  }
  setActiveNav(current);
}, { passive: true });

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<pre style="padding:24px;color:#b91c1c">${err.stack || err.message}</pre>`;
});
