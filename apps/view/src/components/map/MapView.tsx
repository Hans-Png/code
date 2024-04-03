import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
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
  const { itineraries, resultRoutes } = state;
  // Local State
  const [itineraryMarkers, setItineraryMarkers] = useState<
    { airport: AirportEnity; position: L.LatLng }[]
  >([]); // [
  const [resultMarkers, setResultMarkers] = useState<
    { airport: AirportEnity; position: L.LatLng }[]
  >([]);
  const [isValidItineraries, setIsValidItineraries] = useState(false);

  // Hooks
  useEffect(() => {
    // Check
    const itineraryAirports = itineraries.map((itinerary) => itinerary.airport);
    if (itineraryAirports.length > 0 && !resultRoutes.length) {
      setIsValidItineraries(true);
      const validItineraries: { airport: AirportEnity; position: L.LatLng }[] = [];
      itineraryAirports.forEach((airport) => {
        if (airport) {
          validItineraries.push({
            airport,
            position: new L.LatLng(airport.latitude, airport.longitude),
          });
        }
      });
      setItineraryMarkers(validItineraries);
    } else {
      setIsValidItineraries(false);
      setItineraryMarkers([]);
    }

    // Set Results
    if (resultRoutes.length > 0) {
      const markerMap = new Map<string, AirportEnity>();
      resultRoutes.forEach((route) => {
        const { from, to } = route;
        markerMap.set(from.iata, from);
        markerMap.set(to.iata, to);
      });
      const resultMarkerList = Array.from(markerMap.values()).map((airport) => (
        { airport, position: new L.LatLng(airport.latitude, airport.longitude) }
      ));
      setResultMarkers(resultMarkerList);
    } else {
      setResultMarkers([]);
    }
  }, [itineraries, resultRoutes]);

  return (
    <React.Fragment>
      <div className="leaflet-map-container" style={{ height: "calc(100vh - 56px)" }}>
        <MapContainer
          center={[22.302711, 114.177216]}
          zoom={4}
          worldCopyJump
          style={{
            height: "100%",
          }}
        >
          <TileLayer
            url={`https://tile.openstreetmap.org/{z}/{x}/{y}.png	`}
            attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`}
          />
          {isValidItineraries && itineraryMarkers.map((marker, index) => {
            const { airport, position } = marker;
            const { name, iata } = airport;
            return (
              <Marker
                key={index}
                position={position}
                icon={icon}
              >
                <Popup minWidth={90}>
                  <div>{iata}</div>
                  <div>{name}</div>
                </Popup>
              </Marker>
            );
          })}
          {Boolean(resultMarkers.length) && resultMarkers.map((marker, index) => {
            const { airport, position } = marker;
            const { name, iata } = airport;
            return (
              <React.Fragment>
                <Marker
                  key={index}
                  position={position}
                  icon={icon}
                >
                  <Popup minWidth={90}>
                    <div>{iata}</div>
                    <div>{name}</div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
          {Boolean(resultMarkers.length) && (
            <Polyline positions={resultMarkers.map((marker) => marker.position)} color="red" />
          )}
        </MapContainer>
      </div>
    </React.Fragment>
  );
};

export default MapView;
