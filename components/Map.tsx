import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SECTORS } from '../constants';

interface MapProps {
  onSectorSelect: (sector: string) => void;
}

// Fix Leaflet's default icon path issues in some bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const IndiaMap: React.FC<MapProps> = ({ onSectorSelect }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    
    useEffect(() => {
        if(!mapRef.current || mapInstanceRef.current) return;
        
        const map = L.map(mapRef.current, { 
            zoomControl: false, 
            attributionControl: false, 
            scrollWheelZoom: false,
            dragging: window.innerWidth > 768 
        }).setView([22.5, 79.0], window.innerWidth < 768 ? 4 : 5);
        
        mapInstanceRef.current = map;
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
            maxZoom: 19,
            subdomains: 'abcd' 
        }).addTo(map);

        const coords: {[key: string]: [number, number]} = {
            goa: [15.4909, 73.8278],
            himachal: [32.2432, 77.1892],
            rajasthan: [26.9124, 75.7873],
            kerala: [9.9312, 76.2673],
            uttarakhand: [30.3165, 78.0322],
            karnataka: [15.3350, 76.4600],
            meghalaya: [25.5788, 91.8933]
        };

        Object.entries(coords).forEach(([key, val]) => {
             const icon = L.divIcon({
                className: 'bg-transparent',
                html: `<div class="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                        <div class="absolute w-full h-full border border-gold rounded-full opacity-0 animate-ping"></div>
                        <div class="w-3 h-3 bg-gold rounded-full shadow-[0_0_10px_#FFD700] border-2 border-white z-20"></div>
                        <div class="absolute top-8 bg-black/90 border border-cyan px-2 py-1 text-[9px] font-code text-cyan uppercase opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
                            ${key.toUpperCase()}
                        </div>
                       </div>`,
                iconSize: [48, 48]
             });
             
             L.marker(val, {icon}).addTo(map).on('click', () => onSectorSelect(key));
        });
        
        // Clean up
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [onSectorSelect]);

    return (
        <div className="w-full h-full min-h-[50vh] md:min-h-full rounded-lg overflow-hidden border border-slate-800 relative z-0">
             <div ref={mapRef} className="absolute inset-0 z-0 bg-void" />
        </div>
    );
};