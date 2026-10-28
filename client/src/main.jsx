import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AdminPage from "./AdminPage.jsx";
import "./index.css";

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

function Root() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash === "#admin");

  useEffect(() => {
    const onHashChange = () => setIsAdmin(window.location.hash === "#admin");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (isAdmin) return <AdminPage />;

  return (
    <BrowserRouter>
      <App />
      <a href="#admin" style={adminLinkStyle}>Admin login</a>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);