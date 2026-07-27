#!/usr/bin/env python
"""Export sanitized Raihan KataUHA dashboard JSON for static hosting.

Source of truth remains the local normalized reports under C:/Users/AUROS/reports.
This script writes API-shaped, aggregate-only JSON to public/data so Netlify can
serve the dashboard without access to local Windows paths.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = ROOT / "public" / "data"
PUBLIC_EPISODES = PUBLIC_DATA / "episodes"

EPISODES: dict[int, dict[str, Any]] = {
    31: {"label": "KataUHA 31", "shortLabel": "KU31", "title": "Dimana Tuhan Saat Aku Jatuh", "eventStart": "2025-11-18", "spreadsheetId": "", "spreadsheetUrl": ""},
    32: {"label": "KataUHA 32", "shortLabel": "KU32", "title": "Life After Break Up", "eventStart": "2025-12-09", "spreadsheetId": "", "spreadsheetUrl": ""},
    33: {"label": "KataUHA 33", "shortLabel": "KU33", "title": "Why Do I Feel Empty", "eventStart": "2026-01-20", "spreadsheetId": "", "spreadsheetUrl": ""},
    34: {"label": "KataUHA 34", "shortLabel": "KU34", "title": "Manifesting: Karir, Cinta, Rezeki", "eventStart": "2026-02-24", "spreadsheetId": "", "spreadsheetUrl": ""},
    35: {"label": "KataUHA 35", "shortLabel": "KU35", "title": "Memaafkan, Tapi Bukan Melupakan", "eventStart": "2026-03-13", "spreadsheetId": "", "spreadsheetUrl": ""},
    36: {"label": "KataUHA 36", "shortLabel": "KU36", "title": "Ngga Nikah, Gapapa Kan?", "eventStart": "2026-04-14", "spreadsheetId": "", "spreadsheetUrl": ""},
    37: {"label": "KataUHA 37", "shortLabel": "KU37", "title": "Memantaskan Diri atau Mencari yang Pasti?", "eventStart": "Tuesday, 28 April 2026", "spreadsheetId": "", "spreadsheetUrl": ""},
    38: {"label": "KataUHA 38", "shortLabel": "KU38", "title": "Ya Allah, Ini Arahnya Kemana Ya?", "eventStart": "Tuesday, 09 June 2026", "spreadsheetId": "1-Zq2x7eB-ntcgIOCCD-AK0eGK-NoPAfeQxqic2iA4wM", "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1-Zq2x7eB-ntcgIOCCD-AK0eGK-NoPAfeQxqic2iA4wM/edit"},
    39: {"label": "KataUHA 39", "shortLabel": "KU39", "title": "Overthinking: Jodoh, Karir, Takdir", "eventStart": "Tuesday, 14 July 2026", "spreadsheetId": "127eQRE828qVCNbL2k3iRDVaXcfldZ1iSZaAUd47AG8Q", "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/127eQRE828qVCNbL2k3iRDVaXcfldZ1iSZaAUd47AG8Q/edit"},
    40: {"label": "KataUHA 40", "shortLabel": "KU40", "title": "Udah Nggak Kuat, Boleh Nyerah?", "eventStart": "Tuesday, 04 August 2026", "spreadsheetId": "1wCZ7ehrO3jgZff7foStnoQBb6mUYTwvNmuQptsf6aSo", "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1wCZ7ehrO3jgZff7foStnoQBb6mUYTwvNmuQptsf6aSo/edit"},
}


def round_num(n: Any, d: int = 2) -> float:
    try:
        return round(float(n or 0), d)
    except Exception:
        return 0.0


def sum_rows(rows: list[dict[str, Any]], key: str) -> float:
    return sum(float(r.get(key) or 0) for r in rows)


def report_path(ep: int) -> Path:
    return Path(f"C:/Users/AUROS/reports/katauha{ep}/katauha{ep}_dashboard_updated.json")


def safe_warning(w: Any) -> str:
    text = str(w or "")
    text = text.replace("C:\\Users\\AUROS", "[local-path]").replace("C:/Users/AUROS", "[local-path]")
    return text


def sanitize_funnel_row(r: dict[str, Any]) -> dict[str, Any]:
    # Aggregate-only. Keep product/link labels and aggregate metrics; remove Mayar product IDs.
    return {
        "suffix": r.get("suffix") or "",
        "productName": r.get("productName") or "",
        "revenue": float(r.get("revenue") or 0),
        "paid": int(round(float(r.get("paid") or 0))),
        "checkout": int(round(float(r.get("checkout") or 0))),
        "unfinished": int(round(float(r.get("unfinished") or 0))),
        "avgInfaq": float(r.get("avgInfaq") or 0),
        "checkoutToPaidPct": round_num(r.get("checkoutToPaidPct")),
        "linkClicks": int(round(float(r.get("linkClicks") or 0))),
        "uniqueClicks": int(round(float(r.get("uniqueClicks") or 0))),
        "clickSource": r.get("clickSource") or "",
        "clickToPaidPct": round_num(r.get("clickToPaidPct")),
        "recommendation": r.get("recommendation") or "",
    }


def build_episode(ep: int) -> dict[str, Any]:
    meta = {"episode": ep, **EPISODES[ep]}
    p = report_path(ep)
    raw = json.loads(p.read_text(encoding="utf-8"))
    aggregate = raw.get("aggregate") or {}
    meta_summary = raw.get("meta_summary") or {}
    targets = raw.get("kpi_targets") or {}
    kpi = {
        "revenue": float(aggregate.get("revenue") or 0),
        "paid": int(round(float(aggregate.get("paid") or 0))),
        "checkout": int(round(float(aggregate.get("checkout") or 0))),
        "unfinished": int(round(float(aggregate.get("unfinished") or 0))),
        "avgInfaq": round_num((float(aggregate.get("revenue") or 0) / float(aggregate.get("paid") or 1)) if aggregate.get("paid") else 0, 0),
        "checkoutToPaidPct": round_num((float(aggregate.get("paid") or 0) / float(aggregate.get("checkout") or 1)) * 100 if aggregate.get("checkout") else 0),
        "trackedClicks": int(round(float(raw.get("sid_total_clicks") or 0))),
        "trackedUniqueClicks": int(round(float(raw.get("sid_total_unique") or 0))),
        "adsFunnelRevenue": float(meta_summary.get("adsFunnelRevenue") or 0),
        "adsSpend": float(meta_summary.get("spend") or 0),
        "adsPpn": float(meta_summary.get("ppn") or 0),
        "adsSpendWithPpn": float(meta_summary.get("spendWithPpn") or 0),
        "adsSpendToRevenuePct": round_num((float(meta_summary.get("spendWithPpn") or 0) / float(aggregate.get("revenue") or 1)) * 100 if aggregate.get("revenue") else 0),
        "roasAdsFunnelWithPpn": round_num(meta_summary.get("roasAdsFunnelWithPpn")),
        "metaRevenue": float(meta_summary.get("metaRevenue") or 0),
        "metaRoas": round_num(meta_summary.get("metaRoas")),
    }
    funnel_rows = [sanitize_funnel_row(r) for r in raw.get("funnel_rows", [])]
    funnel_rows.sort(key=lambda r: r["revenue"], reverse=True)
    daily_revenue = sorted(
        [{"date": r.get("date"), "revenue": float(r.get("revenue") or 0)} for r in raw.get("daily_revenue_history", [])],
        key=lambda r: str(r.get("date") or ""),
    )
    legacy = raw.get("legacy_source") or {}
    data_quality = legacy.get("dataQuality") or "validated-json"
    data_warnings = [safe_warning(w) for w in legacy.get("warnings", [])]
    return {
        **meta,
        "jsonModifiedAt": datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).isoformat().replace("+00:00", "Z"),
        "promoStart": raw.get("promo_start") or "",
        "promoDays": int(round(float(raw.get("promo_days") or 0))),
        "title": raw.get("eventTitle") or meta["title"],
        "eventStart": raw.get("eventStart") or meta["eventStart"],
        "source": "Legacy normalized Raihan workbook" if legacy else "Existing KataUHA dashboard JSON",
        "dataQuality": data_quality,
        "dataWarnings": data_warnings,
        "kpiTargets": targets,
        "kpi": kpi,
        "aggregate": {k: aggregate.get(k) for k in ["revenue", "paid", "checkout", "unfinished"]},
        "metaSummary": {k: meta_summary.get(k) for k in ["spend", "ppn", "spendWithPpn", "metaRevenue", "metaRoas", "adsFunnelRevenue", "roasAdsFunnelWithPpn", "campaignCount"]},
        "funnelRows": funnel_rows,
        "dailyRevenue": daily_revenue,
        "audit": {
            "funnelCount": len(funnel_rows),
            "funnelRevenueSum": sum_rows(funnel_rows, "revenue"),
            "funnelPaidSum": sum_rows(funnel_rows, "paid"),
            "funnelCheckoutSum": sum_rows(funnel_rows, "checkout"),
        },
    }


def main() -> int:
    PUBLIC_EPISODES.mkdir(parents=True, exist_ok=True)
    rows = []
    for ep in sorted(EPISODES):
        episode_data = build_episode(ep)
        (PUBLIC_EPISODES / f"{ep}.json").write_text(json.dumps(episode_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        rows.append({
            k: episode_data[k]
            for k in ["episode", "label", "shortLabel", "title", "eventStart", "promoStart", "promoDays", "jsonModifiedAt", "kpi", "spreadsheetUrl"]
        })
    (PUBLIC_DATA / "episodes.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Synced {len(rows)} sanitized episodes to {PUBLIC_DATA.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
