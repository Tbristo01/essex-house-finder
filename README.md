# Essex Multi-Family Finder

Finds **active** MLS multi-family homes in Essex County NJ (and easy-commute nearby towns)
that fit a home-buying brief, and lets you shortlist and send them to your realtor.

**Criteria (edit in `scripts/config.mjs` / workflow env):**
- ≤ $850,000, 2+ units (prefers 3–4 family)
- Finished basement + full bath and parking (detected from the listing description)
- ≤ 45 min public transit to NYC Penn Station (Essex), or ≤ 55 min for nearby towns
- Taxes shown per listing

## How it works
`scripts/fetch-listings.mjs` pulls from source adapters → filters by budget/units/status →
detects basement + parking from the description → computes a real door-to-Penn transit time
→ writes `listings.json`. The dashboard (`index.html`) reads it, and you shortlist + export
to email/text your realtor. A GitHub Action refreshes it daily.

## Data sources (add API keys as repo secrets to go live)
- **RentCast** (`RENTCAST_API_KEY`) — MLS-sourced active listings, free tier. Recommended start.
- **Direct GSMLS RESO feed** (`RESO_BASE_URL` + `RESO_TOKEN`/`RESO_BASIC`) — gold standard;
  requires your realtor to authorize a feed via SimplyRETS / MLS Grid / Trestle.
- **Google Maps** (`GOOGLE_MAPS_API_KEY`) — real transit commute times to Penn (else town estimate).

Without keys it runs on a built-in **demo** dataset so the dashboard works immediately.

## Trigger it
- Automatic: daily at ~8am ET (cron in `.github/workflows/update-listings.yml`)
- Manual: Actions tab → **Run workflow**, or `gh workflow run update-listings.yml`
- Local: `node scripts/fetch-listings.mjs`
