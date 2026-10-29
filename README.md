# Kashmir Dry Fruit — Demo E-Commerce Website (React + Vite)

Ek **demo** dry fruits e-commerce store, React par bani hui — Vercel par live deploy karne ke liye ready.
Client ko dikhane ke liye hai: products, weight select (250g / 500g / 1 KG), cart, COD checkout, WhatsApp ordering — sab kaam karta hai. Backend/database abhi nahi hai (demo hai), data files mein hai.

## Local chalana (apne computer par)

```
npm install
npm run dev
```
Browser mein jo address mile (http://localhost:5173) woh kholo.

## Kya kahan change hota hai

| Cheez | File |
|---|---|
| Shop ka naam, WhatsApp number, address, delivery fee | `src/config.js` |
| Products aur unki prices (per KG) | `src/data/products.js` |
| Design / colors | `src/index.css` |
| Poori site ka code | `src/App.jsx` |

> Demo mein abhi **Azhar ka apna WhatsApp number** laga hai (config mein). Client ka number milte hi sirf `src/config.js` mein `whatsapp` wali line badalni hai — 92 se shuru, 0 ke baghair.

## Vercel par LIVE deploy karna (free)

### Tareeqa 1 — GitHub se (recommended)
1. GitHub par ek **nayi repo** banao, naam masalan `dry-fruits-demo` (kuch settings change mat karna, bilkul khali repo).
2. VS Code mein is project ka folder kholo, terminal mein:
   ```
   git init
   git add .
   git commit -m "Dry fruits demo store"
   git branch -M main
   git remote add origin https://github.com/ChAzharmehmood/dry-fruits-demo.git
   git push -u origin main
   ```
   (remote wali line mein apni nayi repo ka link lagana.)
3. [vercel.com](https://vercel.com) par GitHub se sign in karo → **Add New → Project** → apni `dry-fruits-demo` repo select karke **Import**.
4. Kuch change mat karo — Vercel khud pehchan lega ke ye Vite project hai. **Deploy** dabao.
5. 1–2 minute mein live link mil jayega, masalan `dry-fruits-demo.vercel.app` — yahi link client ko bhejna hai.

### Tareeqa 2 — Terminal se foran (bina GitHub ke)
Project folder ke terminal mein:
```
npx vercel
```
Pehli dafa login mangega (browser khule ga), phir chand sawalon par Enter dabate jana — aakhir mein live link mil jayega.

## Full store (Phase 2) mein kya bachega
- Asal products + asal prices (client se)
- Admin panel — client khud products/prices change kar sake, orders dekhe
- Orders ka asal system (Node.js backend + database) — demo mein orders sirf WhatsApp par jate hain
- JazzCash / EasyPaisa payments (filhal sirf COD hai)

## Audit v3 (2026-10-29) — kya improve hua
- Palette brief ke mutabiq: deep forest green `#173F35`, warm cream `#F8F5ED`, muted gold `#C39A52`, charcoal `#242722`.
- Header mein working search + mobile menu; wishlist (♥) localStorage ke saath; cart bhi ab browser mein persist hota hai.
- Hero headline: "Nature's Finest, Handpicked for You." + Shop by Category grid (har card collection ko filter karke kholta hai).
- Product detail modal: photo click/name par — description, sizes, quantity, delivery/payment/storage info.
- Order flow honest hai: checkout ke baad order "tayyar" hota hai, WhatsApp par bhejna hi asal submission hai; us se pehle site "order confirm" nahi kehti.
- Invented claims remove: koi fake rating/review count/stat nahi. Newsletter form hata kar WhatsApp updates ka asal option diya.
- SEO: canonical, Open Graph, Store JSON-LD, theme-color.
- Checks: `npm run lint` → 0 warnings/errors. `npm run build` → success.
