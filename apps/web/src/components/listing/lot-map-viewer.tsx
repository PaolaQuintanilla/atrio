"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import type L from "leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";

interface Point {
  lat: number;
  lng: number;
}

interface LotMapViewerProps {
  boundary: unknown;
  lat: number | null;
  lng: number | null;
}

export function LotMapViewer({ boundary, lat, lng }: LotMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !boundary) return;

    // Convert boundaries to format if needed
    let points: Point[] = [];
    if (Array.isArray(boundary)) {
      points = boundary as Point[];
    } else {
      try {
        points = typeof boundary === "string" ? JSON.parse(boundary) : boundary;
      } catch (e) {
        console.error("Failed to parse boundary json", e);
      }
    }

    if (!points || points.length === 0) return;

    const firstPoint = points[0];
    if (!firstPoint) return;
    const centroidLat = lat || firstPoint.lat;
    const centroidLng = lng || firstPoint.lng;

    // Import Leaflet dynamically inside useEffect to ensure it only runs on the client.
    // This allows the component to be statically imported in Next.js Server Components.
    import("leaflet").then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [centroidLat, centroidLng],
        zoom: 16,
        zoomControl: false,
      });
      mapRef.current = map;

      // CartoDB Voyager base map layer (sleek and modern)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      const polygon = L.polygon(latLngs, {
        color: "var(--color-brand-secondary, #f43f5e)", // Rose-500 outline
        fillColor: "var(--color-brand-secondary, #f43f5e)",
        fillOpacity: 0.2,
        weight: 3,
      }).addTo(map);

      // Calculate Turf metrics to mark the area with a visual badge inside the polygon
      const turfCoords = points.map((p) => [p.lng, p.lat] as [number, number]);
      const firstPt = points[0];
      if (firstPt) {
        turfCoords.push([firstPt.lng, firstPt.lat]);
        try {
          const poly = turf.polygon([turfCoords]);
          const areaSqM = turf.area(poly);
          const centroid = turf.centroid(poly);
          const centerLng = centroid.geometry.coordinates[0];
          const centerLat = centroid.geometry.coordinates[1];

          if (typeof centerLng === "number" && typeof centerLat === "number") {
            const areaLabelText = areaSqM >= 10000 
              ? `${(areaSqM / 10000).toFixed(2)} ha` 
              : `${Math.round(areaSqM).toLocaleString()} m²`;

            const areaLabelIcon = L.divIcon({
              className: "custom-area-badge",
              html: `<div class="bg-rose-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full border border-white shadow-md whitespace-nowrap flex items-center justify-center">${areaLabelText}</div>`,
              iconAnchor: [40, 12],
              iconSize: [80, 24],
            });
            L.marker([centerLat, centerLng], { icon: areaLabelIcon, interactive: false }).addTo(map);
          }
        } catch (e) {
          console.error("Turf computation failed in viewer:", e);
        }
      }

      // Fit map bounds to the polygon automatically
      try {
        const bounds = polygon.getBounds();
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch (e) {
        console.error("Error adjusting map boundaries", e);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [boundary, lat, lng]);

  if (!boundary) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] shadow-sm">
      {/* Map div */}
      <div ref={mapContainerRef} className="h-[350px] w-full z-0" />
      
      {/* Card Info Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-background/80 backdrop-blur-md border border-[var(--color-border)] px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <MapPin className="h-4 w-4 text-teal-600" />
        Límites y ubicación del terreno / Land Boundaries
      </div>
    </div>
  );
}
