import './material-web.bundle.js';

const DATA_BASE = '/data';
const state = { episodes: [], current: null, query: '', sortBy: 'revenue', cumulativeSelection: new Set(), cumulativeYear: 'all', benchmarkMetric: 'revenue', benchmarkYear: 'all', benchmarkShowAll: false, trendMetric: 'revenue' };

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
  cumulativeYearFilter: document.querySelector('#cumulativeYearFilter'),
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
  benchmarkMetric: document.querySelector('#benchmarkMetric'),
  benchmarkYear: document.querySelector('#benchmarkYear'),
  benchmarkSummary: document.querySelector('#benchmarkSummary'),
  benchmarkTrends: document.querySelector('#benchmarkTrends'),
  benchmarkNote: document.querySelector('#benchmarkNote'),
  benchmarkToggle: document.querySelector('#benchmarkToggle'),
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
const selectOption = (value, label, selected = false) => `<md-select-option ${selected ? 'selected' : ''} value="${value}"><div slot="headline">${label}</div></md-select-option>`;
const episodeYear = (ep) => {
  const raw = ep?.eventStart || ep?.jsonModifiedAt || '';
  const match = String(raw).match(/20\d{2}/);
  return match ? match[0] : 'Tanpa Tahun';
};

function kpiCard(label, value, note) {
  return `<div class="kpi"><span>${label}</span><strong>${value}</strong><small>${note || ''}</small></div>`;
}

function filteredCumulativeEpisodes() {
  if (state.cumulativeYear === 'all') return state.episodes;
  return state.episodes.filter(ep => episodeYear(ep) === state.cumulativeYear);
}

function selectedCumulativeEpisodes() {
  const candidates = filteredCumulativeEpisodes();
  const selected = candidates.filter(ep => state.cumulativeSelection.has(ep.episode));
  return selected.length ? selected : candidates;
}

function renderCumulativeYearFilter() {
  const years = [...new Set(state.episodes.map(episodeYear))].sort();
  els.cumulativeYearFilter.innerHTML = [
    selectOption('all', 'Semua Tahun', state.cumulativeYear === 'all'),
    ...years.map(year => selectOption(year, year, state.cumulativeYear === year))
  ].join('');
  els.cumulativeYearFilter.value = state.cumulativeYear;
}

function sumEpisodes(rows, key) {
  return rows.reduce((total, ep) => total + (Number(ep.kpi?.[key]) || 0), 0);
}

function renderCumulativeChips() {
  const episodes = filteredCumulativeEpisodes();
  els.cumulativeEpisodeChips.innerHTML = episodes.map(ep => {
    const active = state.cumulativeSelection.has(ep.episode);
    return `<button type="button" class="episode-chip ${active ? 'active' : ''}" data-episode="${ep.episode}">
      <strong>${ep.shortLabel}</strong><span>${episodeYear(ep)} • ${shortDate(ep.eventStart)}</span>
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
  const candidates = filteredCumulativeEpisodes();
  const isAll = rows.length === candidates.length;
  const yearLabel = state.cumulativeYear === 'all' ? 'Semua tahun' : `Tahun ${state.cumulativeYear}`;
  els.cumulativeStatus.textContent = isAll
    ? `Mode: ${yearLabel} (${first} - ${last})`
    : `Mode: ${yearLabel}, custom ${rows.length} episode terpilih (${rows.map(ep => ep.shortLabel).join(', ')})`;
  els.cumulativeSummary.innerHTML = [
    kpiCard('Total Episode', num(rows.length), isAll ? `${yearLabel}: ${first} - ${last}` : 'Custom selection'),
    kpiCard('Total Revenue', rp(totalRevenue), isAll ? `Akumulasi ${yearLabel.toLowerCase()}` : 'Akumulasi episode terpilih'),
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

const benchmarkMetrics = {
  revenue: { label: 'Revenue', format: rp, higherIsBetter: true },
  paid: { label: 'Peserta Bayar', format: num, higherIsBetter: true },
  checkout: { label: 'Checkout', format: num, higherIsBetter: true },
  checkoutToPaidPct: { label: 'Checkout -> Paid', format: pct, higherIsBetter: true },
  roasAdsFunnelWithPpn: { label: 'ROAS Ads Funnel', format: x, higherIsBetter: true },
  adsSpendToRevenuePct: { label: 'Ads Spend / Revenue', format: pct, higherIsBetter: false }
};

function benchmarkRows() {
  if (state.benchmarkYear === 'all') return state.episodes;
  return state.episodes.filter(ep => episodeYear(ep) === state.benchmarkYear);
}

function renderBenchmarkYearFilter() {
  const years = [...new Set(state.episodes.map(episodeYear))].sort();
  els.benchmarkYear.innerHTML = [
    selectOption('all', 'Semua Tahun', state.benchmarkYear === 'all'),
    ...years.map(year => selectOption(year, year, state.benchmarkYear === year))
  ].join('');
  els.benchmarkYear.value = state.benchmarkYear;
}

function bestEpisode(rows, metricKey, higherIsBetter = true) {
  return [...rows].sort((a, b) => {
    const av = Number(a.kpi?.[metricKey]) || 0;
    const bv = Number(b.kpi?.[metricKey]) || 0;
    return higherIsBetter ? bv - av : av - bv;
  })[0];
}

function benchmarkCard(label, ep, metricKey, note) {
  const metric = benchmarkMetrics[metricKey];
  if (!ep) return `<div class="benchmark-card"><span>${label}</span><strong>-</strong><small>Data belum tersedia</small></div>`;
  return `<div class="benchmark-card">
    <span>${label}</span>
    <strong>${metric.format(ep.kpi?.[metricKey])}</strong>
    <small>${ep.shortLabel} - ${ep.title}${note ? `<br>${note}` : ''}</small>
  </div>`;
}

function renderBenchmarkSummary(rows) {
  const latest = rows.at(-1);
  els.benchmarkSummary.innerHTML = [
    benchmarkCard('Best Revenue', bestEpisode(rows, 'revenue'), 'revenue'),
    benchmarkCard('Best ROAS', bestEpisode(rows, 'roasAdsFunnelWithPpn'), 'roasAdsFunnelWithPpn'),
    benchmarkCard('Best Conversion', bestEpisode(rows, 'checkoutToPaidPct'), 'checkoutToPaidPct'),
    benchmarkCard('Episode Terbaru', latest, state.benchmarkMetric, benchmarkMetrics[state.benchmarkMetric].label)
  ].join('');
}

function compactValue(n, formatter) {
  const value = Number(n) || 0;
  if (formatter === rp) return `Rp${(value / 1000000).toFixed(value >= 100000000 ? 0 : 1).replace('.', ',')}jt`;
  if (formatter === num && value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.', ',')}rb`;
  return formatter(value);
}

function trendPath(points) {
  return points.map((p, index) => `${index ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.lineY.toFixed(2)}`).join(' ');
}

function miniTrend(metricKey, label, formatter) {
  const rows = benchmarkRows();
  if (!rows.length) return '';
  const values = rows.map(ep => Number(ep.kpi?.[metricKey]) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const higherIsBetter = metricKey !== 'adsSpendToRevenuePct';
  const best = bestEpisode(rows, metricKey, higherIsBetter);
  const latest = rows.at(-1);
  const firstValue = values[0] || 0;
  const latestValue = Number(latest?.kpi?.[metricKey]) || 0;
  const change = firstValue ? ((latestValue - firstValue) / firstValue) * 100 : 0;
  const changeClass = Math.abs(change) < 0.01 ? 'flat' : ((higherIsBetter ? change > 0 : change < 0) ? 'good' : 'bad');
  const svgWidth = Math.max(420, rows.length * 48);
  const chart = { left: 14, right: svgWidth - 14, top: 18, bottom: 80 };
  const band = (chart.right - chart.left) / rows.length;
  const barWidth = Math.min(24, band * 0.56);
  const points = rows.map((ep, index) => {
    const value = Number(ep.kpi?.[metricKey]) || 0;
    const x = chart.left + band * index + band / 2;
    const barHeight = Math.max(((value - min) / range) * (chart.bottom - chart.top), 4);
    const y = chart.bottom - barHeight;
    return { ep, value, x, y, lineY: y - 4, barHeight };
  });
  const bars = points.map(p => {
    const featured = p.ep.episode === latest?.episode || p.ep.episode === best?.episode;
    return `<g class="combo-bar-group ${featured ? 'featured' : ''}">
      <rect class="combo-bar" x="${(p.x - barWidth / 2).toFixed(2)}" y="${p.y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${p.barHeight.toFixed(2)}" rx="3"></rect>
      <title>${p.ep.shortLabel}: ${formatter(p.value)}</title>
    </g>`;
  }).join('');
  const valueLabels = points.map(p => {
    const featured = p.ep.episode === latest?.episode || p.ep.episode === best?.episode;
    return `<text class="combo-value ${featured ? 'featured' : ''}" x="${p.x.toFixed(2)}" y="${Math.max(9, p.y - 11).toFixed(2)}">${compactValue(p.value, formatter)}</text>`;
  }).join('');
  const lineDots = points.map(p => `<g class="combo-dot-group">
    <circle class="combo-dot" cx="${p.x.toFixed(2)}" cy="${p.lineY.toFixed(2)}" r="2.1"></circle>
    <title>${p.ep.shortLabel} trend: ${formatter(p.value)}</title>
  </g>`).join('');
  const axisLabels = points.map(p => `<text class="combo-axis-label" x="${p.x.toFixed(2)}" y="94">${p.ep.shortLabel}</text>`).join('');
  return `<article class="trend-card combo-trend">
    <div class="trend-head">
      <span>${label}</span>
      <strong>${formatter(latestValue)}</strong>
      <small>Latest ${latest?.shortLabel || '-'} · Best ${best?.shortLabel || '-'}</small>
    </div>
    <div class="trend-change ${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(1).replace('.', ',')}%</div>
    <div class="combo-chart-scroll" aria-label="Scroll horizontal chart episode">
    <svg class="combo-chart" style="min-width:${svgWidth}px" viewBox="0 0 ${svgWidth} 100" preserveAspectRatio="xMidYMid meet" aria-label="Bar chart dan trend line ${label} antar episode">
      <path class="combo-grid" d="M 14 18 H ${chart.right} M 14 49 H ${chart.right} M 14 80 H ${chart.right}"></path>
      ${bars}
      <path class="combo-line" d="${trendPath(points)}"></path>
      ${lineDots}
      ${valueLabels}
      <path class="combo-axis" d="M 14 80 H ${chart.right}"></path>
      ${axisLabels}
    </svg>
    </div>
  </article>`;
}

function renderBenchmarkTrends() {
  const tabs = [
    { key: 'revenue', label: 'Revenue', format: rp },
    { key: 'paid', label: 'Peserta Bayar', format: num },
    { key: 'roasAdsFunnelWithPpn', label: 'ROAS', format: x }
  ];
  const active = tabs.find(tab => tab.key === state.trendMetric) || tabs[0];
  els.benchmarkTrends.innerHTML = `<div class="trend-tabs" role="tablist" aria-label="Pilih trend benchmark">
    ${tabs.map(tab => `<button type="button" role="tab" class="trend-tab ${tab.key === active.key ? 'active' : ''}" data-trend-metric="${tab.key}">${tab.label}</button>`).join('')}
  </div>
  ${miniTrend(active.key, `Trend ${active.label}`, active.format)}`;
}

function renderCompare() {
  const rows = benchmarkRows();
  const metric = benchmarkMetrics[state.benchmarkMetric];
  const sorted = [...rows].sort((a, b) => {
    const av = Number(a.kpi?.[state.benchmarkMetric]) || 0;
    const bv = Number(b.kpi?.[state.benchmarkMetric]) || 0;
    return metric.higherIsBetter ? bv - av : av - bv;
  });
  const visible = state.benchmarkShowAll ? sorted : sorted.slice(0, 5);
  renderBenchmarkSummary(rows);
  renderBenchmarkTrends();
  els.compareBody.innerHTML = visible.map((ep, index) => `<tr>
    <td><strong>#${index + 1}</strong><br><small>${metric.label}</small></td>
    <td><strong>${ep.label}</strong><br><small>${ep.title}</small></td>
    <td>${rp(ep.kpi.revenue)}</td>
    <td>${num(ep.kpi.paid)}</td>
    <td>${num(ep.kpi.checkout)}</td>
    <td>${pct(ep.kpi.checkoutToPaidPct)}</td>
    <td>${x(ep.kpi.roasAdsFunnelWithPpn)}</td>
    <td>${pct(ep.kpi.adsSpendToRevenuePct)}</td>
  </tr>`).join('') || '<tr><td colspan="8">Tidak ada episode sesuai filter.</td></tr>';
  els.benchmarkNote.textContent = `Menampilkan ${visible.length} dari ${sorted.length} episode, urut berdasarkan ${metric.label}${state.benchmarkYear === 'all' ? '' : ` tahun ${state.benchmarkYear}`}.`;
  els.benchmarkToggle.textContent = state.benchmarkShowAll ? 'Ringkas ke Top 5' : 'Tampilkan semua';
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
  const selectedEpisode = state.episodes.at(-1)?.episode || 40;
  els.episodeSelect.innerHTML = state.episodes.map(e => selectOption(e.episode, e.label, String(e.episode) === String(selectedEpisode))).join('');
  const baseValue = state.episodes.at(-2)?.episode || state.episodes[0]?.episode;
  const compareValue = state.episodes.at(-1)?.episode || state.episodes[0]?.episode;
  const options = (selected) => state.episodes.map(e => selectOption(e.episode, e.label, String(e.episode) === String(selected))).join('');
  els.baseEpisode.innerHTML = options(baseValue);
  els.compareEpisode.innerHTML = options(compareValue);
  els.baseEpisode.value = baseValue;
  els.compareEpisode.value = compareValue;
  els.episodeSelect.value = selectedEpisode;
  state.cumulativeSelection = new Set(state.episodes.map(ep => ep.episode));
  renderCumulativeYearFilter();
  renderBenchmarkYearFilter();
  renderCumulativeChips();
  renderCumulativeSummary();
  renderCompare();
  renderDeltaComparison();
  await loadEpisode(selectedEpisode);
}

els.episodeSelect.addEventListener('change', (e) => loadEpisode(e.target.value));
els.search.addEventListener('input', (e) => { state.query = e.target.value; renderFunnel(); });
els.sortBy.addEventListener('change', (e) => { state.sortBy = e.target.value; renderFunnel(); });
els.benchmarkMetric.addEventListener('change', (e) => { state.benchmarkMetric = e.target.value; renderCompare(); });
els.benchmarkYear.addEventListener('change', (e) => { state.benchmarkYear = e.target.value; state.benchmarkShowAll = false; renderCompare(); });
els.benchmarkToggle.addEventListener('click', () => { state.benchmarkShowAll = !state.benchmarkShowAll; renderCompare(); });
els.benchmarkTrends.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-trend-metric]');
  if (!tab) return;
  state.trendMetric = tab.dataset.trendMetric;
  renderBenchmarkTrends();
});
els.baseEpisode.addEventListener('change', renderDeltaComparison);
els.compareEpisode.addEventListener('change', renderDeltaComparison);
els.cumulativeEpisodeChips.addEventListener('click', (event) => {
  const chip = event.target.closest('.episode-chip');
  if (!chip) return;
  toggleCumulativeEpisode(Number(chip.dataset.episode));
});
els.cumulativeYearFilter.addEventListener('change', (event) => {
  state.cumulativeYear = event.target.value;
  state.cumulativeSelection = new Set(filteredCumulativeEpisodes().map(ep => ep.episode));
  renderCumulativeChips();
  renderCumulativeSummary();
});
els.selectAllEpisodes.addEventListener('click', () => {
  state.cumulativeSelection = new Set(filteredCumulativeEpisodes().map(ep => ep.episode));
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
