import { useEffect, useMemo, useRef, useState } from "react";
import { SHOP } from "./config";
import { PRODUCTS, CATEGORIES, WEIGHTS, priceFor, fmt } from "./data/products";

const YEAR = new Date().getFullYear();
const newOrderNum = () => "KDF-" + Math.floor(1000 + Math.random() * 9000);
const waLink = (text) =>
  `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

/* ---------- localStorage helpers (cart + wishlist persist) ---------- */
function loadJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function loadCart() {
  const saved = loadJSON("kdf-cart-v1", []);
  const out = {};
  saved.forEach(({ id, weight, qty }) => {
    const p = byId(id);
    if (p) out[`${id}-${weight}`] = { p, weight, qty };
  });
  return out;
}

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

/* ---------- Product thumb ---------- */
function Thumb({ p, className = "", onOpen, eager = false }) {
  return (
    <div
      className={`thumb ${className} ${onOpen ? "thumb-click" : ""}`}
      style={!p.image ? { background: p.gradient } : undefined}
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `${p.name} ki detail dekhein` : undefined}
      onKeyDown={onOpen ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen()) : undefined}
    >
      {p.image ? (
        <img src={p.image} alt={p.name} loading={eager ? "eager" : "lazy"} />
      ) : (
        <span className="thumb-emoji">{p.emoji}</span>
      )}
      {p.tag && <span className="thumb-tag">{p.tag}</span>}
    </div>
  );
}

function WishBtn({ active, onToggle, name }) {
  return (
    <button
      className={`wish-btn ${active ? "on" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={active ? `${name} wishlist se hatayein` : `${name} wishlist mein add karein`}
      aria-pressed={active}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}

/* ---------- Full product card ---------- */
function ProductCard({ p, onAdd, onOpen, wished, onWish, dark = false }) {
  const [weight, setWeight] = useState("500g");
  const [qty, setQty] = useState(1);
  const price = priceFor(p, weight);
  return (
    <article className={`card ${dark ? "card-dark" : ""}`}>
      <div className="thumb-wrap">
        <Thumb p={p} onOpen={() => onOpen(p)} />
        <WishBtn active={wished} onToggle={() => onWish(p)} name={p.name} />
      </div>
      <div className="card-body">
        <div className="card-top">
          <h3>
            <button className="name-btn" onClick={() => onOpen(p)}>{p.name}</button>
          </h3>
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
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Quantity kam karein">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(qty + 1)} aria-label="Quantity barhayein">+</button>
          </div>
          <div className="price">{fmt(price * qty)}</div>
        </div>
        <button className="btn btn-accent btn-block card-add" onClick={() => onAdd(p, weight, qty)}>
          Add to Cart
        </button>
      </div>
    </article>
  );
}

/* ---------- Mini card (Handpicked rail) ---------- */
function MiniCard({ p, onAdd, onOpen, wished, onWish }) {
  return (
    <article className="mini-card">
      <div className="thumb-wrap">
        <Thumb p={p} className="thumb-mini" onOpen={() => onOpen(p)} />
        <WishBtn active={wished} onToggle={() => onWish(p)} name={p.name} />
      </div>
      <h4>
        <button className="name-btn" onClick={() => onOpen(p)}>{p.name}</button>
      </h4>
      <p>{p.urdu} • {fmt(p.priceKg)}/kg</p>
      <button className="plus-btn" onClick={() => onAdd(p, "500g", 1)} aria-label={`${p.name} (500g) cart mein add karein`}>
        +
      </button>
    </article>
  );
}

/* =================== APP =================== */
export default function App() {
  const [cart, setCart] = useState(loadCart);
  const [wishlist, setWishlist] = useState(() => loadJSON("kdf-wish-v1", []));
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [order, setOrder] = useState(null);
  const [detail, setDetail] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [category, setCategory] = useState("All");
  const [wishOnly, setWishOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const toastTimer = useRef(null);
  const railRef = useRef(null);

  /* persist cart + wishlist */
  useEffect(() => {
    localStorage.setItem(
      "kdf-cart-v1",
      JSON.stringify(Object.values(cart).map(({ p, weight, qty }) => ({ id: p.id, weight, qty })))
    );
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("kdf-wish-v1", JSON.stringify(wishlist));
  }, [wishlist]);

  /* lock body scroll when a panel/modal is open */
  useEffect(() => {
    const locked = drawer || checkout || order || detail || menuOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer, checkout, order, detail, menuOpen]);

  /* Escape closes the topmost panel */
  useEffect(() => {
    const fn = (e) => {
      if (e.key !== "Escape") return;
      if (checkout) setCheckout(false);
      else if (order) setOrder(null);
      else if (drawer) setDrawer(false);
      else if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [checkout, order, drawer, menuOpen]);

  /* Move focus into the order dialog when it appears */
  useEffect(() => {
    if (order && !order.sent) document.querySelector(".order-wa")?.focus();
    if (order?.sent) document.querySelector(".order-done")?.focus();
  }, [order]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + priceFor(i.p, i.weight) * i.qty, 0);
  const delivery = subtotal === 0 || subtotal >= SHOP.freeDeliveryAbove ? 0 : SHOP.deliveryFee;
  const total = subtotal + delivery;

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const addToCart = (p, weight, qty) => {
    const key = `${p.id}-${weight}`;
    setCart((c) => ({ ...c, [key]: { p, weight, qty: (c[key]?.qty || 0) + qty } }));
    showToast(`✅ ${p.name} (${weight}) cart mein add ho gaya`);
  };

  const toggleWish = (p) => {
    setWishlist((w) => {
      const has = w.includes(p.id);
      showToast(has ? `🤍 ${p.name} wishlist se hata diya` : `❤️ ${p.name} wishlist mein add ho gaya`);
      return has ? w.filter((id) => id !== p.id) : [...w, p.id];
    });
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
          (!wishOnly || wishlist.includes(p.id)) &&
          (p.name + " " + p.urdu).toLowerCase().includes(search.toLowerCase())
      ),
    [category, search, wishOnly, wishlist]
  );

  const featured = PRODUCTS.filter((p) => p.tag);
  const mix = byId(12);

  const goCategory = (c) => {
    setCategory(c);
    setWishOnly(false);
    scrollToId("collection");
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollToId("collection");
  };

  const placeOrder = (e) => {
    e.preventDefault();
    const num = newOrderNum();
    setOrder({ num, total, items: cartItems, ...form, sent: false });
    setCheckout(false);
    setDrawer(false);
    setCart({});
  };

  const orderText = order
    ? `Assalam-o-Alaikum! Mera order #${order.num} (${SHOP.name}):\n` +
      order.items.map((i) => `• ${i.p.name} (${i.weight}) x${i.qty} — ${fmt(priceFor(i.p, i.weight) * i.qty)}`).join("\n") +
      `\nTotal (COD): ${fmt(order.total)}\nNaam: ${order.name}\nPhone: ${order.phone}\nCity: ${order.city}\nAddress: ${order.address}`
    : "";

  const scrollRail = (dir) => railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  const NAV = [
    ["Shop", "collection"],
    ["Categories", "categories"],
    ["Our Story", "story"],
    ["Journal", "journal"],
  ];

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="container nav-row">
          <a href="#top" className="brand" aria-label={`${SHOP.name} — home`}>
            <span className="brand-name">Kashmir</span>
            <span className="brand-sub">DRY FRUIT</span>
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            {NAV.map(([label, id]) => (
              <a key={id} href={`#${id}`}>{label}</a>
            ))}
          </nav>
          <form className="header-search" onSubmit={submitSearch} role="search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search badam, kaju..."
              aria-label="Products search karein"
            />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
          <div className="nav-actions">
            <button
              className={`icon-btn ${wishOnly ? "active" : ""}`}
              onClick={() => {
                setWishOnly(!wishOnly);
                scrollToId("collection");
              }}
              aria-label="Wishlist dekhein"
              aria-pressed={wishOnly}
            >
              ♥ {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
            </button>
            <button className="icon-btn" onClick={() => setDrawer(true)} aria-label="Cart kholein">
              🛍 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
            <button
              className="icon-btn menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Menu band karein" : "Menu kholein"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <form className="header-search mobile-search" onSubmit={submitSearch} role="search">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search badam, kaju, khajoor..."
                aria-label="Products search karein"
              />
              <button type="submit" aria-label="Search">⌕</button>
            </form>
            <nav aria-label="Mobile navigation">
              {NAV.map(([label, id]) => (
                <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>
              ))}
              <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section className="hero" id="top">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow light">Premium Nuts & Dried Fruits</p>
              <h1 className="hero-title">Nature's Finest, <em>Handpicked for You.</em></h1>
              <p className="lead">Discover premium nuts, wholesome dry fruits, and naturally delicious everyday essentials.</p>
              <div className="hero-cta">
                <a href="#collection" className="btn btn-accent btn-lg">Shop Dry Fruits →</a>
                <a href="#categories" className="btn btn-link btn-lg">Explore Collections →</a>
              </div>
              <div className="hero-meta">
                <span>Cash on Delivery</span><span>•</span>
                <span>{fmt(SHOP.freeDeliveryAbove)}+ ke order par free delivery</span><span>•</span>
                <span>WhatsApp par bhi order karein</span>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-img-wrap">
                <img src="/images/hero-mix.webp" alt="Premium mixed dry fruits" fetchPriority="high" />
              </div>
              <div className="hero-badge"><span>Fresh</span><small>Stock<br />Packed With Care</small></div>
              <div className="chip chip-1">🌰 Badam — {fmt(3200)}/kg</div>
              <div className="chip chip-2">🍇 Kishmish — {fmt(1100)}/kg</div>
            </div>
          </div>
          <svg className="wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,50 C240,95 480,5 720,40 C960,75 1200,20 1440,55 L1440,90 L0,90 Z" fill="#F8F5ED" />
          </svg>
        </section>

        {/* ================= CATEGORIES ================= */}
        <section className="section cream" id="categories">
          <div className="container">
            <Reveal className="row-head">
              <div>
                <p className="eyebrow">Collections</p>
                <h2>Shop by Category</h2>
              </div>
              <a href="#collection" className="btn btn-outline-dark">View All Products →</a>
            </Reveal>
            <div className="cat-grid">
              {[
                ["Nuts", "cashews", "Badam, Kaju, Pista, Akhrot"],
                ["Dried Fruits", "apricots", "Kishmish, Anjeer, Khubani"],
                ["Dates", "dates", "Ajwa aur Sukkari Khajoor"],
                ["Snacks", "peanuts", "Mong Phali, Bhunay Chanay"],
                ["Mix", "mix", "Signature Mix Dry Fruits"],
              ].map(([name, img, sub]) => (
                <button key={name} className="cat-card" onClick={() => goCategory(name)}>
                  <span className="cat-img"><img src={`/images/${img}.webp`} alt={`${name} category`} loading="lazy" /></span>
                  <span className="cat-info">
                    <strong>{name}</strong>
                    <small>{sub}</small>
                    <em>{PRODUCTS.filter((p) => p.category === name).length} products →</em>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ================= HANDPICKED ================= */}
        <section className="section white" id="handpicked">
          <div className="container">
            <Reveal className="row-head">
              <div>
                <p className="eyebrow">Our Favourites</p>
                <h2>Handpicked for You</h2>
              </div>
              <div className="rail-btns">
                <button onClick={() => scrollRail(-1)} aria-label="Peeche">←</button>
                <button onClick={() => scrollRail(1)} aria-label="Aage">→</button>
              </div>
            </Reveal>
            <div className="rail" ref={railRef}>
              {featured.map((p) => (
                <MiniCard key={p.id} p={p} onAdd={addToCart} onOpen={setDetail} wished={wishlist.includes(p.id)} onWish={toggleWish} />
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
                  <button key={c} className={`cat-pill ${category === c && !wishOnly ? "on" : ""}`} onClick={() => { setCategory(c); setWishOnly(false); }}>{c === "All" ? "Sab Products" : c}</button>
                ))}
                {wishlist.length > 0 && (
                  <button className={`cat-pill ${wishOnly ? "on" : ""}`} onClick={() => setWishOnly(!wishOnly)}>♥ Wishlist</button>
                )}
              </div>
            </Reveal>
            <div className="shop-tools">
              <input className="search dark-search" placeholder="🔍 Search badam, kaju, khajoor..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Products search karein" />
              <span className="count-note">{filtered.length} products{wishOnly ? " (wishlist)" : ""}</span>
            </div>
            {filtered.length === 0 ? (
              <p className="empty light-empty">
                {wishOnly ? "Wishlist khali hai — kisi product par ♥ dabayein." : "Is naam ka product nahi mila — kuch aur search karke dekhein."}
              </p>
            ) : (
              <div className="grid grid-dark">
                {filtered.map((p) => (
                  <ProductCard key={p.id} p={p} onAdd={addToCart} onOpen={setDetail} wished={wishlist.includes(p.id)} onWish={toggleWish} dark />
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
                <div><strong>5</strong><span>Premium Ingredients</span></div>
                <div><strong>3</strong><span>Pack Sizes</span></div>
                <div><strong>250g–1KG</strong><span>Weight Options</span></div>
                <div><strong>COD</strong><span>Payment</span></div>
              </div>
              <p className="sig-text">Badam, kaju, pista, akhrot aur kishmish ka khaas mix — har roz ke liye. Weight select karke direct cart mein add karein.</p>
              <button className="btn btn-accent btn-lg" onClick={() => addToCart(mix, "500g", 1)}>
                Shop Now — Mix 500g {fmt(priceFor(mix, "500g"))}
              </button>
            </Reveal>
            <Reveal className="sig-visual">
              <img src="/images/mix.webp" alt="Signature Mix dry fruits gift box" loading="lazy" />
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
                <li><span>🌰</span><div><strong>Fresh Stock</strong><small>Har batch check karke pack hota hai</small></div></li>
                <li><span>⚖️</span><div><strong>Poora Weight</strong><small>Digital scale par tol kar packing</small></div></li>
                <li><span>📦</span><div><strong>Sealed Packing</strong><small>Freshness andar lock</small></div></li>
                <li><span>💵</span><div><strong>Cash on Delivery</strong><small>Pehle parcel, phir payment</small></div></li>
              </ul>
            </Reveal>
            <Reveal className="inside-img">
              <img src="/images/giftbox.webp" alt="Premium dry fruits collection" loading="lazy" />
              <p className="inside-caption">Small choices.<br /><strong>Big benefits.</strong></p>
            </Reveal>
            <Reveal>
              <p className="eyebrow light">Our Process</p>
              <h3 className="light-h">The Roasting Process</h3>
              <p className="process-sub">Better taste, carefully prepared.</p>
              <ol className="process">
                <li><span>01</span><div><strong>Select</strong><small>Har batch haath se check</small></div></li>
                <li><span>02</span><div><strong>Roast</strong><small>Perfectly balanced roasting</small></div></li>
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
                <a href="#collection" className="btn btn-accent">Explore Gifts</a>
              </div>
              <img src="/images/giftbox.webp" alt="Dry fruits gift box" loading="lazy" />
            </Reveal>
            <Reveal className="duo-card duo-dark">
              <div>
                <p className="eyebrow light">Subscription</p>
                <h3>Your Dry Fruits, On Repeat.</h3>
                <p>Har mahine fresh stock seedha aapke ghar — plan ki detail WhatsApp par lein.</p>
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
              <a href="#collection" className="btn btn-outline-dark">Shop All →</a>
            </Reveal>
            <div className="grid grid-3">
              {[
                ["raisins", "Sehat ka khazana: Kishmish jo har ghar mein honi chahiye", "Everyday"],
                ["apricots", "Khubani — paharon se aapki plate tak ka safar", "Our Story"],
                ["dates", "Ajwa Khajoor: ek khaas saugaat, ab aapke sheher mein", "Premium"],
              ].map(([img, t, tag]) => (
                <Reveal key={t} className="journal-card">
                  <img src={`/images/${img}.webp`} alt={t} loading="lazy" />
                  <span className="j-tag">{tag}</span>
                  <h4>{t}</h4>
                  <span className="j-link">Read Story →</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= POLICIES ================= */}
        <section className="section white" id="policies">
          <div className="container">
            <Reveal className="row-head">
              <div>
                <p className="eyebrow">Clear & Simple</p>
                <h2>Delivery, Payment & Support</h2>
              </div>
            </Reveal>
            <div className="grid grid-3">
              <Reveal className="policy-card">
                <div className="why-icon">🚚</div>
                <h3>Delivery</h3>
                <p>Delivery charges {fmt(SHOP.deliveryFee)} hain — {fmt(SHOP.freeDeliveryAbove)} ya us se zyada ke order par delivery <strong>bilkul FREE</strong> hai. Payment parcel milne par.</p>
              </Reveal>
              <Reveal className="policy-card">
                <div className="why-icon">💵</div>
                <h3>Payment</h3>
                <p><strong>Cash on Delivery (COD)</strong> — pehle apna order check karein, phir payment dein. Order website se ya seedha WhatsApp par bhi kar sakte hain.</p>
              </Reveal>
              <Reveal className="policy-card">
                <div className="why-icon">💬</div>
                <h3>Support</h3>
                <p>Order mein koi masla ho — ghalat ya kharab item milay — to WhatsApp par photo ke saath rabta karein, hum masla hal karenge. {SHOP.timing}.</p>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

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
            <a href="#collection">All Products</a><a href="#categories">Categories</a><a href="#handpicked">Bestsellers</a><a href="#signature">Signature Mix</a>
          </div>
          <div>
            <h4>About</h4>
            <a href="#story">Our Story</a><a href="#story">The Process</a><a href="#journal">Journal</a>
          </div>
          <div>
            <h4>Help</h4>
            <a href="#policies">Delivery & Payment</a><a href="#policies">Support</a><a href="#contact">Contact</a>
          </div>
          <div>
            <h4>Offers on WhatsApp</h4>
            <p>Newsletter ki jagah hum offers aur naye stock ki khabar WhatsApp par bhejte hain — wahi sab se tez tareeqa hai.</p>
            <a className="btn btn-whatsapp" href={waLink("Assalam-o-Alaikum! Mujhe Kashmir Dry Fruit ke offers aur updates chahiye.")} target="_blank" rel="noreferrer">💬 WhatsApp Par Updates Lein</a>
          </div>
        </div>
        <div className="footer-bottom container">
          <span>© {YEAR} {SHOP.name}. All rights reserved.</span>
          <span>Demo website — prices aur photos sample hain</span>
        </div>
      </footer>

      <a className="wa-float" href={waLink("Assalam-o-Alaikum! Mujhe dry fruits order karne hain.")} target="_blank" rel="noreferrer" aria-label="WhatsApp par order karein">💬</a>

      {/* ================= CART DRAWER ================= */}
      {drawer && <div className="overlay" onClick={() => setDrawer(false)} />}
      <aside className={`drawer ${drawer ? "open" : ""}`} aria-hidden={!drawer} inert={!drawer} aria-label="Shopping cart">
        <div className="drawer-head">
          <h3>🛍️ Aapka Cart</h3>
          <button onClick={() => setDrawer(false)} aria-label="Cart band karein">✕</button>
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
                      <button onClick={() => setItemQty(key, i.qty - 1)} aria-label="Kam karein">−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => setItemQty(key, i.qty + 1)} aria-label="Barhayein">+</button>
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
              <p className="persist-note">Cart aapke browser mein save rehta hai — page band karke wapas aayein to bhi items yahin milenge.</p>
            </div>
          </>
        )}
      </aside>

      {/* ================= PRODUCT DETAIL MODAL ================= */}
      {detail && (
        <DetailModal
          p={detail}
          wished={wishlist.includes(detail.id)}
          onWish={() => toggleWish(detail)}
          onAdd={addToCart}
          onClose={() => setDetail(null)}
        />
      )}

      {/* ================= CHECKOUT ================= */}
      {checkout && (
        <div className="modal-wrap">
          <div className="overlay" onClick={() => setCheckout(false)} />
          <form className="modal" onSubmit={placeOrder}>
            <h3>Checkout — Cash on Delivery</h3>
            <p className="modal-sub">Total payable: <strong>{fmt(total)}</strong> (delivery par cash dein). Form submit karne ke baad order WhatsApp par bhejna hoga — usi se order confirm hota hai.</p>
            <label>Poora Naam<input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Muhammad Ali" autoComplete="name" /></label>
            <label>Mobile Number<input required type="tel" pattern="[0-9+ -]{11,15}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx-xxxxxxx" autoComplete="tel" /></label>
            <label>Sheher (City)<input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Masalan: Rawalakot" autoComplete="address-level2" /></label>
            <label>Poora Address<textarea required rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Mohalla, gali, ghar number..." autoComplete="street-address" /></label>
            <button className="btn btn-accent btn-block btn-lg" type="submit">Order Tayyar Karein →</button>
            <button className="btn btn-ghost btn-block" type="button" onClick={() => setCheckout(false)}>Wapas Cart</button>
          </form>
        </div>
      )}

      {/* ================= ORDER (WhatsApp submission) ================= */}
      {order && (
        <div className="modal-wrap">
          <div className="overlay" />
          <div className="modal success">
            {!order.sent ? (
              <>
                <div className="success-icon">🧾</div>
                <h3>Ek aakhri step, {order.name.split(" ")[0]}!</h3>
                <p>Aapka order <strong>#{order.num}</strong> tayyar hai — Total (COD): <strong>{fmt(order.total)}</strong></p>
                <div className="order-summary">
                  {order.items.map((i) => (
                    <div key={`${i.p.id}-${i.weight}`}><span>{i.p.name} ({i.weight}) x{i.qty}</span><span>{fmt(priceFor(i.p, i.weight) * i.qty)}</span></div>
                  ))}
                </div>
                <p className="modal-sub">Order abhi shop tak <strong>nahi</strong> gaya. Neeche wala button dabakar WhatsApp par message bhejein — <strong>usi se aapka order confirm hoga.</strong></p>
                <a
                  className="btn btn-whatsapp btn-block btn-lg order-wa"
                  href={waLink(orderText)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOrder({ ...order, sent: true })}
                >
                  💬 WhatsApp Par Order Bhejein
                </a>
                <button className="btn btn-ghost btn-block" onClick={() => setOrder(null)}>Baad Mein Bhejunga</button>
              </>
            ) : (
              <>
                <div className="success-icon">🎉</div>
                <h3>Shukriya, {order.name.split(" ")[0]}!</h3>
                <p>Agar aapne WhatsApp par order <strong>#{order.num}</strong> ka message bhej diya hai, to aapka order process mein hai. Hum jald aapko call/message par confirm karenge.</p>
                <p className="modal-sub">Total (COD): <strong>{fmt(order.total)}</strong> — payment parcel milne par.</p>
                <button className="btn btn-accent btn-block btn-lg order-done" onClick={() => setOrder(null)}>Shopping Jari Rakhein</button>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

/* ---------- Product detail modal ---------- */
function DetailModal({ p, onAdd, onClose, wished, onWish }) {
  const [weight, setWeight] = useState("500g");
  const [qty, setQty] = useState(1);
  const price = priceFor(p, weight);
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  return (
    <div className="modal-wrap">
      <div className="overlay" onClick={onClose} />
      <div className="modal detail-modal" role="dialog" aria-modal="true" aria-label={`${p.name} details`}>
        <button ref={closeRef} className="modal-x" onClick={onClose} aria-label="Band karein">✕</button>
        <div className="detail-grid">
          <Thumb p={p} className="thumb-detail" eager />
          <div className="detail-info">
            <p className="eyebrow">{p.category} • {p.urdu}</p>
            <h3>{p.name}</h3>
            <p className="detail-desc">{p.desc}</p>
            <p className="detail-perkg">{fmt(p.priceKg)} / KG</p>
            <div className="weight-row">
              {WEIGHTS.map((w) => (
                <button key={w.id} className={`wpill dark-pill ${weight === w.id ? "on" : ""}`} onClick={() => setWeight(w.id)}>{w.label}</button>
              ))}
            </div>
            <div className="card-foot">
              <div className="qty qty-light">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Quantity kam karein">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)} aria-label="Quantity barhayein">+</button>
              </div>
              <div className="price dark-price">{fmt(price * qty)}</div>
            </div>
            <div className="detail-actions">
              <button
                className="btn btn-accent btn-lg"
                onClick={() => {
                  onAdd(p, weight, qty);
                  onClose();
                }}
              >
                Add to Cart
              </button>
              <WishBtn active={wished} onToggle={onWish} name={p.name} />
            </div>
            <ul className="detail-meta">
              <li>🚚 Delivery {fmt(SHOP.deliveryFee)} — {fmt(SHOP.freeDeliveryAbove)}+ par FREE</li>
              <li>💵 Payment: Cash on Delivery</li>
              <li>🧊 Storage: thandi, khushk jagah par airtight jar mein rakhein</li>
              <li>💬 Sawal? <a href={waLink(`Assalam-o-Alaikum! Mujhe ${p.name} ke bare mein maloomat chahiye.`)} target="_blank" rel="noreferrer">WhatsApp par poochein</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
