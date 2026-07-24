// Commute enrichment — real door-to-Penn public-transit time.
// Uses Google Maps Directions API (transit mode) when GOOGLE_MAPS_API_KEY is set;
// otherwise falls back to the town baseline from config.mjs.

import { PENN, townInfo } from "./config.mjs";

// Next weekday at 8:00am ET, as a UNIX timestamp, for a realistic AM peak query.
function nextWeekday8am() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(13, 0, 0, 0);            // 8am ET ≈ 13:00 UTC (EDT)
  if (d <= now) d.setDate(d.getDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setDate(d.getDate() + 1);
  return Math.floor(d.getTime() / 1000);
}

export async function commuteMinutes(listing, env) {
  const key = env.GOOGLE_MAPS_API_KEY;
  const info = townInfo(listing.town);

  // Fallback: no key → town baseline (still lets the whole pipeline run).
  if (!key || (!listing.lat && !listing.address)) return { min: info.baseline, live: false };

  const origin = listing.lat && listing.lng ? `${listing.lat},${listing.lng}`
    : encodeURIComponent(`${listing.address}, ${listing.town}, NJ`);
  const dest = `${PENN.lat},${PENN.lng}`;
  const url = "https://maps.googleapis.com/maps/api/directions/json?" + new URLSearchParams({
    origin, destination: dest, mode: "transit", transit_mode: "rail|subway|bus",
    departure_time: String(nextWeekday8am()), key,
  });

  try {
    const res = await fetch(url);
    const data = await res.json();
    const leg = data?.routes?.[0]?.legs?.[0];
    if (leg?.duration?.value) return { min: Math.round(leg.duration.value / 60), live: true };
  } catch (e) { /* fall through to baseline */ }
  return { min: info.baseline, live: false };
}
