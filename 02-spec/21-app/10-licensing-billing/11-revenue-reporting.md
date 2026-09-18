# Revenue Reporting

Internal MRR, ARR, churn, and cohort dashboards. Not user-facing.

---

## 1. Audience

- Founders / leadership.
- Finance.
- Product / Growth.
- NOT exposed to customers.

## 2. Source of truth

- Processor data (Stripe + Paddle) ingested nightly into a warehouse (BigQuery / DuckDB).
- Mirror tables (`org_subscription`, `invoice`) for fast queries.
- All amounts normalized to USD using daily FX rates (ECB or processor reported).

## 3. Core metrics

| Metric | Definition |
|---|---|
| **MRR** | Sum of normalized monthly recurring revenue across active subscriptions |
| **ARR** | MRR × 12 |
| **New MRR** | New subscriptions this month |
| **Expansion MRR** | Upgrades + seat adds this month |
| **Contraction MRR** | Downgrades + seat removals |
| **Churned MRR** | Lost from cancellations |
| **Net New MRR** | New + Expansion − Contraction − Churned |
| **Logo Churn (%)** | Canceled Orgs ÷ Active Orgs at month start |
| **Revenue Churn (%)** | Churned MRR ÷ MRR at month start |
| **NRR** | (Start MRR + Expansion − Churn − Contraction) ÷ Start MRR |
| **GRR** | (Start MRR − Churn − Contraction) ÷ Start MRR |
| **ARPU** | MRR ÷ Active paying Orgs |
| **LTV** | ARPU × Avg Customer Lifetime (months) |

## 4. Cohorts

- By signup month: revenue retention curves.
- By plan: Pro vs Team retention.
- By acquisition source: organic vs paid vs referral vs lifetime.
- By country: regional churn patterns.
- By onboarding completion: did Time-to-First-Save predict retention?

## 5. Lifetime license accounting

- Lifetime revenue recognized over 24 months (deferred revenue model).
- Visible on a separate "Non-recurring" dashboard.
- LTV calc excludes lifetime customers from MRR-based metrics.

## 6. Refund accounting

- Refunds reduce MRR retroactively for the month they applied to.
- Win-back recoveries credited as new MRR in recovery month.

## 7. Trial conversion

- Trial → Paid conversion rate by cohort.
- Time-in-trial-before-conversion histogram.
- Plan chosen at conversion.

## 8. Dashboards

`/admin/revenue`:
- Top KPIs: MRR, ARR, NRR, Logo Churn (current month + trend).
- Charts: MRR over time, churn over time, plan mix.
- Cohort heatmap.
- Top growth/churn segments.
- Payments & Refunds detail tab.

`/admin/finance`:
- Invoice list (filterable).
- Tax remitted by jurisdiction.
- Refunds + credit notes.

## 9. Alerts

- MRR drop > 5% MoM → on-call paged.
- Churn spike (> 1.5x baseline) → growth team alerted.
- Single-Org churn > $1k/mo MRR → CSM intervention triggered.
- Failed payments backlog > $5k → finance alerted.

## 10. Pipeline

- Nightly job pulls Stripe/Paddle data via API + webhook backfill.
- Loads into warehouse via dbt models.
- Dashboards via Metabase / Lovable Cloud admin app.

## 11. Privacy

- Aggregated metrics never include personal identifiers in dashboards (only Org IDs internally).
- External investor reports use anonymized aggregates.
- Customer-level data accessible only to finance + leadership with audit log.

## 12. Telemetry

- `admin.revenue_dashboard_viewed`
- `admin.report_exported` `{ name, format }`
- `admin.alert_fired` `{ metric }`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Currency conversion at refund time differs from charge time | Use original conversion to avoid FX P&L drift |
| Subscription on trial counts toward MRR? | No; trial = $0 MRR until paid invoice |
| Lifetime stack pauses subscription | Subscription contributes $0 MRR while paused; lifetime in deferred bucket |
| Webhook backlog | Use `processor_invoice.created` as source of truth; bills counted on issue date |
| Cancelled but not yet expired subscription | Still counts in MRR until period_end |

## 14. Tests

- MRR calculation matches processor reports within $1 (rounding only).
- Cohort retention curves reproducible from raw events.
- Refund retroactive impact correctly applied.
- Trial conversion attribution by signup cohort.
