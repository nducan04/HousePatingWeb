import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  if (!lat || !lon) return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });

  try {
    // Use Photon API for reverse geocoding
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VTSC-PaintPro/1.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Reverse Geocode API error' }, { status: res.status });
    }

    const data = await res.json();
    
    if (!data.features || data.features.length === 0) {
        return NextResponse.json({});
    }

    const f = data.features[0];
    const props = f.properties;
    const addressParts = [
        props.name,
        props.housenumber ? `${props.housenumber} ${props.street}` : props.street,
        props.district,
        props.city,
        props.state,
        props.country
    ].filter(Boolean);

    const uniqueParts = Array.from(new Set(addressParts));

    // Map to Nominatim format
    return NextResponse.json({
        display_name: uniqueParts.join(', '),
        lat: f.geometry.coordinates[1].toString(),
        lon: f.geometry.coordinates[0].toString()
    });

  } catch (err) {
    console.error("Reverse geocode proxy error:", err);
    return NextResponse.json({ error: 'Failed to reverse geocode' }, { status: 500 });
  }
}
