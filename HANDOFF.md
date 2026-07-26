# HANDOFF - Raihan KataUHA Dashboard v1

Last updated: 2026-07-27

## Goal

Build a local web dashboard for **Raihan KataUHA** that can select and compare episode reports. The dashboard must preserve the spreadsheet/JSON data as the source of truth and make legacy episode data usable even when earlier formats differ.

Current dashboard URL:

```text
http://localhost:5182
```

Project folder:

```text
C:\Users\AUROS\raihan-katauha-dashboard-v1
```

## Current Status

Implemented and verified:

- Local Node.js/static dashboard server.
- Episode selector.
- Episodes currently available: **31, 32, 33, 34, 35, 36, 37, 38, 39, 40**.
- KPI cards.
- Progress target section.
- Monitoring revenue chart.
- Funnel Performance table with search/sort.
- Akumulasi Total Custom section directly after the header and before Overview: selectable episode chips, Pilih Semua/Reset controls, mode status, and highlighted visual treatment. Its KPI cards explicitly use dark text on white cards for readability over the dark gradient background. It computes totals for selected episodes or all loaded episodes: episode count, revenue, paid, checkout, weighted avg infaq, ads spend + PPN, ads funnel revenue/ROAS, and tracked clicks.
- Overview section contains the single-episode selector; the header is title-only.
- Compare Episodes table.
- Episode Delta Comparison section with Base vs Compare selectors.
- Side menu for important sections with smooth scroll and active state.
- Data Audit section with data quality/warnings.
- KU37 legacy import from uploaded Excel workbook.
- KU37 monitoring revenue harian imported from the updated workbook.
- KU36 and KU35 legacy imports from the same updated workbook.
- KU34, KU33, KU32, and KU31 legacy imports from updated workbook `doc_210a019f6bda_Copy of Raihan KataUHA.xlsx`.

## Important Files

### Dashboard project

```text
C:\Users\AUROS\raihan-katauha-dashboard-v1\package.json
C:\Users\AUROS\raihan-katauha-dashboard-v1\api\server.mjs
C:\Users\AUROS\raihan-katauha-dashboard-v1\public\index.html
C:\Users\AUROS\raihan-katauha-dashboard-v1\public\styles.css
C:\Users\AUROS\raihan-katauha-dashboard-v1\public\app.js
C:\Users\AUROS\raihan-katauha-dashboard-v1\scripts\verify.mjs
C:\Users\AUROS\raihan-katauha-dashboard-v1\scripts\validate-sheets.mjs
C:\Users\AUROS\raihan-katauha-dashboard-v1\scripts\rebuild-ku38-daily-revenue.py
C:\Users\AUROS\raihan-katauha-dashboard-v1\scripts\import-ku37-legacy-xlsx.py
C:\Users\AUROS\raihan-katauha-dashboard-v1\scripts\import-legacy-xlsx.py
```

### Source data / generated JSON

```text
C:\Users\AUROS\reports\katauha31\katauha31_dashboard_updated.json
C:\Users\AUROS\reports\katauha31\katauha31_legacy_import_audit.json
C:\Users\AUROS\reports\katauha32\katauha32_dashboard_updated.json
C:\Users\AUROS\reports\katauha32\katauha32_legacy_import_audit.json
C:\Users\AUROS\reports\katauha33\katauha33_dashboard_updated.json
C:\Users\AUROS\reports\katauha33\katauha33_legacy_import_audit.json
C:\Users\AUROS\reports\katauha34\katauha34_dashboard_updated.json
C:\Users\AUROS\reports\katauha34\katauha34_legacy_import_audit.json
C:\Users\AUROS\reports\katauha35\katauha35_dashboard_updated.json
C:\Users\AUROS\reports\katauha35\katauha35_legacy_import_audit.json
C:\Users\AUROS\reports\katauha36\katauha36_dashboard_updated.json
C:\Users\AUROS\reports\katauha36\katauha36_legacy_import_audit.json
C:\Users\AUROS\reports\katauha37\katauha37_dashboard_updated.json
C:\Users\AUROS\reports\katauha37\katauha37_legacy_import_audit.json
C:\Users\AUROS\reports\katauha38\katauha38_dashboard_updated.json
C:\Users\AUROS\reports\katauha38\katauha38_daily_revenue_history.json
C:\Users\AUROS\reports\katauha39\katauha39_dashboard_updated.json
C:\Users\AUROS\reports\katauha40\katauha40_dashboard_updated.json
```

### Uploaded legacy workbook

```text
C:\Users\AUROS\AppData\Local\hermes\cache\documents\doc_210a019f6bda_Copy of Raihan KataUHA.xlsx
```

Workbook sheet list includes:

```text
RAIHAN KU1 ... RAIHAN KU37
```

Started legacy implementation from:

```text
RAIHAN KU37
```

because KU37 is the closest legacy format to the newer dashboard data.

## How to Run

From project folder:

```bash
cd C:/Users/AUROS/raihan-katauha-dashboard-v1
npm run dev
```

Default server:

```text
http://localhost:5182
```

If port 5182 is already in use on Windows/Git Bash:

```bash
netstat -ano | grep ':5182'
taskkill /F /PID <PID>
npm run dev
```

## Verification Commands

```bash
cd C:/Users/AUROS/raihan-katauha-dashboard-v1
node --check api/server.mjs
node --check public/app.js
npm run verify
```

Expected verify after KU37 import:

```json
{
  "ok": true,
  "episodes": [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  "latest": "KataUHA 40",
  "app": "raihan-katauha-dashboard-v1"
}
```

Validate spreadsheet-backed episodes 38-40:

```bash
npm run validate:sheets
```

Known-good output:

```json
{
  "ok": true,
  "report": [
    { "episode": 38, "checkedMetrics": 13, "mismatches": [] },
    { "episode": 39, "checkedMetrics": 13, "mismatches": [] },
    { "episode": 40, "checkedMetrics": 13, "mismatches": [] }
  ]
}
```

## Episode Data Notes

### KU38-KU40

Source is existing dashboard JSON generated by KataUHA updater and validated against Google Sheets.

JSON files:

```text
C:\Users\AUROS\reports\katauha38\katauha38_dashboard_updated.json
C:\Users\AUROS\reports\katauha39\katauha39_dashboard_updated.json
C:\Users\AUROS\reports\katauha40\katauha40_dashboard_updated.json
```

Spreadsheet IDs:

```text
KU38: 1-Zq2x7eB-ntcgIOCCD-AK0eGK-NoPAfeQxqic2iA4wM
KU39: 127eQRE828qVCNbL2k3iRDVaXcfldZ1iSZaAUd47AG8Q
KU40: 1wCZ7ehrO3jgZff7foStnoQBb6mUYTwvNmuQptsf6aSo
```

### KU38 daily revenue restoration

KU38 JSON originally only had one cumulative daily point after re-running updater. Daily revenue was rebuilt from Mayar transaction-level data into aggregate daily rows only; no participant/personal data is stored in the dashboard.

Rebuild script:

```text
scripts\rebuild-ku38-daily-revenue.py
```

Known-good rebuild result:

```json
{
  "daily_points": 41,
  "first": { "date": "2026-04-30", "revenue": 674039 },
  "last": { "date": "2026-06-09", "revenue": 16292192 },
  "history_sum": 100503533,
  "json_aggregate_revenue": 100503533,
  "matches_aggregate": true
}
```

### KU37 legacy import

Importer:

```text
scripts\import-ku37-legacy-xlsx.py
```

Source:

```text
Workbook: C:\Users\AUROS\AppData\Local\hermes\cache\documents\doc_210a019f6bda_Copy of Raihan KataUHA.xlsx
Sheet: RAIHAN KU37
```

Generated:

```text
C:\Users\AUROS\reports\katauha37\katauha37_dashboard_updated.json
C:\Users\AUROS\reports\katauha37\katauha37_legacy_import_audit.json
```

KU37 key values from import:

```json
{
  "revenue": 46174591,
  "paid": 2817,
  "checkout": 3424,
  "trackedClicks": 23657,
  "funnels": 10,
  "dailyRevenuePoints": 20,
  "dailyRevenueSum": 46353770,
  "dataQuality": "legacy-normalized-partial"
}
```

KU37 audit passed:

```json
{
  "ok": true,
  "summaryRevenue": 46174591,
  "sumFunnelRevenue": 46174591,
  "summaryPaid": 2817,
  "sumFunnelPaid": 2817,
  "summaryCheckout": 3424,
  "sumFunnelCheckout": 3424,
  "summaryClicks": 23657,
  "sumFunnelClicks": 23657,
  "adsSpend": 9776429,
  "adsPpn": 1075407.19,
  "adsSpendWithPpn": 10851836.19,
  "adsFunnelRevenue": 21504219,
  "sheetRoasNoPpn": 2.199598545,
  "computedRoasWithPpn": 1.9816,
  "dailyRevenuePoints": 20,
  "dailyRevenueSum": 46353770,
  "dailyRevenueVsSummaryDiff": 179179
}
```

KU37 warnings shown in Data Audit:

- Monitoring revenue harian tersedia dari sheet legacy dan dipakai untuk chart, tetapi format legacy tetap partial dibanding dashboard baru.
- Total monitoring revenue harian (46.353.770) berbeda dari summary/funnel revenue (46.174.591); KPI utama tetap memakai summary/funnel.
- Unique clicks, product IDs, and live source URLs are not available in the legacy format.
- Meta/campaign breakdown is not available; importer uses the summary spend/conversion/ROAS from the sheet.

### KU36 and KU35 legacy import

General importer:

```text
scripts\import-legacy-xlsx.py
```

Command used:

```bash
python scripts/import-legacy-xlsx.py 36 35
```

KU36 key values:

```json
{
  "revenue": 125222774,
  "paid": 7263,
  "checkout": 9134,
  "trackedClicks": 81338,
  "funnelRows": 14,
  "dailyRevenuePoints": 23,
  "dailyRevenueSum": 124909457,
  "dailyRevenueVsSummaryDiff": -313317,
  "auditOk": true
}
```

KU35 key values:

```json
{
  "revenue": 50138706,
  "paid": 2682,
  "checkout": 3304,
  "trackedClicks": 30729,
  "funnelRows": 10,
  "dailyRevenuePoints": 17,
  "dailyRevenueSum": 49898706,
  "dailyRevenueVsSummaryDiff": -240000,
  "auditOk": true
}
```

Both KU36 and KU35 have monitoring revenue harian available and imported for the chart. In both cases the monitoring total differs from summary/funnel totals, so the dashboard keeps summary/funnel as KPI source of truth and shows a Data Audit warning.

### KU34-KU31 legacy import

Command used:

```bash
python scripts/import-legacy-xlsx.py 34 33 32 31
```

Source workbook:

```text
C:\Users\AUROS\AppData\Local\hermes\cache\documents\doc_210a019f6bda_Copy of Raihan KataUHA.xlsx
```

Key values:

```json
[
  { "episode": 34, "revenue": 108115878, "paid": 6384, "checkout": 7984, "trackedClicks": 60832, "funnelRows": 21, "dailyRevenuePoints": 32, "dailyRevenueSum": 108550084, "auditOk": true },
  { "episode": 33, "revenue": 73932402, "paid": 4006, "checkout": 5008, "trackedClicks": 53794, "funnelRows": 13, "dailyRevenuePoints": 25, "dailyRevenueSum": 74276587, "auditOk": true },
  { "episode": 32, "revenue": 113231790, "paid": 6095, "checkout": 7674, "trackedClicks": 52750, "funnelRows": 14, "dailyRevenuePoints": 28, "dailyRevenueSum": 113740258, "auditOk": true },
  { "episode": 31, "revenue": 115587321, "paid": 4787, "checkout": 6388, "trackedClicks": 47331, "funnelRows": 10, "dailyRevenuePoints": 26, "dailyRevenueSum": 116101713, "auditOk": true }
]
```

Notes:

- KU34 has an extra legacy caveat: detail funnel link clicks sum to 76.929 while sheet summary clicks is 60.832. Dashboard KPI `Tracked Clicks` uses the sheet summary, while funnel rows preserve detailed row clicks.
- KU31-KU34 all have monitoring revenue harian imported for charts; monitoring totals differ from summary/funnel totals, so KPI utama stays on summary/funnel with Data Audit warnings.

## Server Implementation Notes

`api/server.mjs` currently has an `EPISODES` object hardcoded for 31-40. KU31-KU37 legacy episodes were added manually.

Important behavior:

- `/api/health` returns app status.
- `/api/episodes` returns episode summaries.
- `/api/episodes/:episode` returns normalized episode data.
- For legacy data, API returns:
  - `source: "Legacy normalized Raihan workbook"`
  - `dataQuality: "legacy-normalized-partial"`
  - `dataWarnings: [...]`
- For newer JSON data, API returns:
  - `source: "Existing KataUHA dashboard JSON"`
  - `dataQuality: "validated-json"`

Potential next improvement: move hardcoded `EPISODES` into a registry file:

```text
C:\Users\AUROS\raihan-katauha-dashboard-v1\data\episodes.json
```

so KU1-KU36 can be added without editing server code.

## UI Implementation Notes

Main UI files:

```text
public\index.html
public\styles.css
public\app.js
```

Sections:

- `#overview`
- `#kpi`
- `#progress`
- `#monitoring`
- `#funnel`
- `#compare`
- `#delta`
- `#audit`

Side menu anchors use smooth scroll and active state. On desktop the sidebar is sticky left; on tablet/mobile it becomes horizontal sticky navigation.

Delta comparison section:

- Base Episode selector
- Compare To selector
- Delta cards for main metrics
- Center-baseline delta bar chart
- Lama Promosi metric so evaluation is fair when promo durations differ
- Auto-generated insight line with duration context

Delta metrics:

- Revenue
- Peserta Bayar
- Checkout
- Avg Infaq
- Checkout -> Paid
- Ads Spend + PPN
- Ads Spend / Revenue
- ROAS Ads Funnel
- Lama Promosi

Rate metrics use `+/- poin`; nominal/count metrics use `+/- %`. Lama Promosi also uses point delta in days (`+/- poin`) and is visually neutral, not green/red, because it is comparison context rather than a performance win/loss.

## Known Limitations / Cautions

1. KU37 is imported from legacy Excel and is **partial** compared with KU38-KU40.
2. KU37 daily revenue chart now uses 20 daily points from the updated workbook; its monitoring total differs from summary/funnel by 179.179, so KPI utama tetap summary/funnel.
3. KU37 `sheetRoasNoPpn` differs from dashboard `computedRoasWithPpn` because newer dashboard convention uses spend + PPN for ROAS Ads Funnel.
4. Early episodes KU1-KU36 may have even less data; importers must mark data quality clearly.
5. Do not treat missing fields as zero without warning. Use `legacy-normalized-partial` or more specific quality labels.
6. Do not expose participant/customer-level Mayar data in dashboard JSON. Aggregate only.

## Recommended Next Steps

1. Generalize KU31-KU37 importer further for KU1-KU30.
2. Create `data/episodes.json` registry and update `api/server.mjs` to read registry instead of hardcoded episodes.
3. Inspect KU30 sheet next to see if it matches KU31-KU37 enough for same parser.
4. Add per-episode `dataQuality` badges visually near overview title.
5. Add a legacy import validation report page/section so user can see which metrics are available/missing per episode.
6. If needed, tunnel this dashboard with basic password like the Meta dashboard.

## If Continuing After /reset

Tell the agent:

```text
Baca C:\Users\AUROS\raihan-katauha-dashboard-v1\HANDOFF.md lalu lanjut import legacy KataUHA mulai KU36 atau generalize registry/importer.
```

Then verify current state with:

```bash
cd C:/Users/AUROS/raihan-katauha-dashboard-v1
npm run verify
curl -s http://localhost:5182/api/episodes/37
```
