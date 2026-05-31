import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Neo-Brutalist HTML/SVG Markers to avoid Leaflet static assets path issues in Vite
const customerIcon = L.divIcon({
  html: `
    <div style="
      background-color: #A2D2FF; 
      border: 3px solid #1E1E1E; 
      border-radius: 8px; 
      padding: 6px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 16px; 
      box-shadow: 2px 2px 0 0 #1E1E1E;
    ">🏠</div>
  `,
  className: 'custom-leaflet-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const sitterIcon = L.divIcon({
  html: `
    <div style="
      background-color: #FFB5C6; 
      border: 3px solid #1E1E1E; 
      border-radius: 8px; 
      padding: 6px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 16px; 
      box-shadow: 2px 2px 0 0 #1E1E1E;
    ">🐱</div>
  `,
  className: 'custom-leaflet-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const CheckinMap = ({ customerLat, customerLng, sitterLat, sitterLng, distance }) => {
  if (!customerLat || !customerLng || !sitterLat || !sitterLng) return null;

  const center = [
    (parseFloat(customerLat) + parseFloat(sitterLat)) / 2,
    (parseFloat(customerLng) + parseFloat(sitterLng)) / 2
  ];

  const positions = [
    [parseFloat(customerLat), parseFloat(customerLng)],
    [parseFloat(sitterLat), parseFloat(sitterLng)]
  ];

  return (
    <div className="relative border-4 border-neo-dark rounded-xl overflow-hidden h-[240px] md:h-[280px] shadow-[4px_4px_0_0_#1E1E1E] bg-[#FAF8F5] z-10">
      <MapContainer 
        center={center} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Customer Location */}
        <Marker position={[parseFloat(customerLat), parseFloat(customerLng)]} icon={customerIcon}>
          <Popup>
            <div className="font-fredoka font-bold text-xs">🏠 Lokasi Rumah Pelanggan</div>
          </Popup>
        </Marker>

        {/* Sitter Checkin Location */}
        <Marker position={[parseFloat(sitterLat), parseFloat(sitterLng)]} icon={sitterIcon}>
          <Popup>
            <div className="font-fredoka font-bold text-xs">🐱 Titik Sitter Check-in</div>
          </Popup>
        </Marker>

        {/* Line linking Sitter and Customer */}
        <Polyline 
          positions={positions} 
          pathOptions={{ color: '#1E1E1E', weight: 4, dashArray: '6, 6' }} 
        />
      </MapContainer>

      {/* Floating Distance Badge */}
      <div className="absolute bottom-3 left-3 bg-[#FFF8E7] border-3 border-neo-dark px-3 py-1.5 rounded-lg font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] z-[1000] flex items-center gap-1.5">
        <span>📍 Jarak Validasi:</span>
        <span className="bg-[#55EC8C] border-2 border-neo-dark px-1.5 py-0.5 rounded text-[10px] uppercase font-black">
          {distance} meter
        </span>
      </div>
    </div>
  );
};

export default CheckinMap;
