# Weekly Usage Budget V17

## Product intent

Media Factory includes **Q200 of governed paid-generation usage per tenant per week**. This is not an open wallet. The product deliberately paces paid generation so a user can create throughout the week instead of exhausting the allowance in one or two days.

The primary user promise is:

- **Q200 included each week**;
- **one new paid AI video per local day**;
- local editing, authorized real-footage production, FFmpeg composition and Audio Finishing do not consume the paid-generation allowance;
- a protected reserve remains available for reviewed paid repairs when the provider must render again;
- there is no automatic overage and no automatic paid retry.

## Default policy

```yaml
schema_version: weekly-usage-budget.v1
currency: GTQ
timezone: America/Guatemala
weekly_cap_gtq: 200

new_generation:
  daily_limit: 1
  max_estimated_gtq: 22
  weekly_cap_gtq: 154

paid_repairs:
  protected_reserve_gtq: 46
  weekly_limit: 2
  max_estimated_gtq: 23

rollover_between_days: false
rollover_between_weeks: false
allow_overage: false
```

Seven maximum Q22 new-generation reservations consume at most Q154. Two maximum Q23 repair reservations consume the protected Q46. The hard weekly ceiling is therefore exactly Q200.

A missed day does **not** create two new-video slots on the following day. Unused monetary headroom remains visible as protected weekly capacity, but the daily creation entitlement remains one new paid AI video.

## Provider estimates and GTQ accounting

Higgsfield currently exposes a catalog upper-bound estimate in USD rather than an authoritative final bill. V17 converts that estimate to GTQ using the policy-bound reference rate and binds the resulting quote into the exact spend scope.

The current policy uses:

```yaml
usd_to_gtq_rate: 7.63
fx_rate_source: REFERENCE_RATE
fx_rate_checked_at: 2026-09-22
```

For the existing six-second Seedance 2.5 upper-bound estimate of USD 1.9416, the governed amount is **Q14.81**.
For the V20 eight-second Veo 3.1 Fast 720p reference-video estimate of USD 0.80, the same policy produces **Q6.10**, below the Q22 per-item new-generation cap. The spend still consumes the one-paid-video daily slot and weekly allocation when approved; the lower estimate does not create extra daily entitlements.

The accounting rate is versioned policy data, not a claim that Media Factory controls the external provider's eventual invoice. A policy/rate change changes the exact spend scope and requires a fresh approval.

## Reservation lifecycle

The budget is a durable ledger, not a mutable balance field.

```text
provider estimate
      ↓
AWAITING_SPEND_APPROVAL
      ↓ owner/admin approves exact scope
RESERVED
      ↓ provider submission begins
COMMITTED
      ↓ result is collected
SETTLED_ESTIMATE
```

If prompt/model/duration/input changes **before submission**, the old uncommitted reservation is released. Once provider submission begins, Media Factory does not fabricate a refund without authoritative final-cost evidence.

That means moderation failure, provider failure after submission, or an ambiguous submission result may still retain the committed upper-bound amount. This is conservative by design and prevents silent overspend.

## Atomic enforcement

Reservation occurs inside the same `AtomicRepository.transact()` that records the authenticated spend approval. Two jobs approved concurrently therefore cannot both consume the same daily slot or remaining weekly capacity.

The server re-checks at approval time:

1. exact spend scope;
2. current policy version;
3. usage category;
4. GTQ estimate;
5. per-item cap;
6. daily new-video slot;
7. Q154 new-generation weekly allocation;
8. Q46 repair reserve and repair count;
9. Q200 hard weekly cap.

The browser disabling a button is convenience only. The repository transaction is the authority boundary.

## New generation vs paid repair

An in-flight first provider attempt remains `NEW_GENERATION` throughout polling and crash recovery. Merely having a `generation_attempt` must not reclassify the same request as a repair.

`PAID_REPAIR` requires both:

- evidence of a prior paid generation attempt; and
- a later human-reviewed repair revision (`repair_revision > 0`).

This prevents recovery from accidentally generating a second spend scope.

## UX

The user sees a simple weekly card:

```text
TU SEMANA DE CREACIÓN
Q200 incluidos

1  video IA hoy

Protegido para la semana   Q...
Ajustes protegidos         Q46.00
Regla diaria               1 video
```

The spend-approval card uses GTQ as the primary value. Provider USD pricing remains secondary support information.

The UI deliberately avoids "credit wallet" language because the included value is paced capacity, not freely withdrawable cash.

## Non-paid operations

These do not consume the V17 paid-generation ledger:

- FFmpeg real-footage production;
- local FIRMES Caballito compositing when authorized;
- deterministic Audio Finishing;
- audio mastering and picture-lock verification;
- review, approval, evidence, Graph execution and release packaging.

## Fail-closed behavior

V17 does not:

- auto-purchase overage;
- retry a paid provider automatically after a terminal failure;
- accumulate missed daily video slots;
- release committed provider spend without authoritative cost evidence;
- allow editor/reviewer/viewer roles to approve paid spend;
- treat `budget_reference` in integration settings as the authoritative weekly cap.

The authoritative weekly cap is the V17 tenant usage ledger plus policy.
