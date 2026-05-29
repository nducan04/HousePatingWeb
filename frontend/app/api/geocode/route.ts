import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = searchParams.get('limit') || '5';
  
  if (!q) return NextResponse.json([], { status: 400 });

  try {
    // Use Photon API which doesn't have the strict 1 req/sec limit like Nominatim
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VTSC-PaintPro/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocode API error' }, { status: res.status });
    }

    const data = await res.json();
    
    if (!data.features) {
       return NextResponse.json([]);
    }

    // Map Photon response to Nominatim format so frontend doesn't break
    const mapped = data.features.map((f: any) => {
        const props = f.properties;
        const addressParts = [
            props.name,
            props.housenumber ? `${props.housenumber} ${props.street}` : props.street,
            props.district,
            props.city,
            props.state,
            props.country
        ].filter(Boolean);

        // De-duplicate address parts
        const uniqueParts = Array.from(new Set(addressParts));

        return {
            lat: f.geometry.coordinates[1].toString(),
            lon: f.geometry.coordinates[0].toString(),
            display_name: uniqueParts.join(', '),
        };
    });

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Geocode proxy error:", err);
    return NextResponse.json({ error: 'Failed to geocode' }, { status: 500 });
  }
}
