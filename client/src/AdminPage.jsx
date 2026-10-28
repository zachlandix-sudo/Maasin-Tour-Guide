import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://maasin-tour-guide-api.onrender.com";

const CATEGORIES = [
  "Nature", "Beach", "Religious", "Historical", "Adventure", "Cultural", "Other",
  "Waterfalls & Rivers", "Islands & Snorkeling", "Mountains & Hiking",
  "Food & Local Cuisine", "Festivals & Events", "Parks & Recreation",
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
    category: s.category || "Other", address: s.address || "",
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

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("adminToken") || "");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [spots, setSpots] = useState([]);
  const [form, setForm] = useState(null); // null = hidden
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function loadSpots() {
    try {
      const res = await fetch(`${API}/api/spots`);
      const data = await res.json();
      setSpots(Array.isArray(data) ? data : data.spots || data.data || []);
    } catch {
      setMessage("Could not load spots. The server may be waking up; try again in a minute.");
    }
  }

  useEffect(() => { if (token) loadSpots(); }, [token]);

  function logout(note) {
    sessionStorage.removeItem("adminToken");
    setToken("");
    if (note) setMessage(note);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("Logging in... (the server may take up to a minute to wake up)");
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(data.message || `Login failed (${res.status}).`); return; }
      sessionStorage.setItem("adminToken", data.token);
      setToken(data.token);
      setLogin({ username: "", password: "" });
      setMessage("");
    } catch {
      setMessage("Could not reach the server.");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const url = editingId ? `${API}/api/spots/${editingId}` : `${API}/api/spots`;
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: authHeaders,
      body: JSON.stringify(formToPayload(form)),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { logout("Session expired. Please log in again."); return; }
    if (!res.ok) { setMessage(data.message || `Save failed (${res.status}).`); return; }
    setMessage(editingId ? "Spot updated." : "Spot added.");
    setForm(null); setEditingId(null);
    loadSpots();
  }

  async function handleDelete(spot) {
    if (!window.confirm(`Delete "${spot.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API}/api/spots/${spot._id}`, { method: "DELETE", headers: authHeaders });
    if (res.status === 401) { logout("Session expired. Please log in again."); return; }
    if (!res.ok) { setMessage(`Delete failed (${res.status}).`); return; }
    setMessage("Spot deleted.");
    loadSpots();
  }

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !editingId) next.slug = slugify(value);
      return next;
    });
  };

  const box = { display: "block", width: "100%", padding: 8, marginBottom: 10, boxSizing: "border-box" };
  const wrap = { maxWidth: 900, margin: "0 auto", padding: 16, fontFamily: "sans-serif" };

  if (!token) {
    return (
      <div style={{ ...wrap, maxWidth: 360 }}>
        <h2>Admin login</h2>
        <form onSubmit={handleLogin}>
          <input style={box} placeholder="Username" autoComplete="username"
            value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} />
          <input style={box} type="password" placeholder="Password" autoComplete="current-password"
            value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
          <button type="submit">Log in</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    );
  }

  if (form) {
    return (
      <div style={wrap}>
        <h2>{editingId ? "Edit spot" : "Add spot"}</h2>
        <form onSubmit={handleSave}>
          <label>Name</label>
          <input style={box} required value={form.name} onChange={set("name")} />
          <label>Slug (auto from name; lowercase letters, numbers, hyphens)</label>
          <input style={box} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={set("slug")} />
          <label>Description (at least 10 characters)</label>
          <textarea style={box} required minLength={10} rows={4} value={form.description} onChange={set("description")} />
          <label>Category</label>
          <select style={box} value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label>Address</label>
          <input style={box} required value={form.address} onChange={set("address")} />
          <label>Status (the public site shows only "published")</label>
          <select style={box} value={form.status} onChange={set("status")}>
            <option>published</option><option>draft</option><option>inactive</option>
          </select>
          <label>Entrance fee (number, optional)</label>
          <input style={box} type="number" min="0" value={form.entranceFee} onChange={set("entranceFee")} />
          <label>Estimated travel cost (number, optional)</label>
          <input style={box} type="number" min="0" value={form.estimatedTravelCost} onChange={set("estimatedTravelCost")} />
          <label>Latitude and longitude (optional, fill both)</label>
          <input style={box} type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={set("latitude")} />
          <input style={box} type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={set("longitude")} />
          <label>Pictures: one web address per line (like /images/libhu.jpg or https://...)</label>
          <textarea style={box} rows={3} value={form.gallery} onChange={set("gallery")} />
          <label>Highlights (one per line)</label>
          <textarea style={box} rows={3} value={form.highlights} onChange={set("highlights")} />
          <label>Facilities (one per line)</label>
          <textarea style={box} rows={3} value={form.facilities} onChange={set("facilities")} />
          <label>Travel tips (one per line)</label>
          <textarea style={box} rows={3} value={form.travelTips} onChange={set("travelTips")} />
          <label>Nearby attractions (one per line)</label>
          <textarea style={box} rows={3} value={form.nearbyAttractions} onChange={set("nearbyAttractions")} />
          <button type="submit">Save</button>{" "}
          <button type="button" onClick={() => { setForm(null); setEditingId(null); }}>Cancel</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    );
  }

  return (
    <div style={wrap}>
      <h2>Manage tourist spots</h2>
      <button onClick={() => { setForm({ ...EMPTY }); setEditingId(null); setMessage(""); }}>+ Add spot</button>{" "}
      <button onClick={() => logout("")}>Log out</button>
      {message && <p>{message}</p>}
      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr><th align="left">Name</th><th align="left">Category</th><th align="left">Status</th><th /></tr>
        </thead>
        <tbody>
          {spots.map((s) => (
            <tr key={s._id} style={{ borderTop: "1px solid #ccc" }}>
              <td>{s.name}</td><td>{s.category}</td><td>{s.status}</td>
              <td align="right">
                <button onClick={() => { setForm(spotToForm(s)); setEditingId(s._id); setMessage(""); }}>Edit</button>{" "}
                <button onClick={() => handleDelete(s)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}