"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Category } from "@/lib/planner/domain/types";

export interface MapMarker {
  id: string;
  name: string;
  category: Category;
  categoryLabel: string;
  lat: number;
  lon: number;
  rating: number;
  district: string;
  chosen: boolean;
  priceLabel?: string;
}

const COLORS: Record<Category, string> = {
  venue: "#112D4E",
  catering: "#E76F00",
  staff: "#2E8B57",
  equipment: "#6C4AB6",
  decor: "#D6336C",
  logistics: "#0CA5B0",
};

const ASTANA: [number, number] = [51.1282, 71.4304];

function iconFor(color: string, chosen: boolean): L.DivIcon {
  const size = chosen ? 26 : 14;
  const border = chosen ? 3 : 2;
  const ring = chosen ? "box-shadow:0 0 0 3px rgba(255,255,255,.9),0 2px 6px rgba(0,0,0,.4);" : "box-shadow:0 1px 3px rgba(0,0,0,.35);";
  const star = chosen ? "<span style='color:#fff;font-size:12px;line-height:1'>★</span>" : "";
  return L.divIcon({
    className: "planner-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${border}px solid #fff;${ring}">${star}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useMemo(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [markers, map]);
  return null;
}

export default function PlannerMap({ markers }: { markers: MapMarker[] }) {
  const present = Array.from(new Set(markers.map((m) => m.category)));

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-color-light" style={{ height: 440 }}>
        <MapContainer center={ASTANA} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lon]} icon={iconFor(COLORS[m.category], m.chosen)}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ color: "#3F72AF", fontSize: 12 }}>
                    {m.categoryLabel} · ★ {m.rating.toFixed(1)} · {m.district}
                  </div>
                  {m.priceLabel && (
                    <div style={{ marginTop: 4, fontWeight: 600 }}>
                      {m.chosen ? "✓ " : ""}
                      {m.priceLabel}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          <FitBounds markers={markers} />
        </MapContainer>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {present.map((cat) => {
          const label = markers.find((m) => m.category === cat)?.categoryLabel ?? cat;
          return (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-color-dark">
              <span
                className="inline-block rounded-full border border-white"
                style={{ width: 12, height: 12, background: COLORS[cat] }}
              />
              {label}
            </span>
          );
        })}
        <span className="text-xs text-color-medium">★ — выбрано в плане</span>
      </div>
    </div>
  );
}
