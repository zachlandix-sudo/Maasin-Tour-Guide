
import { Link, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import DestinationDetails from "./components/Destination.jsx";
import AboutUs from "./components/AboutUs";
import SmartRoutePlanner from "./components/SmartRoutePlanner.jsx";
import ChatWidget from "./ChatWidget.jsx";
import Contribute from "./pages/Contribute.jsx";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const categories = [
  { name: "Nature & Waterfalls", icon: "🌿", category: "Nature" },
  { name: "Beaches & Islands", icon: "🏝️", category: "Beach" },
  { name: "Culture & Heritage", icon: "🏛️", category: "Cultural" },
  { name: "Adventure", icon: "🥾", category: "Adventure" },
];

const heroImage =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=85";

function getSpotId(spot) {
  return spot?._id || spot?.id;
}

function Navbar({ onAboutClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <a className="brand" href="#home" aria-label="Maasin Tour Guide home">
        <span className="brand-icon">M</span>
        <span>
          <strong>MAASIN</strong>
          <small>TOUR GUIDE</small>
        </span>
      </a>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
        <a href="#home" onClick={() => setMenuOpen(false)}>
          Home
        </a>
        <a href="#destinations" onClick={() => setMenuOpen(false)}>
          Destinations
        </a>
        <a href="#itinerary" onClick={() => setMenuOpen(false)}>
          AI Itinerary
        </a>
        <a href="#route-planner" onClick={() => setMenuOpen(false)}>
          Route Planner
        </a>
        <a href="#categories" onClick={() => setMenuOpen(false)}>
          Categories
        </a>
        <button
          type="button"
          className="nav-about-trigger"
          onClick={() => {
            setMenuOpen(false);
            onAboutClick();
          }}
        >
          About Maasin <span>✦</span>
        </button>
        <a
          className="nav-cta"
          href="#destinations"
          onClick={() => setMenuOpen(false)}
        >
          Explore places ↗
        </a>
      </nav>
    </header>
  );
}

function DestinationCard({ spot }) {
  const id = getSpotId(spot);
  const image =
    spot.imageUrl ||
    spot.image ||
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80";

  return (
    <article className="destination-card">
      <Link
        className="destination-image"
        to={id ? `/spots/${id}` : "/"}
        aria-label={`View ${spot.name}`}
      >
        <img src={image} alt={spot.name} loading="lazy" />
        <span className="image-category">
          {spot.category || "Destination"}
        </span>
      </Link>

      <div className="destination-info">
        <p className="destination-location">
          📍 {spot.address || "Maasin City, Southern Leyte"}
        </p>
        <h3>{spot.name || "Untitled destination"}</h3>
        <p className="destination-description">
          {spot.description ||
            "Discover this beautiful destination in Southern Leyte."}
        </p>

        <div className="destination-bottom">
          <span>
            Entrance fee:{" "}
            <strong>
              {spot.entranceFee != null
                ? `₱${spot.entranceFee}`
                : "Check locally"}
            </strong>
          </span>

          {id ? (
            <Link
              className="card-arrow"
              to={`/spots/${id}`}
              aria-label={`Explore ${spot.name}`}
            >
              ↗
            </Link>
          ) : (
            <span className="card-arrow">↗</span>
          )}
        </div>
      </div>
    </article>
  );
}

function HomePage() {
  const location = useLocation();

  const [aboutOpen, setAboutOpen] = useState(false);
  const [spots, setSpots] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [travelers, setTravelers] = useState(2);
  const [startingBudgetPerPerson, setStartingBudgetPerPerson] = useState(1000);
  const [interests, setInterests] = useState([
    "Nature",
    "Religious",
    "Historical",
    "Beach",
    "Adventure",
    "Cultural",
    "Waterfalls & Rivers",
    "Islands & Snorkeling",
    "Mountains & Hiking",
    "Food & Local Cuisine",
    "Festivals & Events",
    "Parks & Recreation",
  ]);
  const [pace, setPace] = useState("packed");
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [itineraryError, setItineraryError] = useState("");
  const [itinerary, setItinerary] = useState(null);

  // Fetch destinations only once.
  useEffect(() => {
    const controller = new AbortController();

    async function loadSpots() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/spots`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`The server returned status ${response.status}.`);
        }

        const result = await response.json();
        const records = Array.isArray(result)
          ? result
          : result.spots || result.data || result.results || [];

        setSpots(records);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load destinations:", err);
          setError(
            err.message || "We couldn't load destinations from the server."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSpots();
    return () => controller.abort();
  }, []);

  // Scroll to the destinations section when requested.
  useEffect(() => {
    const shouldScroll =
      location.hash === "#destinations" ||
      sessionStorage.getItem("scrollToDestinations") === "true";

    if (!shouldScroll || loading) return;

    const frame = requestAnimationFrame(() => {
      const section = document.getElementById("destinations");

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        sessionStorage.removeItem("scrollToDestinations");
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, loading, spots]);

  const filteredSpots = spots.filter((spot) => {
    const text =
      `${spot.name || ""} ${spot.description || ""} ${spot.address || ""}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory =
      !category ||
      String(spot.category || "").toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  async function handleGenerateItinerary(event) {
    event.preventDefault();
    setGeneratingItinerary(true);
    setItineraryError("");
    setItinerary(null);

    try {
      const response = await fetch(`${API_URL}/itineraries/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          travelers: Number(travelers),
          startingBudgetPerPerson: Number(startingBudgetPerPerson),
          interests,
          pace,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error?.message ||
            `Request failed with status ${response.status}.`
        );
      }

      if (!result.itinerary) {
        throw new Error("The server did not return an itinerary.");
      }

      setItinerary(result.itinerary);
    } catch (err) {
      setItineraryError(
        err.message || "Unable to generate your itinerary. Please try again."
      );
    } finally {
      setGeneratingItinerary(false);
    }
  }

  if (aboutOpen) {
    return <AboutUs onClose={() => setAboutOpen(false)} />;
  }

  return (
    <>
      <Navbar onAboutClick={() => setAboutOpen(true)} />

      <main>
        <section
          className="hero"
          id="home"
          style={{ "--hero-image": `url("${heroImage}")` }}
        >
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow">
              SOUTHERN LEYTE, PHILIPPINES
            </span>
            <h1>
              Find your next
              <br />
              <em>beautiful escape.</em>
            </h1>
            <p>
              Discover hidden gems, breathtaking landscapes, and unforgettable
              experiences in Maasin City.
            </p>
            <a className="primary-button" href="#destinations">
              Discover destinations <span>↗</span>
            </a>
            <div className="hero-note">
              <span className="hero-note-icon">✦</span>
              <span>Local places. Real experiences. Lasting memories.</span>
            </div>
          </div>

          <div className="hero-caption">
            <span>01 / EXPLORE THE UNEXPECTED</span>
            <span>MAASIN CITY · SOUTHERN LEYTE</span>
          </div>
        </section>

        <section className="intro-strip">
          <div>
            <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
            <h2>There's more to discover.</h2>
          </div>
          <p>
            From peaceful coastlines to cultural landmarks, find places worth
            experiencing at your own pace.
          </p>
        </section>

        <SmartRoutePlanner spots={spots} />

        <section className="itinerary-section section-wrap" id="itinerary">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR PERSONAL TRAVEL PLANNER</span>
              <h2>Build your Maasin itinerary.</h2>
              <p className="section-subtitle">
                Tell our AI about your trip and get a personalized one-day plan.
              </p>
            </div>
          </div>

          <form className="itinerary-form" onSubmit={handleGenerateItinerary}>
            <div className="itinerary-fields">
              <label>
                Travelers
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={travelers}
                  onChange={(event) => setTravelers(event.target.value)}
                />
              </label>

              <label>
                Budget per person (₱)
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  required
                  value={startingBudgetPerPerson}
                  onChange={(event) =>
                    setStartingBudgetPerPerson(event.target.value)
                  }
                />
              </label>

              <label>
                Preferred pace
                <select
                  value={pace}
                  onChange={(event) => setPace(event.target.value)}
                >
                  <option value="relaxed">Relaxed</option>
                  <option value="moderate">Moderate</option>
                  <option value="packed">Packed</option>
                </select>
              </label>
            </div>

            <fieldset className="interest-picker">
              <legend>Choose your interests</legend>
              <div className="interest-options">
                {[
                  "Nature",
                  "Religious",
                  "Historical",
                  "Beach",
                  "Adventure",
                  "Cultural",
                ].map((interest) => (
                  <label key={interest} className="interest-option">
                    <input
                      type="checkbox"
                      checked={interests.includes(interest)}
                      onChange={(event) => {
                        setInterests((current) =>
                          event.target.checked
                            ? [...current, interest]
                            : current.filter((item) => item !== interest)
                        );
                      }}
                    />
                    {interest}
                  </label>
                ))}
              </div>
            </fieldset>

            {itineraryError && (
              <p className="itinerary-error" role="alert">
                {itineraryError}
              </p>
            )}

            <button
              className="primary-button itinerary-submit"
              type="submit"
              disabled={generatingItinerary || interests.length === 0}
            >
              {generatingItinerary
                ? "Generating your itinerary..."
                : "✨ Generate My Itinerary"}
            </button>
          </form>

          {generatingItinerary && (
            <div className="status-message" aria-live="polite">
              <span className="loader" />
              <p>Planning your one-day Maasin adventure...</p>
            </div>
          )}

          {itinerary && (
            <article className="itinerary-result" id="itinerary-result">
              <div className="itinerary-result-header">
                <div>
                  <span className="eyebrow">YOUR AI-GENERATED PLAN</span>
                  <h3>{itinerary.title}</h3>
                  <p>{itinerary.summary}</p>
                </div>
                <button
                  type="button"
                  className="secondary-button no-print"
                  onClick={() => window.print()}
                >
                  Print / Save PDF
                </button>
              </div>

              <div className="itinerary-meta">
                <span>{itinerary.travelers} travelers</span>
                <span>{itinerary.pace} pace</span>
                <span>{itinerary.duration}</span>
                <span>ID: {itinerary._id}</span>
              </div>

              <h4>Day schedule</h4>
              <div className="itinerary-stops">
                {itinerary.stops?.map((stop, index) => (
                  <div
                    className="itinerary-stop"
                    key={`${stop.touristSpot}-${index}`}
                  >
                    <div className="stop-time">
                      <strong>{stop.startTime}</strong>
                      <span>{stop.endTime}</span>
                    </div>
                    <div className="stop-details">
                      <h5>{stop.name}</h5>
                      <p>{stop.activity}</p>
                      <small>
                        Entrance: ₱
                        {Number(
                          stop.estimatedEntranceFeePerPerson || 0
                        ).toLocaleString("en-PH")}
                        {" per person · Transport: ₱"}
                        {Number(
                          stop.estimatedTransportCostForGroup || 0
                        ).toLocaleString("en-PH")}
                        {" for group"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              <h4>Estimated budget</h4>
              <div className="itinerary-budget">
                <div>
                  <span>Entrance fees</span>
                  <strong>
                    ₱
                    {Number(
                      itinerary.budget?.entranceFees || 0
                    ).toLocaleString("en-PH")}
                  </strong>
                </div>
                <div>
                  <span>Transportation</span>
                  <strong>
                    ₱
                    {Number(
                      itinerary.budget?.transportation || 0
                    ).toLocaleString("en-PH")}
                  </strong>
                </div>
                <div>
                  <span>Food</span>
                  <strong>
                    ₱
                    {Number(itinerary.budget?.food || 0).toLocaleString("en-PH")}
                  </strong>
                </div>
                <div className="budget-total">
                  <span>Total group estimate</span>
                  <strong>
                    ₱
                    {Number(
                      itinerary.budget?.totalGroupCost || 0
                    ).toLocaleString("en-PH")}
                  </strong>
                </div>
                <div>
                  <span>Estimated cost per person</span>
                  <strong>
                    ₱
                    {Number(
                      itinerary.budget?.totalPerPerson || 0
                    ).toLocaleString("en-PH")}
                  </strong>
                </div>
                <div>
                  <span>Group budget remaining</span>
                  <strong>
                    ₱
                    {Number(
                      itinerary.budget?.remainingGroupBudget || 0
                    ).toLocaleString("en-PH")}
                  </strong>
                </div>
              </div>

              {itinerary.travelTips?.length > 0 && (
                <>
                  <h4>Travel tips</h4>
                  <ul className="itinerary-tips">
                    {itinerary.travelTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </>
              )}

              <p className="itinerary-disclaimer">
                Costs are estimates and may not reflect current local prices.
                Confirm fees, transport, food costs, and opening hours before
                traveling.
              </p>
            </article>
          )}
        </section>

        <section className="categories-section section-wrap" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE YOUR WAY</span>
              <h2>What are you looking for?</h2>
            </div>
            <a href="#destinations" className="text-link">
              All destinations ↗
            </a>
          </div>

          <div className="category-grid">
            {categories.map((item) => (
              <button
                type="button"
                className={`category-card ${
                  category === item.category ? "category-active" : ""
                }`}
                key={item.name}
                onClick={() =>
                  setCategory((current) =>
                    current === item.category ? "" : item.category
                  )
                }
              >
                <span className="category-icon">{item.icon}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>Explore destinations ↗</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="destinations-section" id="destinations">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">MAASIN AND BEYOND</span>
                <h2>Explore destinations.</h2>
                <p className="section-subtitle">
                  Find a place that makes you want to stay a little longer.
                </p>
              </div>
              <span className="spot-count">
                {spots.length} {spots.length === 1 ? "PLACE" : "PLACES"} FOUND
              </span>
            </div>

            <div className="search-panel">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search destinations, places, or experiences..."
                aria-label="Search destinations"
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                <option value="Nature">Nature</option>
                <option value="Beach">Beach</option>
                <option value="Cultural">Cultural</option>
                <option value="Adventure">Adventure</option>
                <option value="Religious">Religious</option>
                <option value="Historical">Historical</option>
                <option value="Waterfalls & Rivers">Waterfalls & Rivers</option>
                <option value="Islands & Snorkeling">Islands & Snorkeling</option>
                <option value="Mountains & Hiking">Mountains & Hiking</option>
                <option value="Food & Local Cuisine">Food & Local Cuisine</option>
                <option value="Festivals & Events">Festivals & Events</option>
                <option value="Parks & Recreation">Parks & Recreation</option>
              </select>
            </div>

            {loading ? (
              <div className="status-message">
                <span className="loader" />
                <p>Discovering places for you...</p>
              </div>
            ) : error ? (
              <div className="status-message error-message">
                <span>⚠</span>
                <h3>Destinations aren't available yet.</h3>
                <p>{error}</p>
                <button
                  className="secondary-button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : filteredSpots.length ? (
              <div className="destination-grid">
                {filteredSpots.map((spot, index) => (
                  <DestinationCard
                    key={
                      getSpotId(spot) || spot.slug || `${spot.name}-${index}`
                    }
                    spot={spot}
                  />
                ))}
              </div>
            ) : (
              <div className="status-message">
                <span>⌕</span>
                <h3>No destinations found.</h3>
                <p>
                  {spots.length
                    ? "Try another search or choose a different category."
                    : "Your destinations will appear here when records are available in your database."}
                </p>
                {(search || category) && (
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setSearch("");
                      setCategory("");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="closing-cta">
          <span className="eyebrow">YOUR NEXT ADVENTURE AWAITS</span>
          <h2>Make room for wonder.</h2>
          <p>Start exploring Maasin City, one destination at a time.</p>
          <a className="light-button" href="#destinations">
            Find your destination ↗
          </a>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">M</span>
          <span>
            <strong>MAASIN</strong>
            <small>TOUR GUIDE</small>
          </span>
        </a>
        <p>Discover Maasin. Experience Southern Leyte.</p>
        <a href="#home">Back to top ↑</a>
        <small className="copyright">
          © {new Date().getFullYear()} Maasin Tour Guide
        </small>
      </footer>
    </>
  );
}

function App() {
  return (
    <>
      <Routes>
      <Route path="/spots/:id" element={<DestinationDetails />} />
      <Route path="*" element={<HomePage />} />
      </Routes>
      <ChatWidget />
    </>
  );
}

export default App;
