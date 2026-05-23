"use client";

import { useEffect, useRef } from "react";

interface RouteMapProps {
  origin: string;
  destination: string;
  currentLocation?: string;
  isDelivered?: boolean;
  onMapClick?: (address: string) => void;
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

export default function RouteMap({ origin, destination, currentLocation, isDelivered = false, onMapClick }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !origin || !destination) return;

    let cleanup: any = null;

    (async () => {
      // Delay initialization slightly to ensure React has painted the DOM and container has a size.
      // This is the root cause of _leaflet_pos: if map is initialized while clientHeight is 0,
      // fitBounds computes NaN zoom and crashes.
      await new Promise(resolve => setTimeout(resolve, 150));

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

      // Ensure map knows its size before doing anything
      map.invalidateSize();

      // Initialize view immediately so map has a projection state. 
      // This prevents '_leaflet_pos' errors if markers are added before fitBounds.
      map.setView([16.047079, 108.20623], 6);

      // Bright, standard Google Maps tiles
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}", {
        attribution: "Dữ liệu bản đồ ©2026 Google",
        maxZoom: 18,
      }).addTo(map);

      // Add Map Click Listener for setting new waypoint
      if (onMapClick) {
        map.on('click', async (e: any) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`,
              { headers: { "Accept-Language": "vi", "User-Agent": "VTSC-PaintPro/1.0" } }
            );
            const data = await res.json();
            if (data && data.display_name) {
              onMapClick(data.display_name);
            }
          } catch (err) {
            console.error("Reverse geocoding error:", err);
          }
        });
      }

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
          background:#2563eb;border:3px solid white;
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

      // Add origin marker with popup (but don't open popup yet to avoid _leaflet_pos error if view isn't set)
      const originMarker = L.marker(originCoords, { icon: originIcon })
        .addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;font-weight:bold;font-size:13px;">${origin.split(',')[0]}</div>`, { closeButton: false, autoClose: false, closeOnClick: false });

      // Force routing through Vietnam coast (QL1A) to avoid going through Laos/Cambodia
      const controlPoints: [number, number][] = [
        [18.6734, 105.6813], // Vinh
        [16.0544, 108.2022], // Da Nang
        [12.2388, 109.1967], // Nha Trang
      ];

      let waypoints = [originCoords];

      // Determine if North to South
      if (originCoords[0] > 19 && destCoords[0] < 13) {
        waypoints.push(...controlPoints);
      }
      // Determine if South to North
      else if (originCoords[0] < 13 && destCoords[0] > 19) {
        waypoints.push(...[...controlPoints].reverse());
      }

      if (currentCoords) {
        waypoints.push(currentCoords);
      }
      waypoints.push(destCoords);

      const coordString = waypoints.map(c => `${c[1]},${c[0]}`).join(';');

      // Fetch route from OSRM (free, no API key needed)
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

        const routeRes = await fetch(osrmUrl);
        const routeData = await routeRes.json();

        if (routeData.code === "Ok" && routeData.routes?.length > 0) {
          const coords = routeData.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          // Draw the route line
          const routeLine = L.polyline(coords, {
            color: "#1e3a8a", // Dark Blue (blue-900)
            weight: 6,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          // Fit map to show entire route FIRST
          map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });

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
              <div style="font-size:13px;color:#2563eb;font-weight:bold;margin-top:2px;">${destination.split(',')[0]}</div>
            </div>`, { closeButton: false, autoClose: false, closeOnClick: false })
            .openPopup();

          originMarker.openPopup();
        } else {
          throw new Error("OSRM returned non-Ok code or empty route");
        }
      } catch (routeErr) {
        console.warn("Route fetch failed, showing markers only:", routeErr);

        // Fit bounds FIRST before opening popups
        if (currentCoords) {
          map.fitBounds([originCoords, currentCoords, destCoords], { padding: [60, 60] });
        } else {
          map.fitBounds([originCoords, destCoords], { padding: [60, 60] });
        }

        L.marker(destCoords, { icon: destIcon }).addTo(map);
        L.marker(currentCoords || destCoords, { icon: truckIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:sans-serif;text-align:center;">
            <div style="font-size:12px;color:#333;">${isDelivered ? "Đã giao thành công" : "Đang trên đường đến"}</div>
            <div style="font-size:13px;color:#2563eb;font-weight:bold;margin-top:2px;">${destination.split(',')[0]}</div>
          </div>`, { closeButton: false, autoClose: false, closeOnClick: false })
          .openPopup();

        originMarker.openPopup();
      }
    })();

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();

      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origin, destination, currentLocation, isDelivered, onMapClick]);

  // Handlers for Ctrl + Scroll
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Control' && mapInstanceRef.current) {
      mapInstanceRef.current.scrollWheelZoom.enable();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Control' && mapInstanceRef.current) {
      mapInstanceRef.current.scrollWheelZoom.disable();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full group"
      onWheelCapture={(e) => {
        if (!e.ctrlKey) {
          // If they scroll without Ctrl, we can let the page scroll.
          // But to be helpful, we could show a tooltip saying "Use Ctrl + Scroll to zoom"
        }
      }}
    >
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
