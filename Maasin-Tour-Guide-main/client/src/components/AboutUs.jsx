
import "./AboutUs.css";

const features = [
  {
    number: "01",
    icon: "✦",
    title: "AI Itinerary Planner",
    description:
      "Create a personalized one-day adventure based on your interests, budget, and travel pace.",
  },
  {
    number: "02",
    icon: "⌖",
    title: "Local Discoveries",
    description:
      "Find natural attractions, cultural landmarks, beaches, and memorable local experiences.",
  },
  {
    number: "03",
    icon: "↗",
    title: "Smart Route Planning",
    description:
      "Organize destinations into a convenient route and spend more time enjoying your journey.",
  },
];

export default function AboutUs({ onClose })  {
  return (
    <div className="mtg-about-page">
      <section className="mtg-about" id="about">
  <button
    type="button"
    className="mtg-about-close"
    onClick={onClose}
    aria-label="Close About Maasin"
  >
    <span>×</span> Close
  </button>

  {/* Keep all your existing About Us content below */}

      <div className="mtg-about-hero">
        <div className="mtg-about-hero-copy">
          <span className="mtg-about-label">ABOUT MAASIN TOUR GUIDE</span>

          <h2>
            Discover Maasin City.
            <span>Find your own kind of wonder.</span>
          </h2>

          <p>
            A city rich in culture, natural beauty, and warm hospitality.
            We're here to help you discover the places, people, and experiences
            that make Maasin City special.
          </p>

          <a className="mtg-about-button" href="#destinations">
            Explore destinations <span>↗</span>
          </a>

          <div className="mtg-about-location">
            <span>●</span>
            Southern Leyte, Philippines
          </div>
        </div>

        <div className="mtg-about-hero-image">
          <img
            src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=85"
            alt="Turquoise tropical ocean and coastal scenery"
            loading="lazy"
          />
          <div className="mtg-about-image-overlay">
            <span>YOUR NEXT ADVENTURE</span>
            <strong>Starts in Maasin.</strong>
          </div>
          <span className="mtg-about-image-index">SOUTHERN LEYTE · PH</span>
        </div>
      </div>

      <div className="mtg-about-story">
        <div className="mtg-about-story-visual">
          <div className="mtg-about-photo mtg-about-photo-main">
            <img
              src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85"
              alt="Historic architecture and cultural heritage"
              loading="lazy"
            />
          </div>
          <div className="mtg-about-photo mtg-about-photo-small">
            <img
              src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=700&q=85"
              alt="Tropical beach and clear water"
              loading="lazy"
            />
          </div>
          <span className="mtg-about-photo-note">Explore something new ✳</span>
        </div>

        <div className="mtg-about-story-copy">
          <span className="mtg-about-label">OUR STORY</span>
          <h2>
            More than a destination,
            <em> it's an experience.</em>
          </h2>

          <p>
            Maasin City offers a wonderful mix of local culture, historical
            landmarks, coastal scenery, and natural attractions waiting to be
            explored.
          </p>

          <p>
            We created Maasin Tour Guide to make discovering these places
            easier. With destination information, AI-assisted itinerary
            suggestions, and route planning, visitors can plan their adventures
            in one convenient place.
          </p>

          <a className="mtg-about-text-link" href="#itinerary">
            Plan your visit <span>→</span>
          </a>
        </div>
      </div>

      <div className="mtg-about-purpose">
        <article className="mtg-about-purpose-card mtg-about-mission">
          <span className="mtg-about-purpose-icon">⌁</span>
          <div>
            <span className="mtg-about-label">OUR MISSION</span>
            <h3>Make every discovery meaningful.</h3>
            <p>
              Help travelers explore Maasin through accessible information,
              thoughtful travel planning, and greater appreciation for local
              attractions and communities.
            </p>
          </div>
        </article>

        <article className="mtg-about-purpose-card mtg-about-vision">
          <span className="mtg-about-purpose-icon">☼</span>
          <div>
            <span className="mtg-about-label">OUR VISION</span>
            <h3>Put Maasin on the map.</h3>
            <p>
              Inspire more people to discover Southern Leyte and support
              responsible tourism that celebrates local heritage, nature, and
              community.
            </p>
          </div>
        </article>
      </div>

      <div className="mtg-about-features">
        <div className="mtg-about-features-heading">
          <div>
            <span className="mtg-about-label">YOUR TRAVEL COMPANION</span>
            <h2>Explore more. Plan smarter.</h2>
          </div>
          <p>
            The tools to help you turn a simple visit into a memorable journey.
          </p>
        </div>

        <div className="mtg-about-feature-grid">
          {features.map((feature) => (
            <article className="mtg-about-feature-card" key={feature.number}>
              <div className="mtg-about-feature-top">
                <span className="mtg-about-feature-icon">{feature.icon}</span>
                <span>{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mtg-about-signoff">
        <span />
        <p>Explore <b>·</b> Support Local <b>·</b> Create Memories</p>
        <span />
      </div>
    </section>
    </div>
  );
}
