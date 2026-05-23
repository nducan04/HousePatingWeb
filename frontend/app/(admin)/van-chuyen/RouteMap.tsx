"use client";

import { useEffect, useRef } from "react";

interface RouteMapProps {
  origin: string;
  destination: string;
  currentLocation?: string;
  isDelivered?: boolean;
}

// Geocode an address string to [lat, lng] using Nominatim (OpenStreetMap)
async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "vi", "User-Agent": "VTSC-PaintPro/1.0" } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.error("Geocode error:", e);
  }
  return null;
}

export default function RouteMap({ origin, destination, currentLocation, isDelivered = false }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !origin || !destination) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      // Inject Leaflet CSS once via <link> tag
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Dynamically import Leaflet to avoid SSR issues
      const L = (await import("leaflet")).default;

      // Destroy previous map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!mapRef.current) return;

      // Create map with bright OpenStreetMap tiles
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapInstanceRef.current = map;

      // Bright, standard Google Maps tiles
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}", {
        attribution: "Dữ liệu bản đồ ©2026 Google",
        maxZoom: 18,
      }).addTo(map);

      // Geocode both addresses concurrently
      const [originCoords, destCoords, currentCoords] = await Promise.all([
        geocode(origin),
        geocode(destination),
        currentLocation ? geocode(currentLocation) : Promise.resolve(null),
      ]);

      if (!originCoords || !destCoords) {
        // Fallback: just center on Vietnam
        map.setView([16.047079, 108.20623], 6);
        return;
      }

      // Custom icons
      const originIcon = L.divIcon({
        html: `<div style="
          width:24px;height:24px;border-radius:50% 50% 50% 0;
          background:#08b2b2;border:3px solid white;
          box-shadow:0 2px 4px rgba(0,0,0,0.3);
          transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
        "><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const destIcon = L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;font-size:20px;background:white;width:32px;height:32px;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);">
          🏠
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const truckIcon = L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          ${isDelivered ? "✅" : "🚚"}
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Add origin marker with popup
      L.marker(originCoords, { icon: originIcon })
        .addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;font-weight:bold;font-size:13px;">${origin.split(',')[0]}</div>`, { closeButton: false, autoClose: false, closeOnClick: false })
        .openPopup();

      // Fetch route from OSRM (free, no API key needed)
      try {
        const osrmUrl = currentCoords 
          ? `https://router.project-osrm.org/route/v1/driving/${originCoords[1]},${originCoords[0]};${currentCoords[1]},${currentCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`
          : `https://router.project-osrm.org/route/v1/driving/${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`;
        
        const routeRes = await fetch(osrmUrl);
        const routeData = await routeRes.json();

        if (routeData.code === "Ok" && routeData.routes?.length > 0) {
          const coords = routeData.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          // Draw the route line
          const routeLine = L.polyline(coords, {
            color: "#08b2b2", // Cyan matching screenshot
            weight: 6,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          // Add Destination marker (House)
          L.marker(destCoords, { icon: destIcon }).addTo(map);

          // Add Truck marker along the route (e.g. at currentCoords or 85% of the trip)
          let truckCoords: [number, number];
          if (currentCoords) {
            truckCoords = currentCoords;
          } else {
            const truckIndex = isDelivered ? coords.length - 1 : Math.floor(coords.length * 0.85);
            truckCoords = coords[truckIndex];
          }

          L.marker(truckCoords, { icon: truckIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family:sans-serif;text-align:center;">
              <div style="font-size:12px;color:#333;">${isDelivered ? "Đã giao thành công" : "Đang trên đường đến"}</div>
              <div style="font-size:13px;color:#08b2b2;font-weight:bold;margin-top:2px;">${destination.split(',')[0]}</div>
            </div>`, { closeButton: false, autoClose: false, closeOnClick: false })
            .openPopup();

          // Fit map to show entire route
          map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
        } else {
          // If OSRM fails, just fit bounds between two points and put truck at destination
          L.marker(destCoords, { icon: destIcon }).addTo(map);
          L.marker(currentCoords || destCoords, { icon: truckIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family:sans-serif;text-align:center;">
              <div style="font-size:12px;color:#333;">${isDelivered ? "Đã giao thành công" : "Đang trên đường đến"}</div>
              <div style="font-size:13px;color:#08b2b2;font-weight:bold;margin-top:2px;">${destination.split(',')[0]}</div>
            </div>`, { closeButton: false, autoClose: false, closeOnClick: false })
            .openPopup();
          
          if (currentCoords) {
            map.fitBounds([originCoords, currentCoords, destCoords], { padding: [60, 60] });
          } else {
            map.fitBounds([originCoords, destCoords], { padding: [60, 60] });
          }
        }
      } catch (routeErr) {
        console.warn("Route fetch failed, showing markers only:", routeErr);
        L.marker(destCoords, { icon: destIcon }).addTo(map);
        L.marker(currentCoords || destCoords, { icon: truckIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:sans-serif;text-align:center;">
            <div style="font-size:12px;color:#333;">${isDelivered ? "Đã giao thành công" : "Đang trên đường đến"}</div>
            <div style="font-size:13px;color:#08b2b2;font-weight:bold;margin-top:2px;">${destination.split(',')[0]}</div>
          </div>`, { closeButton: false, autoClose: false, closeOnClick: false })
          .openPopup();
        if (currentCoords) {
          map.fitBounds([originCoords, currentCoords, destCoords], { padding: [60, 60] });
        } else {
          map.fitBounds([originCoords, destCoords], { padding: [60, 60] });
        }
      }
    })();

    cleanup = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };

    return () => {
      cleanup?.();
    };
  }, [origin, destination, isDelivered]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "360px",
        borderRadius: "0",
        zIndex: 0,
      }}
    />
  );
}
