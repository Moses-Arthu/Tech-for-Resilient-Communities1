import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RiskMap = ({ locations, riskLevel }) => {
  const center = locations && locations.length > 0 
    ? [locations[0].lat, locations[0].lng] 
    : [5.6037, -0.1870];

  const getRiskColor = (level) => {
    switch(level) {
      case 'RED': return '#EF4444';
      case 'ORANGE': return '#F59E0B';
      case 'YELLOW': return '#EAB308';
      case 'GREEN': return '#10B981';
      default: return '#3B82F6';
    }
  };

  const getRiskLabel = (level) => {
    switch(level) {
      case 'RED': return '🔴 DO NOT TRAVEL';
      case 'ORANGE': return '🟠 HIGH RISK';
      case 'YELLOW': return '🟡 MODERATE RISK';
      case 'GREEN': return '🟢 SAFE TO TRAVEL';
      default: return 'ℹ️ INFO';
    }
  };

  return (
    <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
      {locations && locations.map((loc, idx) => (
        <React.Fragment key={idx}>
          <Marker position={[loc.lat, loc.lng]}>
            <Popup>
              <div className="text-sm max-w-xs">
                <p className="font-bold">{loc.name || 'Location'}</p>
                <p className="text-xs">{getRiskLabel(loc.risk || riskLevel)}</p>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={[loc.lat, loc.lng]}
            radius={loc.radius || 2000}
            pathOptions={{
              color: getRiskColor(loc.risk || riskLevel),
              fillColor: getRiskColor(loc.risk || riskLevel),
              fillOpacity: 0.15,
              weight: 2,
              dashArray: (loc.risk === 'RED' || riskLevel === 'RED') ? '8,4' : undefined
            }}
          />
        </React.Fragment>
      ))}
    </MapContainer>
  );
};

export default RiskMap;
