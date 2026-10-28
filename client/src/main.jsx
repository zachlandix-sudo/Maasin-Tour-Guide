import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AdminPage from "./AdminPage.jsx";
import "./index.css";
import "./SiteDarkMode.css";

const adminLinkStyle = {
  position: "fixed",
  bottom: 12,
  left: 12,
  zIndex: 50,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  background: "rgba(255, 255, 255, 0.9)",
  color: "#0f5f4a",
  textDecoration: "none",
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
};

// Marks every element that has a background photo so dark mode leaves it alone.
function markPhotoBackgrounds() {
  document.querySelectorAll("body *").forEach((el) => {
    if (el.classList.contains("keep-photo")) return;
    if (el.parentElement?.closest(".keep-photo")) return;
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg.includes("url(")) el.classList.add("keep-photo");
  });
}

function Root() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash === "#admin");
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("siteTheme");
      if (saved === "dark" || saved === "light") return saved === "dark";
    } catch { /* ignore */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    const onHashChange = () => setIsAdmin(window.location.hash === "#admin");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.siteTheme = !isAdmin && dark ? "dark" : "light";
  }, [dark, isAdmin]);

  useEffect(() => {
    if (isAdmin || !dark) return undefined;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(markPhotoBackgrounds, 150);
    };
    markPhotoBackgrounds();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [dark, isAdmin]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("siteTheme", next ? "dark" : "light"); } catch { /* ignore */ }
  }

  if (isAdmin) return <AdminPage />;

  return (
    <BrowserRouter>
      <App />
      <a href="#admin" style={adminLinkStyle}>Admin login</a>
      <button type="button" className="site-theme-btn" onClick={toggleDark}
        aria-label="Switch light or dark mode">
        {dark ? "☀️ Light" : "🌙 Dark"}
      </button>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);