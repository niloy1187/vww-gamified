
import React, { useState, useEffect } from 'react';
import { Mission, UserProfile } from '../types';
import { audio } from '../services/audio';

interface MissionDossierProps {
    mission: Mission;
    userProfile: UserProfile;
    onClose: () => void;
    onBook: () => void;
    isVerified: boolean;
}

export const MissionDossier: React.FC<MissionDossierProps> = ({ mission, userProfile, onClose, onBook, isVerified }) => {
    const [activeTab, setActiveTab] = useState<'INTEL' | 'LOGISTICS' | 'RECON'>('INTEL');
    const [bookingState, setBookingState] = useState<'IDLE' | 'PROCESSING' | 'CONFIRMED'>('IDLE');

    useEffect(() => {
        audio.playSFX('scan');
        return () => audio.playSFX('click');
    }, []);

    const handleBooking = () => {
        if (isVerified) {
            audio.playSFX('click');
            setBookingState('PROCESSING');
            setTimeout(() => {
                audio.playSFX('success');
                setBookingState('CONFIRMED');
            }, 2000);
        } else {
            onBook();
        }
    };

    const getTransportIcon = (mode: string) => {
        switch(mode) {
            case 'Air': return '✈️';
            case 'Water': return '🛥️';
            case 'Trek': return '🥾';
            default: return '🚐';
        }
    };

    const getStayIcon = (type: string) => {
        switch(type) {
            case 'Camp': return '⛺';
            case 'Resort': return '🏨';
            case 'Homestay': return '🏡';
            case 'Houseboat': return '⚓';
            default: return '🛏️';
        }
    };

    const getWeatherIcon = (condition: string = '') => {
        const c = condition.toLowerCase();
        if (c.includes('rain') || c.includes('drizzle') || c.includes('downpour')) return '🌧️';
        if (c.includes('cloud') || c.includes('overcast') || c.includes('mist') || c.includes('fog')) return '☁️';
        if (c.includes('sunny') || c.includes('clear')) return '☀️';
        if (c.includes('snow')) return '❄️';
        if (c.includes('wind') || c.includes('breezy')) return '💨';
        return '🌡️';
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-8 animate-fade-in font-body">
            <div className="w-full h-full md:max-w-7xl md:h-[90vh] bg-panel border-2 border-gold/50 shadow-[0_0_100px_rgba(255,215,0,0.1)] flex flex-col md:flex-row overflow-hidden relative">
                
                {/* HEADER / CLOSE */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
                    <div className="bg-black/80 px-4 py-2 border border-gold/30 backdrop-blur pointer-events-auto flex items-center gap-4">
                        <div>
                            <h1 className="font-hud text-xl md:text-2xl text-white tracking-widest">{mission.codename}</h1>
                            <div className="flex gap-3 font-code text-xs mt-1">
                                <span className="text-crimson font-bold">THREAT: {mission.threat}</span>
                                <span className="text-cyan">INTEL_LVL_{mission.intelLevel}</span>
                            </div>
                        </div>
                        
                        {bookingState === 'IDLE' && (
                            <button 
                                onClick={handleBooking}
                                className="hidden md:block pointer-events-auto bg-gold border border-gold px-6 py-2 text-black hover:bg-white hover:text-black transition-all font-hud text-xs font-bold uppercase shadow-[0_0_15px_rgba(255,215,0,0.4)] animate-pulse"
                            >
                                {isVerified ? 'CONFIRM DEPLOYMENT' : 'INITIATE BOOKING'}
                            </button>
                        )}
                        {bookingState === 'PROCESSING' && (
                            <div className="hidden md:flex pointer-events-auto bg-black border border-gold px-6 py-2 text-gold font-hud text-xs font-bold items-center gap-2">
                                <span className="animate-spin">⟳</span> CONTACTING HQ...
                            </div>
                        )}
                        {bookingState === 'CONFIRMED' && (
                            <div className="hidden md:block pointer-events-auto bg-green-500 border border-green-500 px-6 py-2 text-black font-hud text-xs font-bold">
                                ✓ MISSION REQUEST SENT
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="pointer-events-auto bg-black border border-slate-600 px-4 py-2 text-slate-300 hover:text-white hover:border-gold hover:bg-gold hover:text-black transition-all font-code text-xs font-bold uppercase">
                        [ ABORT ]
                    </button>
                </div>

                {/* LEFT: VISUALS / RECON */}
                <div className="w-full md:w-5/12 h-1/3 md:h-full bg-black relative border-b md:border-b-0 md:border-r border-gold/20 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-grid-pattern z-20 pointer-events-none"></div>
                    
                    {activeTab === 'RECON' ? (
                        <div className="absolute inset-0 z-0 bg-slate-900 overflow-hidden flex items-center justify-center">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 to-black animate-pulse z-10"></div>
                             <div className="absolute inset-0 border-[40px] border-black/50 rounded-full scale-150 animate-ping-slow opacity-20 z-10"></div>
                             <div className="absolute top-1/2 left-1/2 w-[200%] h-0.5 bg-green-500/50 -translate-x-1/2 -translate-y-1/2 animate-spin-slow origin-center z-20"></div>
                             
                             <div className="absolute bottom-10 left-10 font-code text-xs text-green-500 z-30 bg-black/50 p-2 border-l-2 border-green-500">
                                 SCANNING TERRAIN...<br/>
                                 LAT: {mission.weather ? (Math.random() * 10 + 10).toFixed(4) : '00.0000'} N<br/>
                                 LNG: {mission.weather ? (Math.random() * 10 + 70).toFixed(4) : '00.0000'} E
                             </div>

                             {mission.media?.[0]?.src && (
                                <img 
                                    src={mission.media[0].src} 
                                    className="w-full h-full object-cover opacity-40 mix-blend-luminosity filter contrast-150 grayscale"
                                    style={{ imageRendering: 'pixelated' }}
                                    alt="Terrain Recon"
                                />
                             )}
                        </div>
                    ) : (
                        mission.media?.[0]?.src && (
                            <img 
                                src={mission.media[0].src} 
                                className="w-full h-full object-cover opacity-80 mix-blend-normal filter contrast-110"
                                alt="Mission Visual"
                            />
                        )
                    )}
                    
                    {mission.weather && (
                        <div className="absolute bottom-4 left-4 z-40 bg-black/80 backdrop-blur border-l-2 border-cyan p-3 shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-code text-slate-400">LIVE FEED</span>
                            </div>
                            <div className="text-2xl font-hud text-white">{mission.weather.temp || '--'}</div>
                            <div className="text-xs font-body font-semibold text-cyan uppercase">{mission.weather.condition || 'UNKNOWN'}</div>
                        </div>
                    )}
                </div>

                {/* RIGHT: TACTICAL DATA */}
                <div className="w-full md:w-7/12 h-2/3 md:h-full flex flex-col bg-panel">
                    <div className="flex border-b border-slate-800 bg-black/40">
                        {['INTEL', 'LOGISTICS', 'RECON'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); audio.playSFX('click'); }}
                                className={`flex-1 py-4 font-hud text-xs md:text-sm font-bold tracking-widest transition-all ${activeTab === tab ? 'bg-gold/10 text-gold border-b-2 border-gold' : 'text-slate-500 hover:text-slate-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-void/30">
                        {/* MOBILE BOOKING BUTTON */}
                        <div className="md:hidden mb-6">
                            {bookingState === 'IDLE' && (
                                <button 
                                    onClick={handleBooking}
                                    className="w-full py-3 bg-gold text-black font-hud text-sm font-bold tracking-widest shadow-[0_0_10px_rgba(255,215,0,0.3)] animate-pulse"
                                >
                                    {isVerified ? 'CONFIRM DEPLOYMENT' : 'INITIATE BOOKING'}
                                </button>
                            )}
                            {bookingState === 'PROCESSING' && (
                                <div className="w-full py-3 bg-black border border-gold text-gold font-hud text-sm font-bold text-center">
                                    CONTACTING HQ...
                                </div>
                            )}
                            {bookingState === 'CONFIRMED' && (
                                <div className="w-full py-3 bg-green-500 text-black font-hud text-sm font-bold text-center">
                                    ✓ REQUEST SENT
                                </div>
                            )}
                        </div>

                        {activeTab === 'INTEL' && (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h3 className="text-cyan font-code text-xs uppercase tracking-widest mb-3 border-b border-cyan/20 pb-1 w-max">MISSION BRIEFING</h3>
                                    <p className="font-body text-lg md:text-xl text-slate-300 leading-relaxed font-semibold">
                                        {mission.tacticalBrief}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 md:gap-4">
                                    <div className="bg-slate-900/50 border border-slate-700 p-4 flex flex-col items-center justify-center text-center hover:border-gold/50 transition-colors">
                                        <div className="text-2xl mb-2">{getTransportIcon(mission.transportMode)}</div>
                                        <div className="text-[9px] font-code text-slate-400 uppercase">TRANSPORT</div>
                                        <div className="text-sm font-hud text-white font-bold">{mission.transportMode}</div>
                                    </div>
                                    <div className="bg-slate-900/50 border border-slate-700 p-4 flex flex-col items-center justify-center text-center hover:border-gold/50 transition-colors">
                                        <div className="text-2xl mb-2">{getStayIcon(mission.stayType)}</div>
                                        <div className="text-[9px] font-code text-slate-400 uppercase">BASE CAMP</div>
                                        <div className="text-sm font-hud text-white font-bold">{mission.stayType}</div>
                                    </div>
                                    <div className="bg-slate-900/50 border border-slate-700 p-4 flex flex-col items-center justify-center text-center hover:border-gold/50 transition-colors">
                                        <div className="text-xl mb-2 text-gold font-hud">{mission.vfm}</div>
                                        <div className="text-[9px] font-code text-slate-400 uppercase">VALUE INDEX</div>
                                        <div className="text-sm font-hud text-white font-bold">HIGH</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/30 border border-slate-800 p-4">
                                        <div className="text-[10px] font-code text-slate-500 uppercase">OPTIMAL WINDOW</div>
                                        <div className="text-xl font-hud text-white">{mission.optimalSeason}</div>
                                    </div>
                                    <div className="bg-black/30 border border-slate-800 p-4">
                                        <div className="text-[10px] font-code text-slate-500 uppercase">MISSION COST</div>
                                        <div className="text-xl font-hud text-gold">{mission.price}</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-dashed border-slate-800">
                                    {isVerified ? (
                                        <div className="w-full py-4 bg-green-600 text-white shadow-[0_0_20px_rgba(0,255,0,0.3)] font-hud text-sm font-bold tracking-widest text-center clip-corner">
                                            INTEL VERIFIED: 100% ACCURATE
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={onBook}
                                            className="w-full py-4 font-hud text-sm font-bold tracking-widest transition-all clip-corner bg-cyan/10 text-cyan border border-cyan hover:bg-cyan hover:text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                                        >
                                            VERIFY IDENTITY TO UNLOCK
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'LOGISTICS' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-gold font-code text-xs uppercase tracking-widest mb-4">CLASSIFIED ASSETS</h3>
                                    {isVerified ? (
                                        <ul className="space-y-3">
                                            {mission.lockedInclusions.map((inc, i) => (
                                                <li key={i} className="flex items-center gap-4 bg-green-900/10 border border-green-900/30 p-4 rounded-r-lg border-l-4 border-l-green-500 animate-fade-in">
                                                    <span className="text-green-500 text-xl">🔓</span>
                                                    <span className="font-body font-bold text-green-100 text-sm tracking-wide">{inc}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div 
                                            onClick={onBook}
                                            className="bg-crimson/5 border border-dashed border-crimson p-6 text-center cursor-pointer hover:bg-crimson/10 transition-colors group"
                                        >
                                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔒</div>
                                            <h4 className="font-hud text-crimson mb-1">RESTRICTED ACCESS</h4>
                                            <p className="font-code text-xs text-crimson/70">
                                                TACTICAL ASSETS ENCRYPTED.<br/>
                                                <span className="underline">CLICK TO VERIFY IDENTITY</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-cyan font-code text-xs uppercase tracking-widest mb-4">STANDARD PROVISIONS</h3>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {mission.inclusions.map((inc, i) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-300 font-body text-sm font-medium p-3 bg-slate-900/30 border border-slate-800">
                                                <span className="w-2 h-2 bg-cyan rounded-sm rotate-45"></span>
                                                {inc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="bg-slate-900/50 p-5 border border-slate-700 mt-4">
                                    <h3 className="text-slate-400 font-code text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="text-lg">⚠</span> OPERATIONAL NOTES
                                    </h3>
                                    <p className="font-body text-sm text-slate-400 leading-relaxed">
                                        Prices are per operative on a twin-sharing basis. Logistics include local transfers only; aerial insertion (flights) not included. Cancellation protocol active: 48hr window.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'RECON' && (
                            <div className="h-full flex flex-col animate-fade-in space-y-6">
                                <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-lg backdrop-blur-sm shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>
                                    
                                    <h3 className="text-cyan font-code text-xs uppercase tracking-widest mb-6 border-b border-cyan/30 pb-2">
                                        ATMOSPHERIC SCAN // REAL-TIME MODEL
                                    </h3>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl mb-2 drop-shadow-lg filter brightness-125">🌡️</span>
                                            <span className="text-4xl font-hud text-white tracking-tighter">{mission.weather?.temp.replace(/[^0-9]/g, '')}°</span>
                                            <span className="text-[10px] text-slate-400 font-code uppercase tracking-widest mt-1">THERMAL</span>
                                        </div>
                                        
                                        <div className="flex flex-col items-center border-l border-slate-700/50">
                                            <span className="text-3xl mb-2 drop-shadow-lg filter brightness-125">💧</span>
                                            <span className="text-3xl font-hud text-cyan mt-1 tracking-tighter">{mission.weather?.humidity.replace(/[^0-9%]/g, '')}</span>
                                            <span className="text-[10px] text-slate-400 font-code uppercase tracking-widest mt-1">HUMIDITY</span>
                                        </div>
                                        
                                        <div className="flex flex-col items-center border-l border-slate-700/50">
                                            <span className="text-3xl mb-2 drop-shadow-lg filter brightness-125">{getWeatherIcon(mission.weather?.condition)}</span>
                                            <span className="text-xl font-hud text-gold font-bold mt-2 uppercase tracking-tight">{mission.weather?.condition}</span>
                                            <span className="text-[10px] text-slate-400 font-code uppercase tracking-widest mt-1">STATUS</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-dashed border-slate-700 flex justify-between items-center">
                                         <span className="text-[9px] font-code text-slate-500">SATELLITE: VWW-SAT-4</span>
                                         <span className="text-[9px] font-code text-green-500 animate-pulse">● LIVE DATA STREAM</span>
                                    </div>
                                </div>

                                <div className="p-6 border border-dashed border-slate-700 bg-black/20 flex-1 flex flex-col justify-center items-center text-center">
                                    <div className="text-6xl mb-4 opacity-80">🛰️</div>
                                    <h2 className="font-hud text-2xl text-white tracking-widest mb-2">SATELLITE UPLINK ACTIVE</h2>
                                    <p className="font-body text-slate-300 max-w-md text-lg font-medium leading-relaxed">
                                        <span className="text-cyan font-bold">Terrain Analysis:</span> {mission.weather?.condition || 'Analyzing...'} conditions detected. 
                                        <br/>
                                        <span className="text-gold font-bold">Mobility Status:</span> {mission.transportMode} transport recommended.
                                    </p>
                                    
                                    <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden mt-6 relative">
                                        <div className="absolute top-0 left-0 h-full w-full bg-green-500/20"></div>
                                        <div className="absolute top-0 left-0 h-full w-1/2 bg-green-500 animate-[ticker_1.5s_linear_infinite]"></div>
                                    </div>
                                    
                                    <p className="font-code text-xs text-green-500 animate-pulse mt-2">DOWNLOADING TOPOGRAPHY...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
