import json
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, 'C:/Users/AUROS/AppData/Local/hermes/scripts')
import mayar_client as mc  # type: ignore

TZ = ZoneInfo('Asia/Jakarta')
EP = 38
json_path = Path(f'C:/Users/AUROS/reports/katauha{EP}/katauha{EP}_dashboard_updated.json')
history_path = Path(f'C:/Users/AUROS/reports/katauha{EP}/katauha{EP}_daily_revenue_history.json')
data = json.loads(json_path.read_text(encoding='utf-8'))
product_ids = [(r.get('productId'), r.get('productName')) for r in data.get('funnel_rows', []) if r.get('productId')]
seen = set()
by_date = defaultdict(float)
status_counts = defaultdict(int)
product_counts = defaultdict(int)
page_size = 50
for idx, (pid, name) in enumerate(product_ids, 1):
    page = 1
    while True:
        resp = mc.request('GET', '/transactions', query={'paymentLinkId': pid, 'page': page, 'pageSize': page_size})
        rows = resp.get('data') or []
        for t in rows:
            tid = t.get('id')
            if not tid or tid in seen:
                continue
            seen.add(tid)
            status = str(t.get('status') or '').lower()
            status_counts[status] += 1
            if status not in {'paid', 'settled'}:
                continue
            amount = t.get('credit') or t.get('amount') or 0
            created = t.get('createdAt')
            if isinstance(created, (int, float)):
                d = datetime.fromtimestamp(created / 1000, TZ).date().isoformat()
            else:
                # fallback for ISO-ish values
                d = str(created or '')[:10]
            by_date[d] += float(amount)
            product_counts[name or pid] += 1
        if not resp.get('hasMore') or not rows:
            break
        page += 1
        time.sleep(0.05)
    print(f'processed {idx}/{len(product_ids)} {name}: pages={page}', file=sys.stderr)

history = [{'date': d, 'revenue': int(v) if float(v).is_integer() else v} for d, v in sorted(by_date.items())]
history_path.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding='utf-8')
data['daily_revenue_history'] = history
json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({
    'ok': True,
    'episode': EP,
    'products': len(product_ids),
    'transactions_seen': len(seen),
    'status_counts': dict(status_counts),
    'daily_points': len(history),
    'first': history[0] if history else None,
    'last': history[-1] if history else None,
    'history_sum': sum(r['revenue'] for r in history),
    'json_aggregate_revenue': data.get('aggregate', {}).get('revenue'),
    'matches_aggregate': round(sum(r['revenue'] for r in history)) == round(data.get('aggregate', {}).get('revenue') or 0)
}, ensure_ascii=False, indent=2))
