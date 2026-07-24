// Essex Multi-Family Finder — search config
// Tune these to change the search. TOWNS drives the target geography, the
// commute tier (Essex ≤45 min, nearby ≤55), the fallback transit estimate,
// and the station label shown on each card.

export const PENN = { name: "NY Penn Station", lat: 40.7506, lng: -73.9935 };
export const MAX_PRICE = Number(process.env.MAX_PRICE ?? 850000);
export const MIN_UNITS = Number(process.env.MIN_UNITS ?? 2);
export const MAX_ITEMS = Number(process.env.MAX_ITEMS ?? 80);

export const TOWNS = {
  // Essex County — must be ≤ 45 min to Penn
  "Newark":       { county: "Essex", tier: 45, baseline: 24, station: "Newark Penn (NEC/PATH)" },
  "East Orange":  { county: "Essex", tier: 45, baseline: 33, station: "Brick Church (Midtown Direct)" },
  "Orange":       { county: "Essex", tier: 45, baseline: 35, station: "Highland Ave (Midtown Direct)" },
  "South Orange": { county: "Essex", tier: 45, baseline: 30, station: "South Orange (Midtown Direct)" },
  "Maplewood":    { county: "Essex", tier: 45, baseline: 32, station: "Maplewood (Midtown Direct)" },
  "Millburn":     { county: "Essex", tier: 45, baseline: 38, station: "Millburn/Short Hills (Midtown Direct)" },
  "Montclair":    { county: "Essex", tier: 45, baseline: 44, station: "Bay St (Montclair-Boonton)" },
  "Bloomfield":   { county: "Essex", tier: 45, baseline: 40, station: "Bloomfield (Montclair-Boonton)" },
  "Glen Ridge":   { county: "Essex", tier: 45, baseline: 42, station: "Glen Ridge (Montclair-Boonton)" },
  "Belleville":   { county: "Essex", tier: 45, baseline: 40, station: "via Newark" },
  "Nutley":       { county: "Essex", tier: 45, baseline: 43, station: "via Newark / Montclair line" },
  "Irvington":    { county: "Essex", tier: 45, baseline: 38, station: "bus to Newark Penn" },
  "West Orange":  { county: "Essex", tier: 45, baseline: 42, station: "via Highland Ave" },
  // Nearby (outside Essex) — allowed up to 55 min with easy transit
  "Union":        { county: "Union (nearby)",  tier: 55, baseline: 52, station: "Raritan Valley (transfer at Newark)" },
  "Roselle Park": { county: "Union (nearby)",  tier: 55, baseline: 48, station: "Raritan Valley (transfer)" },
  "Cranford":     { county: "Union (nearby)",  tier: 55, baseline: 50, station: "Raritan Valley (transfer)" },
  "Harrison":     { county: "Hudson (nearby)", tier: 55, baseline: 24, station: "Harrison PATH" },
  "Jersey City":  { county: "Hudson (nearby)", tier: 55, baseline: 30, station: "PATH to 33rd St" },
  "Kearny":       { county: "Hudson (nearby)", tier: 55, baseline: 36, station: "bus + PATH" },
};

export function townInfo(name) {
  return TOWNS[name] || { county: "Other", tier: 55, baseline: 55, station: "transit" };
}

// Detect must-have features from a free-text listing description.
export function parseFeatures(desc = "") {
  const d = desc.toLowerCase();
  const basementFinished = /(finished|renovated|full).{0,18}basement|basement.{0,18}(finished|renovated)|finished (lower level|lower-level)/.test(d);
  const basementFullBath = basementFinished &&
    /(full|3\/?4).{0,30}bath[\s\S]{0,60}basement|basement[\s\S]{0,60}(full|3\/?4).{0,10}bath|basement[\s\S]{0,40}bath/.test(d);
  const parkingYes = /driveway|garage|off[- ]?street|carport|parking (for|lot|space)|\bparking\b/.test(d);
  let parking = "Parking";
  const gm = d.match(/(\d)[\s-]*car garage/); const dm = d.match(/driveway/);
  if (gm) parking = `Garage (${gm[1]})`;
  else if (/garage/.test(d)) parking = "Garage";
  else if (dm) parking = "Driveway";
  else if (!parkingYes) parking = "None";
  return { basementFinished, basementFullBath, parkingYes, parking };
}
