import { useEffect, useMemo, useState } from "react";
import "./AdminPage.css";

const API = import.meta.env.VITE_API_URL || "https://maasin-tour-guide-api.onrender.com";

const CATEGORIES = [
  "Nature", "Beach", "Religious", "Historical", "Adventure", "Cultural", "Other",
];

const EMPTY = {
  name: "", slug: "", description: "", category: "Nature", address: "",
  status: "published", entranceFee: "", estimatedTravelCost: "",
  latitude: "", longitude: "",
  gallery: "", highlights: "", facilities: "", travelTips: "", nearbyAttractions: "",
};

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const toLines = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
const fromLines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function spotToForm(s) {
  return {
    name: s.name || "", slug: s.slug || "", description: s.description || "",
    category: CATEGORIES.includes(s.category) ? s.category : "Other",
    address: s.address || "",
    status: s.status || "published",
    entranceFee: s.entranceFee ?? "", estimatedTravelCost: s.estimatedTravelCost ?? "",
    latitude: s.coordinates?.latitude ?? "", longitude: s.coordinates?.longitude ?? "",
    gallery: toLines(s.gallery), highlights: toLines(s.highlights),
    facilities: toLines(s.facilities), travelTips: toLines(s.travelTips),
    nearbyAttractions: toLines(s.nearbyAttractions),
  };
}

function formToPayload(f) {
  const payload = {
    name: f.name.trim(), slug: f.slug.trim(), description: f.description.trim(),
    category: f.category, address: f.address.trim(), status: f.status,
    gallery: fromLines(f.gallery), highlights: fromLines(f.highlights),
    facilities: fromLines(f.facilities), travelTips: fromLines(f.travelTips),
    nearbyAttractions: fromLines(f.nearbyAttractions),
  };
  if (f.entranceFee !== "") payload.entranceFee = Number(f.entranceFee);
  if (f.estimatedTravelCost !== "") payload.estimatedTravelCost = Number(f.estimatedTravelCost);
  if (f.latitude !== "" && f.longitude !== "") {
    payload.coordinates = { latitude: Number(f.latitude), longitude: Number(f.longitude) };
  }
  return payload;
}

function goToWebsite() {
  window.location.hash = "";
}

export default function AdminPage() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("adminTheme");
      if (saved === "dark" || saved === "light") return saved;
    } catch { /* ignore */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [token, setToken] = useState(() => sessionStorage.getItem("adminToken") || "");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [loginMsg, setLoginMsg] = useState({ text: "", type: "" });
  const [failedCount, setFailedCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null); // null = list view
  const [editingId, setEditingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("adminTheme", next); } catch { /* ignore */ }
  }

  function notify(text, type = "ok") {
    setToast({ text, type });
  }

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadSpots() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/spots`);
      const data = await res.json();
      setSpots(Array.isArray(data) ? data : data.spots || data.data || []);
    } catch {
      notify("Could not load spots. The server may be waking up; try again in a minute.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) loadSpots(); }, [token]);

  function logout(note) {
    sessionStorage.removeItem("adminToken");
    setToken("");
    setForm(null);
    setLoginMsg(note ? { text: note, type: "info" } : { text: "", type: "" });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginMsg({ text: "Logging in... the server may take up to a minute to wake up.", type: "info" });
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) {
          setBlocked(true);
        } else if (res.status === 401) {
          setFailedCount((n) => n + 1);
        }
        setLoginMsg({ text: data.message || `Login failed (${res.status}).`, type: "error" });
        return;
      }
      sessionStorage.setItem("adminToken", data.token);
      setToken(data.token);
      setLogin({ username: "", password: "" });
      setLoginMsg({ text: "", type: "" });
      setFailedCount(0);
      setBlocked(false);
      setShowForgot(false);
    } catch {
      setLoginMsg({ text: "Could not reach the server. Try again in a minute.", type: "error" });
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${API}/api/spots/${editingId}` : `${API}/api/spots`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders,
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { logout("Session expired. Please log in again."); return; }
      if (!res.ok) { notify(data.message || `Save failed (${res.status}).`, "error"); return; }
      notify(editingId ? "Spot updated." : "Spot added.");
      setForm(null);
      setEditingId(null);
      loadSpots();
    } catch {
      notify("Could not reach the server.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const spot = toDelete;
    setToDelete(null);
    try {
      const res = await fetch(`${API}/api/spots/${spot._id}`, { method: "DELETE", headers: authHeaders });
      if (res.status === 401) { logout("Session expired. Please log in again."); return; }
      if (!res.ok) { notify(`Delete failed (${res.status}).`, "error"); return; }
      notify("Spot deleted.");
      loadSpots();
    } catch {
      notify("Could not reach the server.", "error");
    }
  }

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !editingId) next.slug = slugify(value);
      return next;
    });
  };

  const stats = useMemo(() => ({
    total: spots.length,
    published: spots.filter((s) => s.status === "published").length,
    draft: spots.filter((s) => s.status === "draft").length,
  }), [spots]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spots.filter((s) => {
      const okCat = filterCat === "All" || s.category === filterCat;
      const okText = !q || `${s.name} ${s.address}`.toLowerCase().includes(q);
      return okCat && okText;
    });
  }, [spots, search, filterCat]);

  const themeBtn = (
    <button type="button" className="adm-btn adm-icon-btn" onClick={toggleTheme}
      title="Switch light or dark mode" aria-label="Switch light or dark mode">
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );

  const toastEl = toast && (
    <div className={`adm-toast ${toast.type === "error" ? "adm-toast-error" : ""}`}>{toast.text}</div>
  );

  /* ---------- Login screen ---------- */
  if (!token) {
    const offerForgot = failedCount >= 3 || blocked;
    return (
      <div className="adm" data-theme={theme}>
        <div className="adm-login-wrap">
          <div className="adm-card adm-login">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="adm-logo">🏝️</div>
              {themeBtn}
            </div>
            <h1>Admin login</h1>
            <p className="adm-sub">Maasin Tour Guide. Sign in to manage tourist spots.</p>
            {loginMsg.text && (
              <div className={loginMsg.type === "error" ? "adm-error" : "adm-info"}>{loginMsg.text}</div>
            )}
            <form onSubmit={handleLogin}>
              <label className="adm-label">Username</label>
              <input className="adm-input" autoComplete="username" required
                value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} />
              <label className="adm-label">Password</label>
              <input className="adm-input" type="password" autoComplete="current-password" required
                value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
              <button type="submit" className="adm-btn adm-btn-primary" style={{ width: "100%" }}>Log in</button>
            </form>

            {offerForgot && (
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button type="button" className="adm-btn adm-btn-sm"
                  onClick={() => setShowForgot((v) => !v)}>
                  {showForgot ? "Hide help" : "Forgot password?"}
                </button>
              </div>
            )}

            {offerForgot && showForgot && (
              <div className="adm-info" style={{ marginTop: 12, textAlign: "left" }}>
                <b>How to reset the admin password</b>
                <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                  <li>Log in to Render and open the <b>maasin-tour-guide-api</b> service.</li>
                  <li>Click <b>Environment</b> in the left menu.</li>
                  <li>Find <b>ADMIN_PASSWORD</b>, click Edit, and type a new password.</li>
                  <li>Click <b>Save changes</b>. Render restarts the server (this can take a few minutes).</li>
                  <li>Log in here with the new password.</li>
                </ol>
                <p style={{ margin: "8px 0 0" }}>
                  After 10 wrong tries the server blocks your address for 15 minutes.
                  If you are blocked, wait 15 minutes and try again.
                </p>
              </div>
            )}

            <button type="button" className="adm-btn" style={{ width: "100%", marginTop: 10 }}
              onClick={goToWebsite}>← Back to website</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Add / Edit form ---------- */
  if (form) {
    const firstPic = fromLines(form.gallery)[0];
    return (
      <div className="adm" data-theme={theme}>
        <header className="adm-top">
          <div className="adm-brand"><div className="adm-logo">🏝️</div>Maasin Admin</div>
          <div className="adm-top-actions">
            <button type="button" className="adm-btn" onClick={goToWebsite}>← Website</button>
            {themeBtn}
          </div>
        </header>
        <main className="adm-main">
          <form onSubmit={handleSave}>
            <div className="adm-form-head">
              <div>
                <h2 className="adm-title">{editingId ? "Edit spot" : "Add a new spot"}</h2>
                <p className="adm-sub" style={{ margin: 0 }}>Fields marked * are required.</p>
              </div>
              <button type="button" className="adm-btn"
                onClick={() => { setForm(null); setEditingId(null); }}>← Back</button>
            </div>

            <section className="adm-card adm-section">
              <h3>Basics</h3>
              <label className="adm-label">Name *</label>
              <input className="adm-input" required value={form.name} onChange={set("name")} />
              <label className="adm-label">Slug * <span className="adm-hint">(made from the name; lowercase letters, numbers, hyphens)</span></label>
              <input className="adm-input" required pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={form.slug} onChange={set("slug")} />
              <label className="adm-label">Description * <span className="adm-hint">(at least 10 characters)</span></label>
              <textarea className="adm-textarea" required minLength={10} rows={4}
                value={form.description} onChange={set("description")} />
              <div className="adm-grid">
                <div>
                  <label className="adm-label">Category *</label>
                  <select className="adm-select" value={form.category} onChange={set("category")}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="adm-label">Status <span className="adm-hint">(the public site shows only "published")</span></label>
                  <select className="adm-select" value={form.status} onChange={set("status")}>
                    <option>published</option><option>draft</option><option>inactive</option>
                  </select>
                </div>
              </div>
              <label className="adm-label">Address *</label>
              <input className="adm-input" required value={form.address} onChange={set("address")} />
            </section>

            <section className="adm-card adm-section">
              <h3>Costs and location</h3>
              <div className="adm-grid">
                <div>
                  <label className="adm-label">Entrance fee <span className="adm-hint">(optional)</span></label>
                  <input className="adm-input" type="number" min="0" value={form.entranceFee} onChange={set("entranceFee")} />
                </div>
                <div>
                  <label className="adm-label">Estimated travel cost <span className="adm-hint">(optional)</span></label>
                  <input className="adm-input" type="number" min="0" value={form.estimatedTravelCost} onChange={set("estimatedTravelCost")} />
                </div>
                <div>
                  <label className="adm-label">Latitude <span className="adm-hint">(fill both or neither)</span></label>
                  <input className="adm-input" type="number" step="any" value={form.latitude} onChange={set("latitude")} />
                </div>
                <div>
                  <label className="adm-label">Longitude</label>
                  <input className="adm-input" type="number" step="any" value={form.longitude} onChange={set("longitude")} />
                </div>
              </div>
            </section>

            <section className="adm-card adm-section">
              <h3>Pictures</h3>
              {firstPic && <img className="adm-preview" src={firstPic} alt="Preview of the first picture" />}
              <label className="adm-label">Picture addresses <span className="adm-hint">(one per line, like /images/libhu.jpg or https://...)</span></label>
              <textarea className="adm-textarea" rows={3} value={form.gallery} onChange={set("gallery")} />
            </section>

            <section className="adm-card adm-section">
              <h3>Details <span className="adm-hint">(one item per line)</span></h3>
              <label className="adm-label">Highlights</label>
              <textarea className="adm-textarea" rows={3} value={form.highlights} onChange={set("highlights")} />
              <label className="adm-label">Facilities</label>
              <textarea className="adm-textarea" rows={3} value={form.facilities} onChange={set("facilities")} />
              <label className="adm-label">Travel tips</label>
              <textarea className="adm-textarea" rows={3} value={form.travelTips} onChange={set("travelTips")} />
              <label className="adm-label">Nearby attractions</label>
              <textarea className="adm-textarea" rows={3} value={form.nearbyAttractions} onChange={set("nearbyAttractions")} />
            </section>

            <div className="adm-form-foot">
              <button type="button" className="adm-btn"
                onClick={() => { setForm(null); setEditingId(null); }}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save spot"}
              </button>
            </div>
          </form>
        </main>
        {toastEl}
      </div>
    );
  }

  /* ---------- Spots list ---------- */
  return (
    <div className="adm" data-theme={theme}>
      <header className="adm-top">
        <div className="adm-brand"><div className="adm-logo">🏝️</div>Maasin Admin</div>
        <div className="adm-top-actions">
          <button type="button" className="adm-btn" onClick={goToWebsite}>← Website</button>
          {themeBtn}
          <button type="button" className="adm-btn" onClick={() => logout("")}>Log out</button>
        </div>
      </header>

      <main className="adm-main">
        <h1 className="adm-title">Tourist spots</h1>
        <p className="adm-sub">Add, edit or delete the places shown on the site.</p>

        <div className="adm-stats">
          <div className="adm-card adm-stat"><b>{stats.total}</b><span>Total</span></div>
          <div className="adm-card adm-stat"><b>{stats.published}</b><span>Published</span></div>
          <div className="adm-card adm-stat"><b>{stats.draft}</b><span>Drafts</span></div>
        </div>

        <div className="adm-card">
          <div className="adm-toolbar">
            <input className="adm-input" placeholder="Search by name or address..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="adm-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option>All</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button type="button" className="adm-btn adm-btn-primary"
              onClick={() => { setForm({ ...EMPTY }); setEditingId(null); }}>+ Add spot</button>
          </div>

          {loading ? (
            <div className="adm-empty">Loading spots... the server may take up to a minute to wake up.</div>
          ) : visible.length === 0 ? (
            <div className="adm-empty">
              {spots.length === 0 ? "No spots yet. Click \"+ Add spot\" to create the first one." : "No spots match your search."}
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Spot</th><th className="adm-col-cat">Category</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {visible.map((s) => {
                    const pic = Array.isArray(s.gallery) ? s.gallery[0] : null;
                    return (
                      <tr key={s._id}>
                        <td>
                          <div className="adm-spot">
                            {pic ? <img className="adm-thumb" src={pic} alt="" /> : <div className="adm-thumb">🏝️</div>}
                            <div>
                              <div className="adm-spot-name">{s.name}</div>
                              <div className="adm-spot-addr">{s.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="adm-col-cat">{s.category}</td>
                        <td><span className={`adm-badge adm-badge-${s.status}`}>{s.status}</span></td>
                        <td>
                          <div className="adm-actions">
                            <button type="button" className="adm-btn adm-btn-sm"
                              onClick={() => { setForm(spotToForm(s)); setEditingId(s._id); }}>Edit</button>
                            <button type="button" className="adm-btn adm-btn-sm adm-btn-danger"
                              onClick={() => setToDelete(s)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {toDelete && (
        <div className="adm-overlay" onClick={() => setToDelete(null)}>
          <div className="adm-card adm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this spot?</h3>
            <p>"{toDelete.name}" will be removed for good. This cannot be undone.</p>
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn" onClick={() => setToDelete(null)}>Cancel</button>
              <button type="button" className="adm-btn adm-btn-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" }}
                onClick={confirmDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
      {toastEl}
    </div>
  );
}