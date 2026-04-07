"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { ShipmentMapPoint } from "@/utils/shipment-map-points";
import { shipmentMapPointsToLatLngs } from "@/utils/shipment-map-points";
import "leaflet/dist/leaflet.css";

import { ORANGE, ORANGE_FILL } from "./constants";
import { kindLabel } from "./utils";

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0]!, 6, { animate: false });
      return;
    }
    const b = L.latLngBounds(positions);
    map.fitBounds(b, { padding: [28, 28], maxZoom: 8, animate: false });
  }, [map, positions]);
  return null;
}

export function ShipmentTrackingMapInner({
  points,
  className = "",
}: {
  points: ShipmentMapPoint[];
  className?: string;
}) {
  const positions = shipmentMapPointsToLatLngs(points);
  const center: [number, number] = positions[0] ?? [20, 0];
  const zoom = positions.length === 0 ? 2 : positions.length === 1 ? 6 : 4;

  return (
    <div
      className={`relative z-0 min-h-[280px] w-full overflow-hidden rounded-lg border border-zinc-200/90 dark:border-zinc-700 ${className}`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-[min(420px,calc(100dvh-16rem))] w-full [&_.leaflet-control-attribution]:text-[10px]"
        scrollWheelZoom
        worldCopyJump
      >
        <FitBounds positions={positions} />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Carto Light">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Carto Dark">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenTopoMap">
            <TileLayer
              attribution='Map: <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>), data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              subdomains="abc"
              maxZoom={17}
              maxNativeZoom={17}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {positions.length > 1 ? (
          <Polyline
            positions={positions}
            pathOptions={{ color: ORANGE, weight: 3, opacity: 0.85, dashArray: "8 6" }}
          />
        ) : null}

        {points.map((p, i) => (
          <CircleMarker
            key={`${p.lat}-${p.lng}-${i}-${p.label}`}
            center={[p.lat, p.lng]}
            radius={i === points.length - 1 ? 10 : 7}
            pathOptions={{
              color: ORANGE,
              weight: 2,
              fillColor: ORANGE_FILL,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="min-w-[140px] text-sm">
                <p className="font-semibold text-zinc-900">{kindLabel(p.kind)}</p>
                <p className="mt-1 text-zinc-700">{p.label}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
