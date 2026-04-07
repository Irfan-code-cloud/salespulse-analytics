import React, { useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Order } from '../data';
import { useEffect } from 'react';

// Fix for Leaflet marker icons using Vite's URL handling
const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href;
const iconShadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href;

let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

interface CityStat {
  name: string;
  lat: number;
  lng: number;
  total: number;
  count: number;
}

const ViewportMarkers = ({ cityStats }: { cityStats: CityStat[] }) => {
  const [visibleMarkers, setVisibleMarkers] = useState<CityStat[]>([]);
  
  const updateVisibleMarkers = useCallback((map: L.Map) => {
    const bounds = map.getBounds();
    const filtered = cityStats.filter(city => 
      bounds.contains([city.lat, city.lng])
    );
    setVisibleMarkers(filtered);
  }, [cityStats]);

  const map = useMapEvents({
    moveend: () => {
      updateVisibleMarkers(map);
    },
    zoomend: () => {
      updateVisibleMarkers(map);
    }
  });

  // Initial update
  useEffect(() => {
    updateVisibleMarkers(map);
  }, [map, updateVisibleMarkers]);

  return (
    <>
      {visibleMarkers.map((city) => (
        <Marker key={city.name} position={[city.lat, city.lng]}>
          <Popup>
            <div className="font-sans p-1">
              <h4 className="font-bold text-[0.875rem] mb-1">{city.name}</h4>
              <p className="text-[0.75rem] text-[#141414]/60 mb-0.5">Total Sales: <span className="font-bold text-[#141414]">${city.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
              <p className="text-[0.75rem] text-[#141414]/60">Orders: <span className="font-bold text-[#141414]">{city.count}</span></p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

interface SalesMapProps {
  orders: Order[];
}

export const SalesMap: React.FC<SalesMapProps> = ({ orders }) => {
  const cityStats = useMemo(() => {
    const stats: Record<string, { lat: number; lng: number; total: number; count: number }> = {};
    
    orders.forEach(order => {
      if (!stats[order.city]) {
        stats[order.city] = {
          lat: order.lat,
          lng: order.lng,
          total: 0,
          count: 0
        };
      }
      stats[order.city].total += order.price;
      stats[order.city].count += 1;
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [orders]);

  return (
    <div className="h-full w-full rounded-[0.75rem] overflow-hidden border border-[#141414]/10 shadow-sm bg-white min-h-[300px]">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewportMarkers cityStats={cityStats} />
      </MapContainer>
    </div>
  );
};
