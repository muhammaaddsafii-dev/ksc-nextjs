'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type GeoJSONFC = {
  type: 'FeatureCollection';
  features: Array<{ type: 'Feature'; geometry: any; properties: any }>;
};

function FitBounds({ data }: { data: GeoJSONFC }) {
  const map = useMap();
  useEffect(() => {
    if (!data.features.length) return;
    try {
      const layer = L.geoJSON(data as any);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24] });
      }
    } catch {
      // bounds tidak valid, biarkan map di posisi default
    }
  }, [data, map]);
  return null;
}

async function parseFile(url: string, fileName: string): Promise<GeoJSONFC> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} – gagal mengambil file dari server`);
  const buffer = await res.arrayBuffer();
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.geojson') || lower.endsWith('.json')) {
    const text = new TextDecoder().decode(buffer);
    const json = JSON.parse(text);
    if (json.type === 'FeatureCollection') return json as GeoJSONFC;
    return { type: 'FeatureCollection', features: [json] };
  }

  if (lower.endsWith('.zip')) {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);
    const files = Object.values(zip.files).filter(f => !f.dir);

    const shpEntry = files.find(f => f.name.toLowerCase().endsWith('.shp'));
    if (!shpEntry) throw new Error('File ZIP tidak mengandung file .shp');

    const dbfEntry = files.find(f => f.name.toLowerCase().endsWith('.dbf'));
    const shpBuf = await shpEntry.async('arraybuffer');
    const dbfBuf = dbfEntry ? await dbfEntry.async('arraybuffer') : undefined;

    const shapefile = await import('shapefile');
    const result = await shapefile.read(shpBuf, dbfBuf as any);
    return result as GeoJSONFC;
  }

  if (lower.endsWith('.shp')) {
    const shapefile = await import('shapefile');
    const result = await shapefile.read(buffer);
    return result as GeoJSONFC;
  }

  throw new Error('Format file tidak didukung untuk tampilan peta (gunakan .shp, .zip, atau .geojson)');
}

interface AoiMapViewerProps {
  fileUrl: string;
  fileName: string;
}

export default function AoiMapViewer({ fileUrl, fileName }: AoiMapViewerProps) {
  const [geoJSON, setGeoJSON] = useState<GeoJSONFC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setGeoJSON(null);
    parseFile(fileUrl, fileName)
      .then(setGeoJSON)
      .catch(e => setError(e.message ?? 'Gagal memuat data AOI'))
      .finally(() => setLoading(false));
  }, [fileUrl, fileName]);

  if (loading) {
    return (
      <div className="h-72 rounded-lg border bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-500">Memuat data spasial AOI…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-72 rounded-lg border bg-red-50 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-sm font-medium text-red-600">Gagal menampilkan peta AOI</p>
          <p className="text-xs mt-1 text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!geoJSON) return null;

  return (
    <div className="h-72 rounded-lg border overflow-hidden">
      <MapContainer
        center={[-2.5, 117.5]}
        zoom={5}
        className="h-full w-full"
        scrollWheelZoom={false}
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={fileUrl}
          data={geoJSON as any}
          style={{
            color: '#1565C0',
            weight: 2,
            opacity: 0.9,
            fillColor: '#1976D2',
            fillOpacity: 0.25,
          }}
        />
        <FitBounds data={geoJSON} />
      </MapContainer>
    </div>
  );
}
