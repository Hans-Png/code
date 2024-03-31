import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useAppStore } from "../../hooks/AppContext";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import type { AirportEnity } from "../../types/data";

const icon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
});

const MapView = () => {
  // App State
  const { state } = useAppStore();
  const { airports, itineraries, resultRoutes } = state;
  // Local State
  const [isValidItineraies, setIsValidItineraies] = useState(false);

  useEffect(() => {
    const itineraryAirports = itineraries.map((itinerary) => itinerary.airport);
    if (itineraryAirports.length > 0 && !resultRoutes.length) {
      setIsValidItineraies(true);
    } else {
      setIsValidItineraies(false);
    }
  }, [itineraries, resultRoutes]);

  return (
    <React.Fragment>
      <div className="leaflet-map-container" style={{ height: "calc(100vh - 56px)" }}>
        <MapContainer
          center={[22.302711, 114.177216]}
          zoom={4}
          style={{
            height: "100%",
          }}
        >
          <TileLayer
            url={`https://tile.openstreetmap.org/{z}/{x}/{y}.png	`}
            attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`}
          />
          {isValidItineraies && itineraries.map((itinerary, index) => {
            if (itinerary.airport) {
              const { name, longitude, latitude } = itinerary.airport;
              return (
                <Marker key={index} position={[latitude, longitude]} icon={icon}>
                  <Popup minWidth={90}>{name}</Popup>
                </Marker>
              );
            } else {
              return null;
            }
          })}
        </MapContainer>
      </div>
    </React.Fragment>
  );
};

export default MapView;
