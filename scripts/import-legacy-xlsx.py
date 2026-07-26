from __future__ import annotations

import argparse
import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

DEFAULT_SRC = Path(r'C:/Users/AUROS/AppData/Local/hermes/cache/documents/doc_210a019f6bda_Copy of Raihan KataUHA.xlsx')


def cell(ws, coord: str) -> Any:
    return ws[coord].value


def n(value: Any) -> float:
    if value is None or value == '':
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).replace('Rp', '').replace('%', '').replace(',', '').strip()
    if s in {'', '-', '–', '—'}:
        return 0.0
    return float(s or 0)


def iso_date(value: Any) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return str(value or '')[:10]


def pct(part: float, whole: float) -> float:
    return round((part / whole) * 100, 2) if whole else 0.0


def find_value_right_of_label(ws, label_text: str) -> Any:
    wanted = label_text.strip().lower()
    for row in range(1, ws.max_row + 1):
        for col in range(1, ws.max_column + 1):
            value = ws.cell(row, col).value
            if isinstance(value, str) and value.strip().lower() == wanted:
                return ws.cell(row, col + 1).value
    return None


def find_row_with_label(ws, label_text: str, col: int = 2) -> int | None:
    wanted = label_text.strip().lower()
    for row in range(1, ws.max_row + 1):
        value = ws.cell(row, col).value
        if isinstance(value, str) and value.strip().lower() == wanted:
            return row
    return None


def parse_daily_revenue(ws) -> list[dict[str, Any]]:
    start_heading = find_row_with_label(ws, 'Monitoring Revenue Harian', col=2)
    if not start_heading:
        return []
    start_row = start_heading + 2  # skip Tanggal/Jumlah header
    history: list[dict[str, Any]] = []
    for row in range(start_row, ws.max_row + 1):
        raw_date = ws.cell(row, 2).value
        amount = n(ws.cell(row, 3).value)
        if isinstance(raw_date, str) and raw_date.strip().lower() == 'grand total':
            break
        if not raw_date and not amount:
            if history:
                break
            continue
        if isinstance(raw_date, (datetime, date)):
            history.append({'date': iso_date(raw_date), 'revenue': int(round(amount))})
    return history


def title_case_episode(label: str, episode: int) -> str:
    return (label or f'KATAUHA {episode}').strip().title().replace('Katauha', 'KataUHA')


def parse_legacy_episode(src: Path, episode: int) -> tuple[dict[str, Any], dict[str, Any]]:
    sheet_name = f'RAIHAN KU{episode}'
    wb = load_workbook(src, data_only=True)
    if sheet_name not in wb.sheetnames:
        raise ValueError(f'Sheet not found: {sheet_name}')
    ws = wb[sheet_name]

    episode_label = title_case_episode(str(cell(ws, 'B2') or ''), episode)
    event_start = cell(ws, 'B3')
    event_title = str(cell(ws, 'B4') or '').strip()
    last_report_at = cell(ws, 'B5')

    revenue = int(round(n(cell(ws, 'C7'))))
    paid = int(round(n(cell(ws, 'C8'))))
    checkout = int(round(n(cell(ws, 'C9'))))
    unfinished = max(checkout - paid, 0)

    target_revenue = int(round(n(cell(ws, 'D7'))))
    target_paid = int(round(n(cell(ws, 'D8'))))
    target_checkout = int(round(n(cell(ws, 'D9'))))
    target_avg_infaq = int(round(n(cell(ws, 'D10'))))
    target_checkout_to_paid_pct = n(cell(ws, 'D11')) * 100 if n(cell(ws, 'D11')) <= 1 else n(cell(ws, 'D11'))

    meta_spend = n(cell(ws, 'G10'))
    meta_conversion = n(cell(ws, 'G11'))
    ppn = n(cell(ws, 'G12'))
    sheet_roas = n(cell(ws, 'G13'))
    spend_with_ppn = n(cell(ws, 'G15')) or (meta_spend + ppn)

    promo_end = iso_date(find_value_right_of_label(ws, 'Akhir Promosi'))
    promo_start = iso_date(find_value_right_of_label(ws, 'Start Promosi'))
    promo_days = int(round(n(find_value_right_of_label(ws, 'Total Waktu Promosi')) or n(find_value_right_of_label(ws, 'Promosi Berjalan')) or 0))

    total_row = find_row_with_label(ws, 'TOTAL', col=2)
    if not total_row:
        raise ValueError(f'TOTAL row not found in {sheet_name}')

    funnel_rows = []
    for row in range(18, total_row):
        name = cell(ws, f'B{row}')
        if not name:
            continue
        product_name = str(name).strip()
        link_clicks = int(round(n(cell(ws, f'C{row}'))))
        row_checkout = int(round(n(cell(ws, f'G{row}'))))
        row_paid = int(round(n(cell(ws, f'H{row}'))))
        row_unfinished = int(round(n(cell(ws, f'I{row}'))))
        row_revenue = int(round(n(cell(ws, f'J{row}'))))
        if not any([link_clicks, row_checkout, row_paid, row_unfinished, row_revenue]):
            continue
        suffix = re.sub(rf'#?\s*katauha\s*{episode}', '', product_name, flags=re.I).strip(' -').lower() or 'main'
        click_source = 'Meta/TikTok Ads' if re.search(r'ads|meta|tiktok', product_name, flags=re.I) else 'legacy manual'
        funnel_rows.append({
            'suffix': suffix,
            'productName': product_name,
            'productId': '',
            'viewsYear': 0,
            'viewsMonth': 0,
            'checkout': row_checkout,
            'paid': row_paid,
            'unfinished': row_unfinished,
            'revenue': row_revenue,
            'avgInfaq': round(row_revenue / row_paid, 2) if row_paid else 0,
            'checkoutToPaidPct': pct(row_paid, row_checkout),
            'viewToCheckoutPct': 0,
            'viewToPaidPct': 0,
            'firstTransactionDate': '',
            'sidLinks': '',
            'linkClicks': link_clicks,
            'uniqueClicks': 0,
            'clickSource': click_source,
            'clickToCheckoutPct': pct(row_checkout, link_clicks),
            'clickToPaidPct': pct(row_paid, link_clicks),
            'recommendation': 'Legacy import - cek detail source jika perlu audit lanjutan',
        })

    row_link_clicks = sum(r['linkClicks'] for r in funnel_rows)
    summary_clicks = int(round(n(cell(ws, f'C{total_row}'))))
    sid_total_clicks = summary_clicks or row_link_clicks
    ads_funnel_revenue = int(round(meta_conversion))
    roas_ads_funnel_with_ppn = round(ads_funnel_revenue / spend_with_ppn, 4) if spend_with_ppn else 0

    daily_revenue_history = parse_daily_revenue(ws)
    daily_fallback = False
    if not daily_revenue_history:
        daily_fallback = True
        daily_revenue_history = [{'date': promo_end or iso_date(last_report_at), 'revenue': revenue}]
    daily_revenue_sum = sum(r['revenue'] for r in daily_revenue_history)

    warnings = []
    if daily_fallback:
        warnings.append(f'Monitoring revenue harian tidak tersedia lengkap di sheet {sheet_name}; dashboard memakai satu titik cumulative revenue.')
    else:
        warnings.append('Monitoring revenue harian tersedia dari sheet legacy; angka dipakai untuk chart, tetapi format legacy tetap partial dibanding dashboard baru.')
    warnings.extend([
        'Unique clicks, product IDs, and live source URLs tidak tersedia di format legacy.',
        'Meta/campaign breakdown tidak tersedia; memakai summary spend/conversion/ROAS dari sheet.',
    ])
    if daily_revenue_sum and round(daily_revenue_sum) != round(revenue):
        warnings.append(
            f'Total monitoring revenue harian ({daily_revenue_sum}) berbeda dari summary/funnel revenue ({revenue}); dashboard mempertahankan summary/funnel sebagai KPI utama.'
        )
    if summary_clicks and round(row_link_clicks) != round(summary_clicks):
        warnings.append(
            f'Total link click detail funnel ({row_link_clicks}) berbeda dari summary sheet ({summary_clicks}); KPI tracked clicks memakai summary sheet.'
        )

    out = {
        'episode': episode,
        'episodeLabel': f'KataUHA {episode}',
        'eventTitle': event_title,
        'eventStart': iso_date(event_start),
        'promo_start': promo_start,
        'promo_end': promo_end,
        'promo_days': promo_days,
        'aggregate': {
            'viewsYear': 0,
            'viewsMonth': 0,
            'checkout': checkout,
            'paid': paid,
            'unfinished': unfinished,
            'revenue': revenue,
        },
        'kpi_targets': {
            'targetRevenue': target_revenue,
            'targetPaid': target_paid,
            'targetCheckout': target_checkout,
            'targetAvgInfaq': target_avg_infaq,
            'targetCheckoutToPaidPct': round(target_checkout_to_paid_pct, 2),
        },
        'daily_revenue_history': daily_revenue_history,
        'sid_total_clicks': sid_total_clicks,
        'sid_total_unique': 0,
        'meta_summary': {
            'spend': meta_spend,
            'ppn': ppn,
            'spendWithPpn': spend_with_ppn,
            'metaRevenue': meta_conversion,
            'metaRoas': sheet_roas,
            'adsFunnelRevenue': ads_funnel_revenue,
            'roasAdsFunnelWithPpn': roas_ads_funnel_with_ppn,
            'campaignCount': 0,
        },
        'funnel_rows': sorted(funnel_rows, key=lambda r: r['revenue'], reverse=True),
        'legacy_source': {
            'workbook': str(src),
            'sheet': sheet_name,
            'episodeLabelFromSheet': episode_label,
            'lastReportAt': last_report_at.isoformat() if isinstance(last_report_at, datetime) else str(last_report_at),
            'dataQuality': 'legacy-normalized-partial',
            'warnings': warnings,
        },
    }

    audit = {
        'ok': True,
        'episode': episode,
        'sourceSheet': sheet_name,
        'checks': {
            'summaryRevenue': revenue,
            'sumFunnelRevenue': sum(r['revenue'] for r in funnel_rows),
            'summaryPaid': paid,
            'sumFunnelPaid': sum(r['paid'] for r in funnel_rows),
            'summaryCheckout': checkout,
            'sumFunnelCheckout': sum(r['checkout'] for r in funnel_rows),
            'summaryClicks': summary_clicks,
            'sumFunnelClicks': row_link_clicks,
            'adsSpend': meta_spend,
            'adsPpn': ppn,
            'adsSpendWithPpn': spend_with_ppn,
            'adsFunnelRevenue': ads_funnel_revenue,
            'sheetRoasNoPpn': sheet_roas,
            'computedRoasWithPpn': roas_ads_funnel_with_ppn,
            'dailyRevenuePoints': len(daily_revenue_history),
            'dailyRevenueSum': daily_revenue_sum,
            'dailyRevenueVsSummaryDiff': daily_revenue_sum - revenue,
        },
        'warnings': warnings,
    }
    for a, b in [('summaryRevenue', 'sumFunnelRevenue'), ('summaryPaid', 'sumFunnelPaid'), ('summaryCheckout', 'sumFunnelCheckout')]:
        if round(audit['checks'][a]) != round(audit['checks'][b]):
            audit['ok'] = False
            audit.setdefault('mismatches', []).append({'left': a, 'right': b, 'values': [audit['checks'][a], audit['checks'][b]]})

    return out, audit


def write_episode(src: Path, episode: int) -> dict[str, Any]:
    out, audit = parse_legacy_episode(src, episode)
    out_dir = Path(f'C:/Users/AUROS/reports/katauha{episode}')
    out_dir.mkdir(parents=True, exist_ok=True)
    out_json = out_dir / f'katauha{episode}_dashboard_updated.json'
    audit_json = out_dir / f'katauha{episode}_legacy_import_audit.json'
    out_json.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    audit_json.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf-8')
    return {'ok': audit['ok'], 'json': str(out_json), 'audit': str(audit_json), **audit['checks'], 'warnings': audit['warnings']}


def main() -> int:
    parser = argparse.ArgumentParser(description='Import Raihan KataUHA legacy workbook episodes into normalized dashboard JSON.')
    parser.add_argument('episodes', nargs='+', type=int, help='Episode numbers, e.g. 35 36 37')
    parser.add_argument('--src', type=Path, default=DEFAULT_SRC)
    args = parser.parse_args()

    results = [write_episode(args.src, ep) for ep in args.episodes]
    print(json.dumps({'ok': all(r['ok'] for r in results), 'results': results}, ensure_ascii=False, indent=2))
    return 0 if all(r['ok'] for r in results) else 1


if __name__ == '__main__':
    raise SystemExit(main())
