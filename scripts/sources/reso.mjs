// Direct MLS (RESO Web API) — the "real GSMLS feed" path.
// -------------------------------------------------------
// This is the gold-standard source: a licensed RESO feed straight from the MLS
// (Garden State MLS covers Essex County). Access requires MLS credentials, which
// normally means your REALTOR authorizes a data feed for you through one of:
//   • SimplyRETS   (https://simplyrets.com)  — RESO/RETS gateway, per-MLS approval
//   • MLS Grid     (https://www.mlsgrid.com)  — RESO Web API, broker authorization
//   • Trestle / Bridge — CoreLogic / Zillow Group RESO feeds
//
// Set RESO_BASE_URL + RESO_TOKEN (and, for SimplyRETS demo, RESO_BASIC = user:pass)
// as repo secrets once your agent enables a feed. Returns [] until then.
//
// The query below is RESO-standard OData filtering the Property resource for
// active residential-income (multi-family) listings under budget.

import { MAX_PRICE, MIN_UNITS } from "../config.mjs";

export async function reso(env) {
  const base = env.RESO_BASE_URL;         // e.g. https://api.simplyrets.com/properties  or  https://api.mlsgrid.com/v2/Property
  const token = env.RESO_TOKEN;           // Bearer token
  const basic = env.RESO_BASIC;           // optional "user:pass" (SimplyRETS demo = simplyrets:simplyrets)
  if (!base || (!token && !basic)) return [];

  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (basic) headers.Authorization = "Basic " + Buffer.from(basic).toString("base64");

  // RESO OData: active multi-family (residential income) under budget.
  const filter = `StandardStatus eq 'Active' and ListPrice le ${MAX_PRICE} and PropertyType eq 'Residential Income'`;
  const url = base.includes("simplyrets")
    ? `${base}?type=multifamily&status=Active&maxprice=${MAX_PRICE}&limit=100`
    : `${base}?$filter=${encodeURIComponent(filter)}&$top=100`;

  let data;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("HTTP " + res.status);
    data = await res.json();
  } catch (e) { console.error("  reso: " + e.message); return []; }

  const rows = data.value || data || [];
  return rows.map(p => {
    // SimplyRETS vs RESO field shapes both handled loosely.
    const addr = p.address || {};
    return {
      address: p.address?.full || `${addr.streetNumber || ""} ${addr.streetName || ""}`.trim() || p.UnparsedAddress || "Listing",
      town: addr.city || p.City || "",
      price: Number(p.listPrice ?? p.ListPrice),
      units: Number(p.property?.area || p.NumberOfUnitsTotal) || MIN_UNITS,
      beds: Number(p.property?.bedrooms ?? p.BedroomsTotal) || null,
      baths: Number(p.property?.bathsFull ?? p.BathroomsFull) || null,
      sqft: Number(p.property?.area ?? p.LivingArea) || null,
      taxAnnual: Number(p.tax?.taxAnnualAmount ?? p.TaxAnnualAmount) || null,
      desc: p.remarks || p.PublicRemarks || "",
      status: p.mlsStatus || p.StandardStatus || "Active",
      mls: p.mlsId || p.ListingId || p.ListingKey || "",
      listingUrl: p.listingUrl || p.href || "",
      photo: (p.photos && p.photos[0]) || (p.Media && p.Media[0]?.MediaURL) || "",
      lat: p.geo?.lat ?? p.Latitude, lng: p.geo?.lng ?? p.Longitude,
      source: "reso",
    };
  }).filter(l => l.price);
}
reso.sourceName = "reso";
