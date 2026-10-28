import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./SmartRoutePlanner.css";

const DEFAULT_CENTER = [10.14483, 124.8437];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapViewport({ locations, routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates?.length > 1) {
      map.fitBounds(routeCoordinates, {
        padding: [35, 35],
        maxZoom: 14,
      });
    } else if (locations.length === 1) {
      map.setView(locations[0].position, 14);
    } else if (locations.length > 1) {
      map.fitBounds(
        locations.map((location) => location.position),
        { padding: [35, 35], maxZoom: 14 },
      );
    }
  }, [locations, routeCoordinates, map]);

  return null;
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "—";

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "—";

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;

  return `${hours} hr ${minutes} min`;
}

export default function SmartRoutePlanner({ spots = [] }) {
  console.log("SmartRoutePlanner received spots:", spots);
  console.log("Number of spots received:", spots.length);
  const mappedSpots = useMemo(() => {
    return spots
      .filter((spot) => {
        const latitude = Number(spot.coordinates?.latitude);
        const longitude = Number(spot.coordinates?.longitude);

        return (
          spot._id &&
          spot.coordinates?.latitude != null &&
          spot.coordinates?.longitude != null &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        );
      })
      .map((spot) => ({
        ...spot,
        position: [
          Number(spot.coordinates.latitude),
          Number(spot.coordinates.longitude),
        ],
      }));
  }, [spots]);
  console.log("Mapped destinations:", mappedSpots);

  const [selectedIds, setSelectedIds] = useState([]);
  const [startLocation, setStartLocation] = useState("");
  const [startCoordinates, setStartCoordinates] = useState(null);
  const [startLocationLoading, setStartLocationLoading] = useState(false);
  const [startMode, setStartMode] = useState("landmark");
  const [manualAddress, setManualAddress] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  // Keep selected destinations in the order they were selected.
  const selectedSpots = selectedIds
    .map((id) => mappedSpots.find((spot) => spot._id === id))
    .filter(Boolean);

  // If destination data changes, ignore IDs that are no longer available.
  const validSelectedIds = selectedIds.filter((id) =>
    mappedSpots.some((spot) => spot._id === id),
  );
  async function handleStartLocationChange(value) {
    setStartLocation(value);
    setStartCoordinates(null);
    setRouteData(null);
    setRouteError("");

    if (!value || value === "Other location in Maasin City") {
      return;
    }

    setStartLocationLoading(true);

    try {
      const query = encodeURIComponent(value);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`,
      );

      if (response.status === 429) {
        throw new Error(
          "The location search service is busy. Please wait and try again.",
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not look up that starting location. Please try again.",
        );
      }

      const results = await response.json();

      if (!results.length) {
        throw new Error(
          "Starting location not found. Please choose another landmark.",
        );
      }

      const latitude = Number(results[0].lat);
      const longitude = Number(results[0].lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("The starting location has invalid coordinates.");
      }

      setStartCoordinates({
        position: [latitude, longitude],
        address: results[0].display_name,
      });
    } catch (error) {
      setRouteError(error.message || "Unable to find the starting location.");
    } finally {
      setStartLocationLoading(false);
    }
  }

  function resetRouteForNewStart() {
    setStartCoordinates(null);
    setRouteData(null);
    setRouteError("");
  }

  function handleStartModeChange(mode) {
    setStartMode(mode);
    setStartLocation("");
    resetRouteForNewStart();
  }

  function handleUseCurrentLocation() {
    setStartMode("current");
    setStartLocation("");
    resetRouteForNewStart();

    if (!navigator.geolocation) {
      setRouteError(
        "Your browser does not support location access. Please enter an address instead.",
      );
      return;
    }

    setStartLocationLoading(true);
    setRouteError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setStartLocation("My current location");
        setStartCoordinates({
          position: [latitude, longitude],
          address: "Your current location",
        });

        setStartLocationLoading(false);
      },
      (error) => {
        let message = "Unable to get your current location.";

        if (error.code === 1) {
          message =
            "Location permission was denied. Allow location access in your browser, or enter an address manually.";
        } else if (error.code === 2) {
          message =
            "Your location is unavailable. Please try again or enter an address.";
        } else if (error.code === 3) {
          message = "Getting your location timed out. Please try again.";
        }

        setRouteError(message);
        setStartLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }

  async function handleManualAddressSubmit(event) {
    event.preventDefault();

    const address = manualAddress.trim();

    if (!address) {
      setRouteError("Please enter your starting address.");
      return;
    }

    setStartMode("address");
    setStartLocation("");
    resetRouteForNewStart();
    setStartLocationLoading(true);

    try {
      const query = encodeURIComponent(
        `${address}, Maasin City, Southern Leyte, Philippines`,
      );

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`,
      );

      if (response.status === 429) {
        throw new Error(
          "The address search service is temporarily rate-limited. Please wait before trying again, or use your current location or a landmark.",
        );
      }

      if (!response.ok) {
        throw new Error(
          "The address search service is unavailable. Please try again later.",
        );
      }

      const results = await response.json();

      if (!results.length) {
        throw new Error(
          "Address not found. Try adding a nearby landmark or barangay.",
        );
      }

      const latitude = Number(results[0].lat);
      const longitude = Number(results[0].lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error("The address search returned invalid coordinates.");
      }

      setStartLocation(address);
      setStartCoordinates({
        position: [latitude, longitude],
        address: results[0].display_name,
      });
    } catch (error) {
      setRouteError(error.message || "Unable to find that address.");
    } finally {
      setStartLocationLoading(false);
    }
  }

  function toggleSpot(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );

    setRouteData(null);
    setRouteError("");
  }

  function selectAll() {
    setSelectedIds(mappedSpots.map((spot) => spot._id));
    setRouteData(null);
    setRouteError("");
  }

  function clearSelection() {
    setSelectedIds([]);
    setRouteData(null);
    setRouteError("");
  }

  async function optimizeRoute() {
    if (!startLocation) {
      setRouteError("Please select your starting location first.");
      setRouteData(null);
      return;
    }

    if (startLocationLoading) {
      setRouteError("Please wait while your starting location is found.");
      return;
    }

    if (!startCoordinates) {
      setRouteError(
        "The starting location has not been found. Please select it again.",
      );
      setRouteData(null);
      return;
    }

    if (selectedSpots.length < 1) {
      setRouteError("Select at least one destination.");
      setRouteData(null);
      return;
    }

    setRouteLoading(true);
    setRouteError("");
    setRouteData(null);

    try {
      const allLocations = [
        {
          _id: "route-start",
          name: startLocation || startCoordinates.address,
          position: startCoordinates.position,
          address: startCoordinates.address,
          isStartingPoint: true,
        },
        ...selectedSpots,
      ];

      const coordinates = allLocations
        .map((location) => `${location.position[1]},${location.position[0]}`)
        .join(";");

      const url =
        `https://router.project-osrm.org/trip/v1/driving/${coordinates}` +
        "?source=first&roundtrip=false&overview=full" +
        "&geometries=geojson&steps=false";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("The routing service could not be reached.");
      }

      const result = await response.json();

      if (
        result.code !== "Ok" ||
        !result.trips?.length ||
        !result.waypoints?.length
      ) {
        throw new Error(
          "No road route was found. Check the coordinates and try again.",
        );
      }

      const trip = result.trips[0];

      const orderedLocations = result.waypoints
        .map((waypoint, index) => ({
          location: allLocations[index],
          order: waypoint.waypoint_index,
        }))
        .sort((a, b) => a.order - b.order)
        .map((item) => item.location);

      const orderedSpots = orderedLocations.filter(
        (location) => !location.isStartingPoint,
      );

      const routeCoordinates = trip.geometry.coordinates.map(
        ([longitude, latitude]) => [latitude, longitude],
      );

      setSelectedIds(orderedSpots.map((spot) => spot._id));

      setRouteData({
        startPoint: allLocations[0],
        orderedSpots,
        routeCoordinates,
        distance: trip.distance,
        duration: trip.duration,
      });
    } catch (error) {
      setRouteError(
        error.message || "Unable to calculate the route. Please try again.",
      );
    } finally {
      setRouteLoading(false);
    }
  }

  const startingPoint = startCoordinates
    ? {
        _id: "route-start",
        name: startLocation || startCoordinates.address,
        position: startCoordinates.position,
        address: startCoordinates.address,
        isStartingPoint: true,
      }
    : null;

  const displaySpots = routeData
    ? [routeData.startPoint, ...routeData.orderedSpots]
    : [
        ...(startingPoint ? [startingPoint] : []),
        ...mappedSpots.filter(
          (spot) => !startingPoint || spot._id !== startingPoint._id,
        ),
      ];

  const displayRoute = routeData?.routeCoordinates || null;

  return (
    <section className="route-planner-section section-wrap" id="route-planner">
      <div className="route-planner-heading">
        <p className="route-planner-eyebrow">EXPLORE MAASIN</p>
        <h2>Smart Route Planner</h2>
        <p>
          Choose your destinations and calculate an optimized driving route with
          road distance and estimated travel time.
        </p>
      </div>

      <div className="route-planner-layout">
        <aside className="route-planner-sidebar">
          <div className="route-planner-start">
            <div className="route-planner-start-heading">
              <span className="route-planner-section-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="10"
                    r="2.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>

              <div>
                <h3>Plan your starting point</h3>
                <p>Choose where your Maasin adventure begins.</p>
              </div>
            </div>

            <div className="route-planner-start-options">
              <button
                type="button"
                className="route-planner-start-option"
                aria-pressed={startMode === "current"}
                onClick={handleUseCurrentLocation}
                disabled={startLocationLoading}
              >
                <span className="route-planner-option-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 2v3M12 19v3M2 12h3M19 12h3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="route-planner-option-copy">
                  <strong>Current location</strong>
                  <small>Use your device's GPS</small>
                </span>
                <span className="route-planner-option-check" aria-hidden="true">
                  {startMode === "current" ? "✓" : "›"}
                </span>
              </button>

              <button
                type="button"
                className="route-planner-start-option"
                aria-pressed={startMode === "address"}
                onClick={() => handleStartModeChange("address")}
                disabled={startLocationLoading}
              >
                <span className="route-planner-option-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="10.8"
                      cy="10.8"
                      r="6.8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="m16 16 5 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="route-planner-option-copy">
                  <strong>Search an address</strong>
                  <small>Enter a street or place name</small>
                </span>
                <span className="route-planner-option-check" aria-hidden="true">
                  {startMode === "address" ? "✓" : "›"}
                </span>
              </button>

              <button
                type="button"
                className="route-planner-start-option"
                aria-pressed={startMode === "landmark"}
                onClick={() => handleStartModeChange("landmark")}
                disabled={startLocationLoading}
              >
                <span className="route-planner-option-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 21V5l8-3v19M12 8h8v13M2 21h20"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 8h2M7 12h2M7 16h2M16 12h1M16 16h1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="route-planner-option-copy">
                  <strong>Choose a landmark</strong>
                  <small>Start from a known place in Maasin</small>
                </span>
                <span className="route-planner-option-check" aria-hidden="true">
                  {startMode === "landmark" ? "✓" : "›"}
                </span>
              </button>
            </div>

            {startMode === "landmark" && (
              <div className="route-planner-start-detail">
                <label htmlFor="route-start-location">
                  Select your starting landmark
                </label>

                <select
                  id="route-start-location"
                  value={startLocation}
                  disabled={startLocationLoading}
                  onChange={(event) =>
                    handleStartLocationChange(event.target.value)
                  }
                >
                  <option value="">Choose a landmark</option>
                  <option value="Maasin Cathedral, Maasin City">
                    Maasin Cathedral
                  </option>
                  <option value="Maasin City Baywalk, Maasin City">
                    Maasin City Baywalk
                  </option>
                  <option value="Monte Cueva Shrine, Maasin City">
                    Monte Cueva Shrine
                  </option>
                </select>
              </div>
            )}

            {startMode === "address" && (
              <div className="route-planner-start-detail">
                <form onSubmit={handleManualAddressSubmit}>
                  <label htmlFor="route-manual-address">
                    Enter your starting address
                  </label>

                  <input
                    id="route-manual-address"
                    type="text"
                    value={manualAddress}
                    onChange={(event) => setManualAddress(event.target.value)}
                    placeholder="e.g. Barangay Combado, Maasin City"
                    disabled={startLocationLoading}
                  />

                  <button
                    type="submit"
                    disabled={startLocationLoading || !manualAddress.trim()}
                  >
                    {startLocationLoading
                      ? "Finding address..."
                      : "Find address"}
                  </button>
                </form>
              </div>
            )}

            {startLocationLoading && (
              <p className="route-planner-location-status" role="status">
                Finding your starting location...
              </p>
            )}

            {startCoordinates && (
              <div
                className="route-planner-location-confirmation"
                role="status"
                aria-live="polite"
              >
                <span
                  className="route-planner-confirmation-icon"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <div>
                  <strong>Starting point selected</strong>
                  <p>{startCoordinates.address}</p>
                </div>
              </div>
            )}
          </div>

          <div className="route-planner-list-heading">
            <h3>Available destinations</h3>
            <span>{mappedSpots.length} mapped</span>
          </div>

          <div className="route-planner-actions">
            <button type="button" onClick={selectAll}>
              Select all
            </button>
            <button type="button" onClick={clearSelection}>
              Clear
            </button>
          </div>

          {mappedSpots.length === 0 ? (
            <div className="route-planner-empty">
              <span className="route-planner-empty-icon" aria-hidden="true">
                📍
              </span>
              <h4>Your destinations are on the way</h4>
              <p>
                Explore available tourist spots while we prepare the map
                locations for route planning.
              </p>
              <small>Destination map pins are being prepared.</small>
            </div>
          ) : (
            <div className="route-planner-destinations">
              {mappedSpots.map((spot) => (
                <label className="route-planner-destination" key={spot._id}>
                  <input
                    type="checkbox"
                    checked={validSelectedIds.includes(spot._id)}
                    onChange={() => toggleSpot(spot._id)}
                  />
                  <span>
                    <strong>{spot.name}</strong>
                    <small>{spot.category || "Tourist destination"}</small>
                  </span>
                </label>
              ))}
            </div>
          )}

          <p className="route-planner-selection-count">
            {validSelectedIds.length} destination
            {validSelectedIds.length === 1 ? "" : "s"} selected
          </p>

          <button
            type="button"
            className="route-planner-optimize-button"
            onClick={optimizeRoute}
            disabled={
              routeLoading ||
              startLocationLoading ||
              !startCoordinates ||
              selectedSpots.length < 1
            }
          >
            {routeLoading
              ? "Calculating route..."
              : startLocationLoading
                ? "Finding starting location..."
                : "Calculate route"}
          </button>

          {routeError && (
            <p className="route-planner-error" role="alert">
              {routeError}
            </p>
          )}

          {routeData && (
            <div className="route-planner-summary" aria-live="polite">
              <h3>Route summary</h3>

              <div className="route-planner-stats">
                <div>
                  <span>Road distance</span>
                  <strong>{formatDistance(routeData.distance)}</strong>
                </div>
                <div>
                  <span>Driving time</span>
                  <strong>{formatDuration(routeData.duration)}</strong>
                </div>
              </div>

              <p className="route-planner-summary-note">
                Estimated driving time only. Stops, breaks, and live traffic are
                not included.
              </p>

              <h4>Suggested stop order</h4>
              <ol className="route-planner-stop-order">
                {routeData.orderedSpots.map((spot, index) => (
                  <li key={spot._id}>
                    <span className="route-planner-stop-number">
                      {index + 1}
                    </span>
                    <span>{spot.name}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>

        <div className="route-planner-map-panel">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            scrollWheelZoom={false}
            className="route-planner-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewport
              locations={displaySpots}
              routeCoordinates={displayRoute}
            />

            {displayRoute && (
              <Polyline
                positions={displayRoute}
                pathOptions={{
                  color: "#1d6650",
                  weight: 5,
                  opacity: 0.85,
                }}
              />
            )}

            {displaySpots.map((spot, index) => (
              <Marker key={spot._id} position={spot.position} icon={markerIcon}>
                <Popup>
                  <strong>
                    {routeData
                      ? index === 0
                        ? `Starting point: ${spot.name}`
                        : `${index}. ${spot.name}`
                      : spot.name}
                  </strong>
                  <br />
                  {spot.category || "Tourist destination"}
                  {spot.address && (
                    <>
                      <br />
                      {spot.address}
                    </>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <p className="route-planner-map-note">
            Routes and estimates are supplied by the routing service. Verify
            destination pins and local road conditions before traveling.
          </p>
        </div>
      </div>
    </section>
  );
}
