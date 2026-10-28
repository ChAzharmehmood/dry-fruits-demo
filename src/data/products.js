// ============================================================
//  PRODUCTS — DEMO data hai. Prices sample hain (per 1 KG).
//  Asal prices client se milte hi yahan badal dena.
//  Weight ki price khud calculate hoti hai: 250g = kg/4, waghera.
// ============================================================
export const WEIGHTS = [
  { id: "250g", label: "250g", factor: 0.25 },
  { id: "500g", label: "500g", factor: 0.5 },
  { id: "1kg", label: "1 KG", factor: 1 },
];

export const CATEGORIES = ["All", "Nuts", "Dried Fruits", "Dates", "Snacks", "Mix"];

export const PRODUCTS = [
  { id: 1,  name: "Premium Almonds",        urdu: "Badam",          category: "Nuts",         priceKg: 3200, tag: "Bestseller", gradient: "linear-gradient(135deg,#8a5a2b,#5d3a17)", emoji: "🌰" },
  { id: 2,  name: "Cashew W-240",           urdu: "Kaju",           category: "Nuts",         priceKg: 4300, tag: "Premium",    gradient: "linear-gradient(135deg,#d9a441,#a8742a)", emoji: "🥜" },
  { id: 3,  name: "Roasted Pistachios",     urdu: "Pista",          category: "Nuts",         priceKg: 3800, tag: null,         gradient: "linear-gradient(135deg,#5c7a45,#37502a)", emoji: "🌿" },
  { id: 4,  name: "Himalayan Walnuts",      urdu: "Akhrot",         category: "Nuts",         priceKg: 2600, tag: null,         gradient: "linear-gradient(135deg,#6b4423,#402610)", emoji: "🧆" },
  { id: 5,  name: "Green Raisins",          urdu: "Kishmish",       category: "Dried Fruits", priceKg: 1100, tag: null,         gradient: "linear-gradient(135deg,#7d9b4e,#4c662f)", emoji: "🍇" },
  { id: 6,  name: "Dried Figs",             urdu: "Anjeer",         category: "Dried Fruits", priceKg: 2900, tag: "Premium",    gradient: "linear-gradient(135deg,#7a4a63,#4e2c3e)", emoji: "🫐" },
  { id: 7,  name: "Dried Apricots",         urdu: "Khubani",        category: "Dried Fruits", priceKg: 1600, tag: null,         gradient: "linear-gradient(135deg,#e07f2e,#a8541a)", emoji: "🍑" },
  { id: 8,  name: "Ajwa Dates",             urdu: "Ajwa Khajoor",   category: "Dates",        priceKg: 4800, tag: "Special",    gradient: "linear-gradient(135deg,#4a2f4f,#2b1a30)", emoji: "🌴" },
  { id: 9,  name: "Sukkari Dates",          urdu: "Sukkari Khajoor",category: "Dates",        priceKg: 2200, tag: null,         gradient: "linear-gradient(135deg,#a06a35,#6e451f)", emoji: "🍯" },
  { id: 10, name: "Roasted Peanuts",        urdu: "Mong Phali",     category: "Snacks",       priceKg: 700,  tag: null,         gradient: "linear-gradient(135deg,#c98d4b,#8f5f27)", emoji: "🥜" },
  { id: 11, name: "Roasted Chickpeas",      urdu: "Bhunay Chanay",  category: "Snacks",       priceKg: 650,  tag: null,         gradient: "linear-gradient(135deg,#d4af37,#9c7c22)", emoji: "🫘" },
  { id: 12, name: "Special Mix Dry Fruits", urdu: "Mix Dry Fruits", category: "Mix",          priceKg: 3000, tag: "Bestseller", gradient: "linear-gradient(135deg,#3e5c3a,#22371f)", emoji: "🎁" },
];

// Ek product + weight ki price (nearest Rs 10 par round)
export function priceFor(product, weight) {
  const w = WEIGHTS.find((x) => x.id === weight) || WEIGHTS[2];
  return Math.round((product.priceKg * w.factor) / 10) * 10;
}

export const fmt = (n) => "Rs " + n.toLocaleString("en-PK");
