// Demo source — proves the pipeline end-to-end with NO API key.
// Emits a rotating set of realistic Essex-area multi-family "active listings"
// so you can watch the dashboard fill immediately. Turn off with DEMO=off,
// or delete from the ADAPTERS list once RentCast/RESO has credentials.

const POOL = [
  { town: "Maplewood",   units: 2, price: 749000, beds: 6, baths: 3, taxAnnual: 14200, sqft: 2600, desc: "Center-hall two-family. Finished basement with full bath and summer kitchen. Long driveway parks 4." },
  { town: "South Orange",units: 3, price: 825000, beds: 9, baths: 4, taxAnnual: 17800, sqft: 3400, desc: "Three-family steps from the village and train. Full unfinished basement, off-street driveway parking for 3." },
  { town: "Newark",      units: 3, price: 625000, beds: 8, baths: 4, taxAnnual: 11400, sqft: 3100, desc: "Forest Hill three-family. Finished basement with full bath, driveway parking." },
  { town: "East Orange", units: 4, price: 799000, beds: 10, baths: 5, taxAnnual: 16900, sqft: 4200, desc: "Four-family with parking lot (5 spaces). Finished basement, half bath. Near Brick Church station." },
  { town: "Montclair",   units: 2, price: 839000, beds: 5, baths: 3, taxAnnual: 18500, sqft: 2800, desc: "Two-family near Bay Street. Finished basement with full bath, two-car garage." },
  { town: "Bloomfield",  units: 3, price: 689000, beds: 8, baths: 3, taxAnnual: 13700, sqft: 3200, desc: "Three-family, finished basement rec room, driveway for 3." },
  { town: "Orange",      units: 4, price: 845000, beds: 11, baths: 5, taxAnnual: 17200, sqft: 4400, desc: "Rare four-family under budget. Finished basement with full bath. Driveway parks 4." },
  { town: "Glen Ridge",  units: 2, price: 829000, beds: 6, baths: 3, taxAnnual: 19800, sqft: 3000, desc: "Two-family, finished basement, two-car garage. Walk to Glen Ridge station." },
  { town: "Union",       units: 2, price: 575000, beds: 6, baths: 3, taxAnnual: 12100, sqft: 2500, desc: "Two-family. Finished basement with full bath, driveway for 3." },
  { town: "Irvington",   units: 3, price: 525000, beds: 8, baths: 3, taxAnnual: 10200, sqft: 3000, desc: "Value three-family. Finished basement, driveway parking." },
  { town: "Belleville",  units: 2, price: 599000, beds: 6, baths: 2, taxAnnual: 11800, sqft: 2400, desc: "Two-family, finished basement with full bath, two driveways." },
  { town: "Nutley",      units: 3, price: 799000, beds: 8, baths: 4, taxAnnual: 15900, sqft: 3300, desc: "Three-family, finished basement, off-street parking for 4, garage." },
];

const ZIP = { Maplewood:"07040","South Orange":"07079", Newark:"07104","East Orange":"07017", Orange:"07050", Montclair:"07042", Bloomfield:"07003","Glen Ridge":"07028", Union:"07083", Irvington:"07111", Belleville:"07109", Nutley:"07110" };
const STREETS = ["Prospect St","Vose Ave","Elwood Ave","Walnut St","Broughton Ave","Colonial Ave","Ridgewood Ave","Morris Ave","Sanford Ave","Park Ave","Grove St","Cedar St","Oak Pl","Berkeley Ave","Highland Ave"];

function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export async function demo(env) {
  if (String(env.DEMO).toLowerCase() === "off") return [];
  const rand = rng(Date.now());
  const n = 8 + Math.floor(rand() * 4);
  const picks = [...POOL].sort(() => rand() - 0.5).slice(0, n);
  return picks.map((p) => {
    const num = 40 + Math.floor(rand() * 760);
    const street = STREETS[Math.floor(rand() * STREETS.length)];
    const zip = ZIP[p.town] || "070" + (10 + Math.floor(rand() * 89));
    return {
      ...p,
      address: `${num} ${street}, ${p.town}, NJ ${zip}`,
      status: "Active",
      mls: "GSMLS 39" + (10000 + Math.floor(rand() * 89999)),
      listingUrl: `https://www.realtor.com/realestateandhomes-search/${p.town.replace(/\s+/g, "-")}_NJ/type-multi-family-home`,
      source: "demo",
    };
  });
}
demo.sourceName = "demo";
