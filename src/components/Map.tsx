import  { useState } from 'react';
import { Navigation, Map as MapIcon } from 'lucide-react';

interface MapProps {
  center?: { lat: number; lng: number };
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title: string;
    info?: string;
  }>;
  zoom?: number;
  height?: string;
  width?: string;
}

export default function Map({ 
  markers = [], 
  height = '400px',
}: MapProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Format position to a readable string
  const formatPosition = (pos: { lat: number; lng: number }) => {
    return `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
  };

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ height }}>
      {/* Fallback map image */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxtYXAlMjBsb2NhdGlvbiUyMHRyYWNraW5nfGVufDB8fHx8MTc0MjkyMDUwOHww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
          alt="Map background" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      {/* Markers */}
      {markers.map((marker) => (
        <div 
          key={marker.id}
          className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ 
            left: `${(0.5 + (marker.position.lng % 180) / 360) * 100}%`, 
            top: `${(0.5 - (marker.position.lat % 90) / 180) * 100}%` 
          }}
          onClick={() => setSelectedMarker(marker.id === selectedMarker ? null : marker.id)}
        >
          <div className="bg-red-500 p-2 rounded-full shadow-lg">
            <Navigation className="h-4 w-4 text-white" />
          </div>
          
          {/* Pulse animation */}
          <div className="absolute -inset-2 bg-red-500 rounded-full opacity-30 animate-ping"></div>
          
          {/* Info window */}
          {selectedMarker === marker.id && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-md shadow-lg p-3 w-48 z-20">
              <h4 className="font-bold text-sm">{marker.title}</h4>
              {marker.info && <p className="text-xs text-gray-600 mt-1">{marker.info}</p>}
              <p className="text-xs mt-1 flex items-center text-gray-500">
                <Navigation className="h-3 w-3 mr-1" />
                {formatPosition(marker.position)}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* No markers message */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 text-white">
          <MapIcon className="h-12 w-12 mb-2 opacity-80" />
          <p className="text-lg font-medium">No active vehicles</p>
          <p className="text-sm opacity-80">Location tracking will appear here</p>
        </div>
      )}

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-70 px-2 py-1 rounded text-xs text-gray-700">
        Map visualization
      </div>
    </div>
  );
}
 