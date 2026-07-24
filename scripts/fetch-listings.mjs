// Essex Multi-Family Finder — scheduled listing builder
// ------------------------------------------------------
// Gathers active multi-family listings from the source adapters, keeps only
// those under budget with 2+ units, detects finished-basement/parking from the
// description, computes a real door-to-Penn transit time, filters by the town's
// commute tier (Essex ≤45 min, nearby ≤55), ranks, and writes ../listings.json
// for the dashboard.
//
// Run locally:  node scripts/fetch-listings.mjs
// In CI:        .github/workflows/update-listings.yml (cron + manual)

import { writeFile } from "node:fs/promises";
import { MAX_PRICE, MIN_UNITS, MAX_ITEMS, townInfo, parseFeatures } from "./config.mjs";
import { commuteMinutes } from "./commute.mjs";
import { demo } from "./sources/demo.mjs";
import { rentcast } from "./sources/rentcast.mjs";
import { reso } from "./sources/reso.mjs";

const ADAPTERS = [reso, rentcast, demo];   // prefer real MLS/RentCast; demo is the fallback

const key = l => (l.address + "|" + l.town).toLowerCase().replace(/\s+/g, " ").trim();

function fit(l) {
  let s = 0;
  if (l.units >= 3) s += 30; if (l.units === 4) s += 10;
  if (l.basementFinished && l.basementFullBath) s += 25;
  if (l.parkingYes) s += 15;
  s += Math.max(0, 55 - l.commuteMin);
  s += Math.max(0, (MAX_PRICE - l.price) / 20000);
  return s;
}

async function main() {
  let sourceLabel = "demo";
  const raw = [];
  for (const adapter of ADAPTERS) {
    const name = adapter.sourceName;
    try {
      const items = await adapter(process.env);
      if (items && items.length) {
        console.log(`✓ ${name}: ${items.length} listings`);
        raw.push(...items);
        if (name !== "demo") sourceLabel = name === "reso" ? "GSMLS (RESO)" : "RentCast (MLS)";
      } else {
        console.log(`· ${name}: skipped (no credentials or 0 results)`);
      }
    } catch (e) { console.error(`✗ ${name} failed: ${e.message}`); }
  }

  // Base filter: budget + unit count + status.
  let candidates = raw.filter(l =>
    Number(l.price) > 0 && Number(l.price) <= MAX_PRICE &&
    Number(l.units) >= MIN_UNITS &&
    (!l.status || /active|coming soon/i.test(l.status))     // no under-contract / pending / sold
  );

  // Dedupe by address+town.
  const seen = new Set();
  candidates = candidates.filter(l => { const k = key(l); if (seen.has(k)) return false; seen.add(k); return true; });

  // Enrich each with features + commute, then filter by the town's commute tier.
  const enriched = [];
  for (const l of candidates) {
    const info = townInfo(l.town);
    const feats = parseFeatures(l.desc || "");
    const c = await commuteMinutes(l, process.env);
    if (c.min > info.tier) continue;                        // Essex ≤45, nearby ≤55
    enriched.push({
      id: "mls-" + key(l).replace(/[^a-z0-9]+/g, "-").slice(0, 44),
      address: l.address, town: l.town, county: info.county,
      price: Math.round(l.price), units: l.units,
      beds: l.beds ?? null, baths: l.baths ?? null, sqft: l.sqft ?? null,
      taxAnnual: Math.round(l.taxAnnual || l.price * 0.021),
      parking: feats.parking, parkingYes: feats.parkingYes,
      basementFinished: feats.basementFinished, basementFullBath: feats.basementFullBath,
      commuteMin: c.min, commuteLive: c.live, station: l.station || info.station,
      status: "Active", mls: l.mls || "", listingUrl: l.listingUrl || "",
      photo: l.photo || "", desc: l.desc || "", source: l.source,
    });
  }

  enriched.sort((a, b) => fit(b) - fit(a));
  const listings = enriched.slice(0, MAX_ITEMS);

  const out = {
    updated: new Date().toISOString(),
    source: sourceLabel,
    count: listings.length,
    criteria: { maxPrice: MAX_PRICE, minUnits: MIN_UNITS },
    listings,
  };
  await writeFile(new URL("../listings.json", import.meta.url), JSON.stringify(out, null, 2));
  console.log(`\nWrote listings.json — ${listings.length} homes (source: ${sourceLabel})`);
}

main().catch(e => { console.error(e); process.exit(1); });
