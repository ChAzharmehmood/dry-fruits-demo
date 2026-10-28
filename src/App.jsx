import { useEffect, useMemo, useRef, useState } from "react";
import { SHOP } from "./config";
import { PRODUCTS, CATEGORIES, WEIGHTS, priceFor, fmt } from "./data/products";

/* ---------------- Helpers ---------------- */
const waLink = (text) =>
  `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;

/* ---------------- Small components ---------------- */
function Reveal({ children, className = "", as: Tag = "div", style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && el.classList.add("visible")),
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </Tag>
  );
}

function ProductCard({ p, onAdd }) {
  const [weight, setWeight] = useState("500g");
  const [qty, setQty] = useState(1);
  const price = priceFor(p, weight);
  return (
    <article className="card">
      <div className="card-thumb" style={{ background: p.gradient }}>
        <span className="card-emoji">{p.emoji}</span>
        <span className="card-urdu">{p.urdu}</span>
        {p.tag && <span className="card-tag">{p.tag}</span>}
      </div>
      <div className="card-body">
        <h3>{p.name}</h3>
        <p className="card-cat">
          {p.category} • {fmt(p.priceKg)} / KG
        </p>
        <div className="weight-row" role="group" aria-label="Weight select karo">
          {WEIGHTS.map((w) => (
            <button
              key={w.id}
              className={`weight-pill ${weight === w.id ? "on" : ""}`}
              onClick={() => setWeight(w.id)}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="card-foot">
          <div className="qty">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Kam karo">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(qty + 1)} aria-label="Barhao">+</button>
          </div>
          <div className="card-price">{fmt(price * qty)}</div>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => onAdd(p, weight, qty)}
        >
          🛒 Add to Cart
        </button>
      </div>
    </article>
  );
}

/* ---------------- Main App ---------------- */
export default function App() {
  const [cart, setCart] = useState({});
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [order, setOrder] = useState(null);
  const [toast, setToast] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const toastTimer = useRef(null);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + priceFor(i.p, i.weight) * i.qty, 0);
  const delivery = subtotal === 0 || subtotal >= SHOP.freeDeliveryAbove ? 0 : SHOP.deliveryFee;
  const total = subtotal + delivery;

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };

  const addToCart = (p, weight, qty) => {
    const key = `${p.id}-${weight}`;
    setCart((c) => ({
      ...c,
      [key]: { p, weight, qty: (c[key]?.qty || 0) + qty },
    }));
    showToast(`✅ ${p.name} (${weight}) cart mein add ho gaya`);
  };

  const setItemQty = (key, qty) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[key];
      else next[key] = { ...next[key], qty };
      return next;
    });
  };

  const filtered = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          (p.name + " " + p.urdu).toLowerCase().includes(search.toLowerCase())
      ),
    [category, search]
  );

  const placeOrder = (e) => {
    e.preventDefault();
    const num = "DF-" + Math.floor(1000 + Math.random() * 9000);
    setOrder({ num, total, items: cartItems, ...form });
    setCheckout(false);
    setDrawer(false);
    setCart({});
  };

  const orderText = order
    ? `Assalam-o-Alaikum! Mera order #${order.num} (${SHOP.name}):\n` +
      order.items
        .map((i) => `• ${i.p.name} (${i.weight}) x${i.qty} — ${fmt(priceFor(i.p, i.weight) * i.qty)}`)
        .join("\n") +
      `\nTotal (COD): ${fmt(order.total)}\nNaam: ${order.name}\nPhone: ${order.phone}\nCity: ${order.city}\nAddress: ${order.address}`
    : "";

  return (
    <>
      <header className="header">
        <div className="container nav-row">
          <a href="#" className="logo"><span className="logo-badge">🌰</span> {SHOP.name}</a>
          <nav className="nav-links">
            <a href="#shop">Shop</a>
            <a href="#why">Why Us</a>
            <a href="#reviews">Reviews</a>
            <a href="#contact">Contact</a>
          </nav>
          <button className="cart-btn" onClick={() => setDrawer(true)}>
            🛒 Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">100% Natural • Premium Quality • COD Available</p>
            <h1>Taza aur Premium <span className="accent">Dry Fruits</span>, seedha aapke ghar tak.</h1>
            <p className="lead">
              Badam, Kaju, Pista, Khajoor aur bohat kuch — weight select karein (250g / 500g / 1 KG),
              order karein, aur payment delivery par dein. Itna asan.
            </p>
            <div className="hero-cta">
              <a href="#shop" className="btn btn-primary btn-lg">🛍️ Shop Now</a>
              <a className="btn btn-outline btn-lg" href={waLink("Assalam-o-Alaikum! Mujhe dry fruits ki price list chahiye.")} target="_blank" rel="noreferrer">💬 WhatsApp Karein</a>
            </div>
            <div className="hero-stats">
              <div><strong>12+</strong><span>Premium Products</span></div>
              <div><strong>500+</strong><span>Khush Customers</span></div>
              <div><strong>{fmt(SHOP.freeDeliveryAbove)}+</strong><span>par FREE Delivery</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-circle">🌰</div>
            <div className="chip chip-1">🥜 Kaju — {fmt(4300)}/kg</div>
            <div className="chip chip-2">🍇 Kishmish — {fmt(1100)}/kg</div>
            <div className="chip chip-3">🌴 Ajwa — {fmt(4800)}/kg</div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          <span>✦ Cash on Delivery ✦ Premium Quality ✦ Fresh Stock ✦ Poore Pakistan Mein Delivery ✦ Weight Ke Hisab Se Packing ✦ Cash on Delivery ✦ Premium Quality ✦ Fresh Stock ✦ Poore Pakistan Mein Delivery ✦ Weight Ke Hisab Se Packing </span>
        </div>
      </div>

      <section id="shop" className="section">
        <div className="container">
          <Reveal className="section-head">
            <p className="eyebrow">Hamari Shop</p>
            <h2>Apni pasand select karein</h2>
            <p>Har product fresh stock se pack hota hai. Weight badlein, price khud update ho jayegi.</p>
          </Reveal>

          <div className="shop-tools">
            <div className="cat-row">
              {CATEGORIES.map((c) => (
                <button key={c} className={`cat-pill ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
            <input
              className="search"
              placeholder="🔍 Search: badam, kaju, khajoor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="empty">Is naam ka product nahi mila — kuch aur search karke dekhein.</p>
          ) : (
            <div className="grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="why" className="section section-soft">
        <div className="container">
          <Reveal className="section-head">
            <p className="eyebrow">Why Us</p>
            <h2>Hum se kyun khareedein?</h2>
          </Reveal>
          <div className="grid grid-4">
            {[
              ["🌟", "Premium Quality", "Har batch pehle check hota hai — jo cheez hum apne ghar nahi le jayenge, woh aapko nahi bhejenge."],
              ["⚖️", "Poora Weight", "250g matlab poora 250g. Digital scale par tol kar pack hota hai."],
              ["🚚", "Fast Delivery", "Order aaj, dispatch kal. Poore Pakistan mein Cash on Delivery."],
              ["💬", "WhatsApp Support", "Sawal ho ya order ki maloomat — WhatsApp par foran jawab."],
            ].map(([icon, t, d]) => (
              <Reveal key={t} className="why-card">
                <div className="why-icon">{icon}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="steps">
            <h3>Order kaise karein? Sirf 3 steps</h3>
            <div className="steps-row">
              <div><span>1</span><p>Product aur weight select karke cart mein add karein</p></div>
              <div><span>2</span><p>Checkout par naam, phone aur address likhein</p></div>
              <div><span>3</span><p>Parcel milne par payment dein — Cash on Delivery</p></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="reviews" className="section">
        <div className="container">
          <Reveal className="section-head">
            <p className="eyebrow">Reviews</p>
            <h2>Customers kya kehte hain</h2>
          </Reveal>
          <div className="grid grid-3">
            {[
              ["Ahmed Raza", "Rawalpindi", "Badam aur Kaju ki quality bazaar se bohat behtar nikli. Packing bhi saaf suthri thi, weight bhi poora."],
              ["Fatima Bibi", "Lahore", "Ajwa Khajoor bilkul fresh thi. WhatsApp par order kiya, do din mein parcel mil gaya."],
              ["Usman Tariq", "Karachi", "Mix dry fruits ghar walon ko bohat pasand aaya. Price bhi munasib hai, dobara order karunga."],
            ].map(([n, c, t]) => (
              <Reveal key={n} className="review-card">
                <div className="stars">★★★★★</div>
                <p>“{t}”</p>
                <strong>{n}</strong>
                <span>{c}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="footer">
        <div className="container footer-grid">
          <div>
            <div className="logo footer-logo"><span className="logo-badge">🌰</span> {SHOP.name}</div>
            <p>{SHOP.tagline} — fresh stock, poora weight, aur payment delivery par.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a href="#shop">Shop</a><a href="#why">Why Us</a><a href="#reviews">Reviews</a>
          </div>
          <div>
            <h4>Contact</h4>
            <p>📍 {SHOP.address}, {SHOP.city}</p>
            <p>📞 {SHOP.phoneDisplay}</p>
            <p>🕘 {SHOP.timing}</p>
          </div>
          <div>
            <h4>Order Karein</h4>
            <p>WhatsApp par direct order ya price list ke liye:</p>
            <a className="btn btn-whatsapp" href={waLink("Assalam-o-Alaikum! Mujhe dry fruits order karne hain.")} target="_blank" rel="noreferrer">💬 WhatsApp</a>
          </div>
        </div>
        <div className="footer-bottom container">
          <span>© {new Date().getFullYear()} {SHOP.name}. All rights reserved.</span>
          <span>Demo website — prices sample hain.</span>
        </div>
      </footer>

      <a className="wa-float" href={waLink("Assalam-o-Alaikum! Mujhe dry fruits ki maloomat chahiye.")} target="_blank" rel="noreferrer" aria-label="WhatsApp par baat karein">💬</a>

      {drawer && <div className="overlay" onClick={() => setDrawer(false)} />}
      <aside className={`drawer ${drawer ? "open" : ""}`} aria-hidden={!drawer}>
        <div className="drawer-head">
          <h3>🛒 Aapka Cart</h3>
          <button onClick={() => setDrawer(false)} aria-label="Band karein">✕</button>
        </div>
        {cartItems.length === 0 ? (
          <p className="empty">Cart khali hai — kuch tasty add karein! 🌰</p>
        ) : (
          <>
            <div className="drawer-items">
              {cartItems.map((i) => {
                const key = `${i.p.id}-${i.weight}`;
                return (
                  <div key={key} className="drawer-item">
                    <div>
                      <strong>{i.p.name}</strong>
                      <span>{i.weight} • {fmt(priceFor(i.p, i.weight))}</span>
                    </div>
                    <div className="qty">
                      <button onClick={() => setItemQty(key, i.qty - 1)}>−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => setItemQty(key, i.qty + 1)}>+</button>
                    </div>
                    <div className="drawer-price">{fmt(priceFor(i.p, i.weight) * i.qty)}</div>
                  </div>
                );
              })}
            </div>
            <div className="drawer-summary">
              <div><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div><span>Delivery</span><span>{delivery === 0 ? "FREE 🎉" : fmt(delivery)}</span></div>
              {delivery > 0 && <p className="hint">{fmt(SHOP.freeDeliveryAbove - subtotal)} aur khareedein to delivery FREE ho jayegi.</p>}
              <div className="total"><span>Total (COD)</span><span>{fmt(total)}</span></div>
              <button className="btn btn-primary btn-block btn-lg" onClick={() => setCheckout(true)}>Checkout →</button>
            </div>
          </>
        )}
      </aside>

      {checkout && (
        <div className="modal-wrap">
          <div className="overlay" onClick={() => setCheckout(false)} />
          <form className="modal" onSubmit={placeOrder}>
            <h3>Checkout — Cash on Delivery</h3>
            <p className="modal-sub">Total payable: <strong>{fmt(total)}</strong> (delivery par cash dein)</p>
            <label>Poora Naam<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Muhammad Ali" /></label>
            <label>Mobile Number<input required type="tel" pattern="[0-9+ -]{11,15}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx-xxxxxxx" /></label>
            <label>Sheher (City)<input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Masalan: Rawalakot" /></label>
            <label>Poora Address<textarea required rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Mohalla, gali, ghar number..." /></label>
            <button className="btn btn-primary btn-block btn-lg" type="submit">✅ Order Place Karein</button>
            <button className="btn btn-ghost btn-block" type="button" onClick={() => setCheckout(false)}>Wapas Cart</button>
          </form>
        </div>
      )}

      {order && (
        <div className="modal-wrap">
          <div className="overlay" />
          <div className="modal success">
            <div className="success-icon">🎉</div>
            <h3>Shukriya, {order.name.split(" ")[0]}!</h3>
            <p>Aapka order <strong>#{order.num}</strong> mil gaya hai.<br />Total (COD): <strong>{fmt(order.total)}</strong></p>
            <p className="modal-sub">Order tezi se confirm karne ke liye isi order ko WhatsApp par bhi bhej dein:</p>
            <a className="btn btn-whatsapp btn-block btn-lg" href={waLink(orderText)} target="_blank" rel="noreferrer">💬 WhatsApp Par Order Bhejein</a>
            <button className="btn btn-ghost btn-block" onClick={() => setOrder(null)}>Shopping Jari Rakhein</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
