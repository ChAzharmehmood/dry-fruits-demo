import { useEffect, useMemo, useRef, useState } from "react";
import { SHOP } from "./config";
import { PRODUCTS, CATEGORIES, WEIGHTS, priceFor, fmt } from "./data/products";

const waLink = (text) =>
  `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
const byId = (id) => PRODUCTS.find((p) => p.id === id);

/* ---------- Scroll reveal wrapper ---------- */
function Reveal({ children, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && el.classList.add("visible")),
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}

/* ---------- Product thumb (photo, warna gradient + emoji) ---------- */
function Thumb({ p, className = "" }) {
  return (
    <div className={`thumb ${className}`} style={!p.image ? { background: p.gradient } : undefined}>
      {p.image ? (
        <img src={p.image} alt={p.name} loading="lazy" />
      ) : (
        <span className="thumb-emoji">{p.emoji}</span>
      )}
      {p.tag && <span className="thumb-tag">{p.tag}</span>}
    </div>
  );
}

/* ---------- Full product card (Collection grid) ---------- */
function ProductCard({ p, onAdd, dark = false }) {
  const [weight, setWeight] = useState("500g");
  const [qty, setQty] = useState(1);
  const price = priceFor(p, weight);
  return (
    <article className={`card ${dark ? "card-dark" : ""}`}>
      <Thumb p={p} />
      <div className="card-body">
        <div className="card-top">
          <h3>{p.name}</h3>
          <span className="card-urdu">{p.urdu}</span>
        </div>
        <p className="card-cat">{p.category} • {fmt(p.priceKg)} / KG</p>
        <div className="weight-row">
          {WEIGHTS.map((w) => (
            <button key={w.id} className={`wpill ${weight === w.id ? "on" : ""}`} onClick={() => setWeight(w.id)}>
              {w.label}
            </button>
          ))}
        </div>
        <div className="card-foot">
          <div className="qty">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <div className="price">{fmt(price * qty)}</div>
        </div>
        <button className="btn btn-accent btn-block" onClick={() => onAdd(p, weight, qty)}>
          Add to Cart
        </button>
      </div>
    </article>
  );
}

/* ---------- Mini card (Handpicked row) ---------- */
function MiniCard({ p, onAdd }) {
  return (
    <article className="mini-card">
      <Thumb p={p} className="thumb-mini" />
      <h4>{p.name}</h4>
      <p>{p.urdu} • {fmt(p.priceKg)}/kg</p>
      <button className="plus-btn" onClick={() => onAdd(p, "500g", 1)} aria-label={`${p.name} add karein`}>
        +
      </button>
    </article>
  );
}

/* =================== APP =================== */
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
  const railRef = useRef(null);

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
    setCart((c) => ({ ...c, [key]: { p, weight, qty: (c[key]?.qty || 0) + qty } }));
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

  const featured = PRODUCTS.filter((p) => p.tag);
  const mix = byId(12);

  const placeOrder = (e) => {
    e.preventDefault();
    const num = "KDF-" + Math.floor(1000 + Math.random() * 9000);
    setOrder({ num, total, items: cartItems, ...form });
    setCheckout(false);
    setDrawer(false);
    setCart({});
  };

  const orderText = order
    ? `Assalam-o-Alaikum! Mera order #${order.num} (${SHOP.name}):\n` +
      order.items.map((i) => `• ${i.p.name} (${i.weight}) x${i.qty} — ${fmt(priceFor(i.p, i.weight) * i.qty)}`).join("\n") +
      `\nTotal (COD): ${fmt(order.total)}\nNaam: ${order.name}\nPhone: ${order.phone}\nCity: ${order.city}\nAddress: ${order.address}`
    : "";

  const scrollRail = (dir) =>
    railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="container nav-row">
          <a href="#top" className="brand">
            <span className="brand-name">Kashmir</span>
            <span className="brand-sub">DRY FRUIT</span>
          </a>
          <nav className="nav-links">
            <a href="#collection">Shop</a>
            <a href="#handpicked">Collections</a>
            <a href="#story">Our Story</a>
            <a href="#journal">Journal</a>
          </nav>
          <div className="nav-actions">
            <a href="#collection" className="icon-btn" aria-label="Search">⌕</a>
            <button className="icon-btn cart-icon" onClick={() => setDrawer(true)} aria-label="Cart kholein">
              🛍 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="hero" id="top">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow light">Premium Nuts & Dried Fruits</p>
            <h1>ROASTED<br />TO <em>PERFECTION.</em></h1>
            <p className="lead">Premium dry fruits, carefully selected and perfectly roasted. Nothing unnecessary — bas pure, natural goodness.</p>
            <div className="hero-cta">
              <a href="#collection" className="btn btn-accent btn-lg">Shop the Collection →</a>
              <a href="#signature" className="btn btn-link btn-lg">Explore Blends →</a>
            </div>
            <div className="hero-meta">
              <span>★ 4.9 rated</span><span>•</span><span>COD all Pakistan</span><span>•</span><span>{fmt(SHOP.freeDeliveryAbove)}+ par free delivery</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-img-wrap">
              <img src="/images/hero-mix.webp" alt="Premium mixed dry fruits" />
            </div>
            <div className="hero-badge"><span>100%</span><small>Natural<br />Goodness</small></div>
            <div className="chip chip-1">🌰 Badam — {fmt(3200)}/kg</div>
            <div className="chip chip-2">🍇 Kishmish — {fmt(1100)}/kg</div>
          </div>
        </div>
        <svg className="wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,50 C240,95 480,5 720,40 C960,75 1200,20 1440,55 L1440,90 L0,90 Z" fill="#F4EAD8" />
        </svg>
      </section>

      {/* ================= HANDPICKED ================= */}
      <section className="section cream" id="handpicked">
        <div className="container">
          <Reveal className="row-head">
            <div>
              <p className="eyebrow">Our Favourites</p>
              <h2>Handpicked<br />for You</h2>
            </div>
            <div className="rail-btns">
              <button onClick={() => scrollRail(-1)} aria-label="Peeche">←</button>
              <button onClick={() => scrollRail(1)} aria-label="Aage">→</button>
            </div>
          </Reveal>
          <div className="rail" ref={railRef}>
            {featured.map((p) => (
              <MiniCard key={p.id} p={p} onAdd={addToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= COLLECTION ================= */}
      <section className="section dark collection" id="collection">
        <div className="container">
          <Reveal className="row-head light-head">
            <h2 className="collection-title">THE COLLECTION</h2>
            <div className="cat-row">
              {CATEGORIES.map((c) => (
                <button key={c} className={`cat-pill ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          </Reveal>
          <div className="shop-tools">
            <input className="search dark-search" placeholder="🔍 Search badam, kaju, khajoor..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="count-note">{filtered.length} products</span>
          </div>
          {filtered.length === 0 ? (
            <p className="empty light-empty">Is naam ka product nahi mila — kuch aur search karke dekhein.</p>
          ) : (
            <div className="grid grid-dark">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} onAdd={addToCart} dark />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= SIGNATURE MIX ================= */}
      <section className="section cream" id="signature">
        <div className="container sig-grid">
          <Reveal className="sig-copy">
            <p className="eyebrow">The Signature Mix</p>
            <h2>A perfect balance of taste and nutrition.</h2>
            <div className="stats-row">
              <div><strong>8g</strong><span>Protein</span></div>
              <div><strong>4g</strong><span>Fiber</span></div>
              <div><strong>100%</strong><span>Roasted</span></div>
              <div><strong>No</strong><span>Additives</span></div>
            </div>
            <p className="sig-text">Badam, kaju, pista, akhrot aur kishmish ka khaas mix — har roz ki energy ke liye. Weight select karke direct cart mein add karein.</p>
            <button className="btn btn-accent btn-lg" onClick={() => addToCart(mix, "500g", 1)}>
              Shop Now — Mix 500g {fmt(priceFor(mix, "500g"))}
            </button>
          </Reveal>
          <Reveal className="sig-visual">
            <img src="/images/mix.webp" alt="Signature Mix dry fruits gift box" />
            <div className="sig-note">Good Food,<br /><em>Better Days</em></div>
          </Reveal>
        </div>
      </section>

      {/* ================= INGREDIENTS STRIP ================= */}
      <section className="strip" aria-label="Ingredients">
        {[
          ["pistachios", "Pistachio"], ["almonds", "Almond"], ["cashews", "Cashew"],
          ["walnuts", "Walnut"], ["apricots", "Apricot"], ["dates", "Dates"],
        ].map(([img, label]) => (
          <div key={label} className="strip-tile">
            <img src={`/images/${img}.webp`} alt={label} loading="lazy" />
            <span>{label}</span>
          </div>
        ))}
      </section>

      {/* ================= INSIDE + PROCESS ================= */}
      <section className="section dark" id="story">
        <div className="container inside-grid">
          <Reveal>
            <p className="eyebrow light">What's Inside</p>
            <h2 className="light-h">Real ingredients.<br />Real goodness.</h2>
            <ul className="benefits">
              <li><span>💪</span><div><strong>High Protein</strong><small>Builds & repairs</small></div></li>
              <li><span>❤️</span><div><strong>Good Fats</strong><small>Heart healthy</small></div></li>
              <li><span>⚡</span><div><strong>Natural Energy</strong><small>Keeps you going</small></div></li>
              <li><span>🌾</span><div><strong>Rich in Fiber</strong><small>Supports digestion</small></div></li>
            </ul>
          </Reveal>
          <Reveal className="inside-img">
            <img src="/images/giftbox.webp" alt="Premium dry fruits collection" />
            <p className="inside-caption">Small choices.<br /><strong>Big benefits.</strong></p>
          </Reveal>
          <Reveal>
            <p className="eyebrow light">Our Process</p>
            <h3 className="light-h">The Roasting Process</h3>
            <p className="process-sub">Better taste. Better nutrition.</p>
            <ol className="process">
              <li><span>01</span><div><strong>Select</strong><small>Only the best — har batch haath se check</small></div></li>
              <li><span>02</span><div><strong>Roast</strong><small>Perfectly balanced, bina extra oil ke</small></div></li>
              <li><span>03</span><div><strong>Pack</strong><small>Freshness ke liye sealed packing</small></div></li>
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ================= GIFT + SUBSCRIPTION ================= */}
      <section className="section cream">
        <div className="container duo-grid">
          <Reveal className="duo-card duo-light">
            <div>
              <p className="eyebrow">The Gift Collection</p>
              <h3>Give Something Good.</h3>
              <p>Premium gift boxes har occasion ke liye — shaadi, Eid, ya bas kisi khaas ke liye.</p>
              <div className="stars">★★★★★</div>
              <a href="#collection" className="btn btn-accent">Explore Gifts</a>
            </div>
            <img src="/images/giftbox.webp" alt="Dry fruits gift box" loading="lazy" />
          </Reveal>
          <Reveal className="duo-card duo-dark">
            <div>
              <p className="eyebrow light">Subscription</p>
              <h3>Your Dry Fruits, On Repeat.</h3>
              <p>Apna plan choose karein — har mahine fresh stock seedha aapke ghar.</p>
              <div className="plan-pills"><span className="on">Monthly</span><span>Every 2 Months</span></div>
              <a className="btn btn-accent" href={waLink("Assalam-o-Alaikum! Mujhe dry fruits subscription plan ki detail chahiye.")} target="_blank" rel="noreferrer">Start a Box</a>
            </div>
            <img src="/images/hero-mix.webp" alt="Mixed nuts pack" loading="lazy" />
          </Reveal>
        </div>
      </section>

      {/* ================= JOURNAL ================= */}
      <section className="section cream journal" id="journal">
        <div className="container">
          <Reveal className="row-head">
            <div>
              <p className="eyebrow">From Our Journal</p>
              <h2>Good Food. Great Stories.</h2>
            </div>
            <a href="#collection" className="btn btn-outline-dark">View All Stories →</a>
          </Reveal>
          <div className="grid grid-3">
            {[
              ["raisins", "Sehat ka khazana: Kishmish ke 5 fayde jo aap nahi jante", "Health"],
              ["apricots", "Khubani — paharon se aapki plate tak ka safar", "Our Story"],
              ["dates", "Ajwa Khajoor: Madina ki khaas saugaat, ab Kashmir mein", "Premium"],
            ].map(([img, t, tag]) => (
              <Reveal key={t} className="journal-card">
                <img src={`/images/${img}.webp`} alt="" loading="lazy" />
                <span className="j-tag">{tag}</span>
                <h4>{t}</h4>
                <span className="j-link">Read Story →</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div>
            <a href="#top" className="brand light-brand">
              <span className="brand-name">Kashmir</span>
              <span className="brand-sub">DRY FRUIT</span>
            </a>
            <p className="footer-tag">Goodness, Roasted.</p>
            <p>📍 {SHOP.address}, {SHOP.city}<br />📞 {SHOP.phoneDisplay}<br />🕘 {SHOP.timing}</p>
          </div>
          <div>
            <h4>Shop</h4>
            <a href="#collection">All Products</a><a href="#handpicked">Bestsellers</a><a href="#signature">Signature Mix</a><a href="#collection">Gift Boxes</a>
          </div>
          <div>
            <h4>About</h4>
            <a href="#story">Our Story</a><a href="#story">The Process</a><a href="#journal">Journal</a>
          </div>
          <div>
            <h4>Help</h4>
            <a href="#contact">Contact</a><a href="#collection">Delivery Info</a><a href="#collection">Returns</a>
            <a href={waLink("Assalam-o-Alaikum! Mujhe dry fruits ki maloomat chahiye.")} target="_blank" rel="noreferrer">WhatsApp Karein</a>
          </div>
          <div>
            <h4>Join our newsletter</h4>
            <p>Exclusive offers aur updates ke liye apna email dein.</p>
            <form className="news-form" onSubmit={(e) => { e.preventDefault(); showToast("🎉 Shukriya! Aap newsletter mein shamil ho gaye."); e.target.reset(); }}>
              <input type="email" required placeholder="Your email address" />
              <button type="submit" aria-label="Subscribe">→</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom container">
          <span>© {new Date().getFullYear()} {SHOP.name}. All rights reserved.</span>
          <span>Demo website — prices aur photos sample hain</span>
        </div>
      </footer>

      <a className="wa-float" href={waLink("Assalam-o-Alaikum! Mujhe dry fruits order karne hain.")} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a>

      {/* ================= CART DRAWER ================= */}
      {drawer && <div className="overlay" onClick={() => setDrawer(false)} />}
      <aside className={`drawer ${drawer ? "open" : ""}`} aria-hidden={!drawer}>
        <div className="drawer-head">
          <h3>🛍️ Aapka Cart</h3>
          <button onClick={() => setDrawer(false)} aria-label="Band karein">✕</button>
        </div>
        {cartItems.length === 0 ? (
          <p className="empty">Cart khali hai — kuch premium add karein! 🌰</p>
        ) : (
          <>
            <div className="drawer-items">
              {cartItems.map((i) => {
                const key = `${i.p.id}-${i.weight}`;
                return (
                  <div key={key} className="drawer-item">
                    <div><strong>{i.p.name}</strong><span>{i.weight} • {fmt(priceFor(i.p, i.weight))}</span></div>
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
              {delivery > 0 && <p className="hint">{fmt(SHOP.freeDeliveryAbove - subtotal)} aur khareedein to delivery FREE.</p>}
              <div className="total"><span>Total (COD)</span><span>{fmt(total)}</span></div>
              <button className="btn btn-accent btn-block btn-lg" onClick={() => setCheckout(true)}>Checkout →</button>
            </div>
          </>
        )}
      </aside>

      {/* ================= CHECKOUT ================= */}
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
            <button className="btn btn-accent btn-block btn-lg" type="submit">✅ Order Place Karein</button>
            <button className="btn btn-ghost btn-block" type="button" onClick={() => setCheckout(false)}>Wapas Cart</button>
          </form>
        </div>
      )}

      {/* ================= SUCCESS ================= */}
      {order && (
        <div className="modal-wrap">
          <div className="overlay" />
          <div className="modal success">
            <div className="success-icon">🎉</div>
            <h3>Shukriya, {order.name.split(" ")[0]}!</h3>
            <p>Aapka order <strong>#{order.num}</strong> mil gaya hai.<br />Total (COD): <strong>{fmt(order.total)}</strong></p>
            <p className="modal-sub">Order foran confirm karne ke liye WhatsApp par bhi bhej dein:</p>
            <a className="btn btn-whatsapp btn-block btn-lg" href={waLink(orderText)} target="_blank" rel="noreferrer">💬 WhatsApp Par Order Bhejein</a>
            <button className="btn btn-ghost btn-block" onClick={() => setOrder(null)}>Shopping Jari Rakhein</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
