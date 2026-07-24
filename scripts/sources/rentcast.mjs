// RentCast — active for-sale listings API (MLS-sourced, consumer-accessible).
// -------------------------------------------------------------------------
// Free tier ~50 requests/month. Get a key at https://app.rentcast.io (Dashboard
// → API), then add it as a repo secret named RENTCAST_API_KEY.
// Returns [] until the key exists, so the demo pipeline keeps working meanwhile.
//
// Docs: https://developers.rentcast.io/reference/listings-sale

import { TOWNS, MAX_PRICE } from "../config.mjs";

export async function rentcast(env) {
  const key = env.RENTCAST_API_KEY;
  if (!key) return [];

  const towns = Object.keys(TOWNS);
  const out = [];

  for (const town of towns) {
    const url = "https://api.rentcast.io/v1/listings/sale?" + new URLSearchParams({
      city: town, state: "NJ", status: "Active",
      propertyType: "Multi-Family", limit: "20",
    });
    let data;
    try {
      const res = await fetch(url, { headers: { "X-Api-Key": key, accept: "application/json" } });
      if (!res.ok) { console.error(`  rentcast ${town}: HTTP ${res.status}`); continue; }
      data = await res.json();
    } catch (e) { console.error(`  rentcast ${town}: ${e.message}`); continue; }

    const rows = Array.isArray(data) ? data : (data.listings || []);
    for (const p of rows) {
      const price = Number(p.price);
      if (!price || price > MAX_PRICE) continue;
      // Units: RentCast doesn't always expose unit count for multi-family;
      // infer from bedrooms/description when missing (2–4 family typical here).
      const units = Number(p.units || p.unitCount) ||
        (/(\bfour|4)[\s-]*(family|unit)/i.test(p.description || "") ? 4 :
         /(\bthree|3)[\s-]*(family|unit)/i.test(p.description || "") ? 3 : 2);
      out.push({
        address: p.formattedAddress || p.addressLine1 || `${town} multi-family`,
        town,
        price,
        units,
        beds: Number(p.bedrooms) || null,
        baths: Number(p.bathrooms) || null,
        sqft: Number(p.squareFootage) || null,
        taxAnnual: Number(p.propertyTaxes || p.taxAssessment?.annualAmount) || estimateTax(price, town),
        desc: p.description || "",
        status: p.status || "Active",
        mls: p.mlsNumber ? `${p.mlsName || "MLS"} ${p.mlsNumber}` : "",
        listingUrl: p.listingUrl || `https://www.realtor.com/realestateandhomes-search/${town.replace(/\s+/g, "-")}_NJ/type-multi-family-home`,
        photo: (p.photos && p.photos[0]) || p.primaryPhoto || "",
        lat: p.latitude, lng: p.longitude,
        source: "rentcast",
      });
    }
  }
  return out;
}

// Rough NJ tax fallback (~2.1% effective) when the API omits taxes.
function estimateTax(price) { return Math.round(price * 0.021); }

rentcast.sourceName = "rentcast";
