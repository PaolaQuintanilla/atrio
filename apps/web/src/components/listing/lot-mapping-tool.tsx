"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import * as turf from "@turf/turf";
import { Compass, Trash2, Maximize, MapPin, MousePointerClick } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon paths in Next.js
// By using custom HTML/CSS divIcon, we bypass Leaflet's assets loading issue entirely.
const vertexIcon = L.divIcon({
  className: "custom-vertex-dot",
  html: `<div class="w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-lg hover:scale-125 transition-all duration-150 ring-2 ring-rose-400 ring-offset-1"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const closedVertexIcon = L.divIcon({
  className: "custom-vertex-dot-closed",
  html: `<div class="w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-lg hover:scale-125 transition-all duration-150 ring-2 ring-rose-500 ring-offset-1 animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface Point {
  lat: number;
  lng: number;
}

interface LotMappingToolProps {
  initialBoundary?: Point[] | null;
  initialLat?: number | null;
  initialLng?: number | null;
  onUpdate: (data: { boundary: Point[] | null; lat: number | null; lng: number | null; area?: number }) => void;
}

export function LotMappingTool({
  initialBoundary,
  initialLat,
  initialLng,
  onUpdate,
}: LotMappingToolProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);
  const verticesRef = useRef<L.LatLng[]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);

  const [verticesCount, setVerticesCount] = useState(0);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [centerCoord, setCenterCoord] = useState<Point | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Set default view to Santa Cruz de la Sierra, Bolivia if no initial coordinates
    const defaultLat = initialLat || -17.7818;
    const defaultLng = initialLng || -63.1824;
    const zoomLevel = initialBoundary && initialBoundary.length > 0 ? 16 : 14;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: zoomLevel,
      zoomControl: false, // will place zoom control in a better place
    });

    mapRef.current = map;

    // Add clean CartoDB Voyager tile layer (sleek and premium base map)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }).addTo(map);

    // Add zoom control at bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Create a feature group for our drawings
    const layerGroup = new L.FeatureGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Preload initial boundary if available
    if (initialBoundary && initialBoundary.length > 0) {
      verticesRef.current = initialBoundary.map((p) => new L.LatLng(p.lat, p.lng));
      redrawLayers();
      
      // Fit map bounds to the existing polygon
      try {
        const bounds = L.latLngBounds(verticesRef.current);
        map.fitBounds(bounds, { padding: [30, 30] });
      } catch (e) {
        console.error("Error fitting bounds", e);
      }
    }

    // Map click handler for drawing
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      verticesRef.current.push(new L.LatLng(lat, lng));
      redrawLayers();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update polygon and calculate geometry
  const redrawLayers = () => {
    if (!mapRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();
    polygonRef.current = null;

    const coords = verticesRef.current;
    setVerticesCount(coords.length);

    if (coords.length === 0) {
      setCalculatedArea(null);
      setCenterCoord(null);
      onUpdate({ boundary: null, lat: null, lng: null, area: 0 });
      return;
    }

    // Draw lines/polygons
    if (coords.length >= 3) {
      // Create closed polygon
      const latLngs = coords.map((c) => [c.lat, c.lng] as [number, number]);
      const polygon = L.polygon(latLngs, {
        color: "var(--color-brand-secondary, #f43f5e)", // Rose-500 outline
        fillColor: "var(--color-brand-secondary, #f43f5e)",
        fillOpacity: 0.2,
        weight: 3,
      }).addTo(layerGroup);
      
      polygonRef.current = polygon;

      // Calculate Turf metrics
      const turfCoords = coords.map((c) => [c.lng, c.lat] as [number, number]);
      // Close the ring for Turf polygon
      const firstCoord = coords[0];
      if (firstCoord) {
        turfCoords.push([firstCoord.lng, firstCoord.lat]);

        try {
          const poly = turf.polygon([turfCoords]);
          const areaSqM = turf.area(poly);
          const centroid = turf.centroid(poly);
          const centerLng = centroid.geometry.coordinates[0];
          const centerLat = centroid.geometry.coordinates[1];

          if (typeof centerLng === "number" && typeof centerLat === "number") {
            setCalculatedArea(areaSqM);
            const centroidPoint = { lat: centerLat, lng: centerLng };
            setCenterCoord(centroidPoint);

            // Centroid label for polygon
            const areaLabelText = areaSqM >= 10000 
              ? `${(areaSqM / 10000).toFixed(2)} ha` 
              : `${Math.round(areaSqM).toLocaleString()} m²`;

            const areaLabelIcon = L.divIcon({
              className: "custom-area-badge",
              html: `<div class="bg-rose-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full border border-white shadow-md whitespace-nowrap flex items-center justify-center">${areaLabelText}</div>`,
              iconAnchor: [40, 12],
              iconSize: [80, 24],
            });
            
            L.marker([centerLat, centerLng], { icon: areaLabelIcon, interactive: false }).addTo(layerGroup);

            onUpdate({
              boundary: coords.map((c) => ({ lat: c.lat, lng: c.lng })),
              lat: centerLat,
              lng: centerLng,
              area: Math.round(areaSqM * 100) / 100, // round to 2 decimals
            });
          }
        } catch (err) {
          console.error("Turf computation failed:", err);
        }
      }
    } else {
      // If we have 2 points, draw a polyline to guide the user
      if (coords.length === 2) {
        L.polyline(
          coords.map((c) => [c.lat, c.lng]),
          {
            color: "var(--color-brand-secondary, #f43f5e)",
            weight: 3,
            dashArray: "5, 10",
          }
        ).addTo(layerGroup);
      }

      setCalculatedArea(null);
      
      // Calculate average point for centroid
      const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
      const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
      const avgPoint = { lat: avgLat, lng: avgLng };
      setCenterCoord(avgPoint);

      onUpdate({
        boundary: coords.map((c) => ({ lat: c.lat, lng: c.lng })),
        lat: avgLat,
        lng: avgLng,
        area: 0,
      });
    }

    // Add draggable markers at vertices
    coords.forEach((coord, idx) => {
      const isFirst = idx === 0;
      const isClosePoint = isFirst && coords.length >= 3;

      const marker = L.marker(coord, {
        icon: isClosePoint ? closedVertexIcon : vertexIcon,
        draggable: true,
      }).addTo(layerGroup);

      // Handle marker dragging
      marker.on("drag", (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const newLatLng = target.getLatLng();
        verticesRef.current[idx] = newLatLng;

        // Update polygon in real-time for smooth dragging
        if (polygonRef.current) {
          polygonRef.current.setLatLngs(verticesRef.current);
        }
      });

      // Recalculate everything on drag end
      marker.on("dragend", () => {
        redrawLayers();
      });

      // Clicking the first vertex when we have at least 3 points closes the drawing
      if (isFirst && coords.length >= 3) {
        marker.bindTooltip("Click to close/complete", { direction: "top", offset: [0, -10] });
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          // Highlight success/closing
          redrawLayers();
        });
      }
    });
  };

  // Clear drawing
  const handleClear = () => {
    verticesRef.current = [];
    redrawLayers();
  };

  // Get current location
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.setView([latitude, longitude], 17);
        setIsLocating(false);
      },
      (err) => {
        console.error("Geolocation error", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const formatArea = (sqM: number) => {
    if (sqM >= 10000) {
      const hectares = sqM / 10000;
      return `${hectares.toFixed(2)} ha (${Math.round(sqM).toLocaleString()} m²)`;
    }
    return `${Math.round(sqM).toLocaleString()} m²`;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] shadow-sm">
      {/* Map Element */}
      <div ref={mapContainerRef} className="h-[420px] w-full cursor-crosshair z-0" />

      {/* Modern Overlay Control Card */}
      <div className="absolute top-4 left-4 z-[400] max-w-xs w-full bg-background/80 backdrop-blur-md border border-[var(--color-border)] p-4 rounded-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
            <Compass className="h-4 w-4 text-teal-600" />
            Lot Boundary Mapping
          </h4>
          <button
            type="button"
            onClick={handleClear}
            disabled={verticesCount === 0}
            className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
            title="Clear all points"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {verticesCount === 0 ? (
          <div className="text-xs text-muted-foreground space-y-2 py-1">
            <p className="flex items-start gap-1.5">
              <MousePointerClick className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <span>Click on the map to place vertices along the borders of the lot.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <Maximize className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <span>Draw at least 3 points to close the polygon and calculate the surface area automatically.</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vertices Placed:</span>
              <span className="font-medium text-foreground">{verticesCount}</span>
            </div>
            
            {calculatedArea !== null && (
              <div className="space-y-1 bg-teal-500/10 dark:bg-teal-500/5 p-2 rounded-lg border border-teal-500/20">
                <span className="text-teal-700 dark:text-teal-400 font-semibold block text-[10px] uppercase tracking-wider">
                  Calculated Surface Area
                </span>
                <span className="text-sm font-bold text-teal-800 dark:text-teal-300">
                  {formatArea(calculatedArea)}
                </span>
              </div>
            )}

            {centerCoord && (
              <div className="text-[10px] text-muted-foreground font-mono space-y-0.5 border-t pt-2 mt-2">
                <div>Centroid Coordinates:</div>
                <div className="flex justify-between text-foreground">
                  <span>Lat: {centerCoord.lat.toFixed(6)}</span>
                  <span>Lng: {centerCoord.lng.toFixed(6)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium bg-background hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <MapPin className="h-3.5 w-3.5 text-teal-600" />
            {isLocating ? "Locating..." : "Locate Me"}
          </button>
        </div>
      </div>
    </div>
  );
}
