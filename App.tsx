
import React, { useState, useEffect } from 'react';
import { BootScreen } from './components/BootScreen';
import { IndiaMap } from './components/Map';
import { IntelTerminal } from './components/IntelTerminal';
import { HandlerZero } from './components/HandlerZero';
import { MissionDossier } from './components/MissionDossier';
import { PACKAGES, SECTORS, ETHOS_DATA } from './constants';
import { audio } from './services/audio';
import { Mission, SectorKey, UserProfile } from './types';

const App: React.FC = () => {
    const [booted, setBooted] = useState(false);
    const [view, setView] = useState<SectorKey | 'map' | 'ethos'>('map');
    
    // --- APP STATE ---
    const [userProfile, setUserProfile] = useState<UserProfile>({
        rank: 'RECRUIT',
        unlockedMissions: [],
        credits: 0,
        xp: 0
    });

    // Handler State
    const [handlerMode, setHandlerMode] = useState<'IDLE' | 'ACTIVE' | 'FORM'>('IDLE');
    const [lockedContext, setLockedContext] = useState<Mission | null>(null);

    // Dossier State
    const [dossierMission, setDossierMission] = useState<Mission | null>(null);

    const [time, setTime] = useState("");
    const [muted, setMuted] = useState(false);

    // Clock
    useEffect(() => {
        const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB')), 1000);
        return () => clearInterval(t);
    }, []);

    // --- UI HANDLERS ---

    const handleNav = (target: string) => {
        audio.playSFX('click');
        setView(target as any);
        audio.setScreenTheme(target); // Updates music theme
        setHandlerMode('IDLE'); // Reset handler to commentary mode
    };

    const handleUnlock = (pkg: Mission) => {
        audio.playSFX('scan');
        if (userProfile.rank !== 'RECRUIT') {
             // Higher ranks unlock dossier access directly
             setDossierMission(pkg);
        } else {
            // Recruit Flow: Sign up first
            setLockedContext(pkg);
            setHandlerMode('ACTIVE'); 
        }
    };

    const handleBookingRequest = (mission: Mission | null) => {
        if (!mission) return;
        // If user is ALREADY verified, handle inside dossier component directly (no loop)
        if (userProfile.rank !== 'RECRUIT') {
            setDossierMission(mission);
        } else {
            // Recruit needs to sign up first
            setDossierMission(null);
            setLockedContext(mission);
            setHandlerMode('ACTIVE');
        }
    };

    const handleGrant = () => {
        // Upgrade rank to operative after signup
        setUserProfile(prev => ({...prev, rank: 'OPERATIVE', unlockedMissions: [...prev.unlockedMissions, lockedContext?.codename || '']}));
        setHandlerMode('IDLE');
        if (lockedContext) setDossierMission(lockedContext);
        setLockedContext(null);
    };

    const toggleMute = () => {
        const isMuted = audio.toggleMute();
        setMuted(isMuted);
    };

    const handleBootComplete = () => {
        setBooted(true);
    };

    if (!booted) return <BootScreen onComplete={handleBootComplete} />;

    const tickerContent = "OPERATIVE_44 SECURED GOA_BLITZ +++ INTEL: KERALA PRICES DROPPING +++ AGENT_KAI REQUESTED SPITI CLEARANCE +++ SYSTEM ALERT: RAJASTHAN 85% CAPACITY +++ PALATE PILGRIM DATA STREAM ACTIVE +++ HANDLER ZERO IS ONLINE +++ ";

    return (
        <div className="flex flex-col h-screen w-full relative overflow-hidden bg-void font-body">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            
            {/* HEADER */}
            <header className="sticky top-0 z-30 flex flex-col w-full bg-void/90 border-b border-slate-800 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 h-16 md:h-20">
                    <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 border-2 flex items-center justify-center transition-colors ${userProfile.rank !== 'RECRUIT' ? 'border-gold' : 'border-slate-600'}`}>
                            <div className={`w-3 h-3 rounded-full animate-pulse ${userProfile.rank !== 'RECRUIT' ? 'bg-gold' : 'bg-slate-500'}`} />
                        </div>
                        <div>
                            <h1 className="font-hud font-bold text-lg md:text-2xl text-white leading-none tracking-tight">
                                VALUE <span className="text-gold">WANDERWEAVERS</span>
                            </h1>
                            <p className="hidden md:block font-code text-[9px] text-slate-400 tracking-[0.3em] uppercase mt-1">
                                An Exclusive Palate Pilgrim Offering
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <button onClick={toggleMute} className="font-code text-xs text-cyan border border-cyan/50 px-2 py-1 hover:bg-cyan/10 transition-colors uppercase">
                            [{muted ? 'UNMUTE' : 'MUTE AUDIO'}]
                        </button>

                         <div className="text-right hidden md:block">
                             <div className="text-[9px] text-slate-500 uppercase tracking-widest">CLEARANCE</div>
                             <div className={`font-code text-xs font-bold ${userProfile.rank !== 'RECRUIT' ? 'text-gold' : 'text-slate-400'}`}>
                                 {userProfile.rank}
                             </div>
                         </div>
                         
                         <div className="text-right border-l border-slate-800 pl-4 hidden md:block">
                             <div className="text-[9px] text-slate-500 uppercase tracking-widest">TIME</div>
                             <div className="font-code text-white text-sm md:text-xl font-bold">{time}</div>
                         </div>
                    </div>
                </div>
                <div className="w-full bg-black border-y border-slate-900 h-6 overflow-hidden flex items-center relative">
                    <div className="flex animate-ticker whitespace-nowrap font-code text-[10px] text-cyan">
                        <span>{tickerContent}</span>
                        <span>{tickerContent}</span>
                        <span>{tickerContent}</span>
                        <span>{tickerContent}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative z-20 flex-col md:flex-row">
                {/* SIDEBAR - Responsive Nav */}
                <nav className="w-full md:w-64 bg-panel border-b md:border-b-0 md:border-r border-slate-800 flex flex-row md:flex-col h-auto md:h-full shrink-0 overflow-x-auto md:overflow-x-visible overflow-y-hidden md:overflow-y-auto custom-scrollbar">
                    <div className="hidden md:block p-6 border-b border-slate-800">
                        <div className="text-[10px] font-hud text-gold tracking-widest">TACTICAL NAV</div>
                    </div>
                    
                    <div className="flex md:flex-col p-2 md:p-4 gap-2 md:gap-2 md:space-y-2 w-full">
                        <button onClick={() => handleNav('map')} className={`flex-shrink-0 md:w-full text-left p-3 text-sm font-hud font-bold md:border-l-2 border transition-all ${view === 'map' ? 'border-cyan text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}>GLOBAL INTEL</button>
                        <button onClick={() => handleNav('ethos')} className={`flex-shrink-0 md:w-full text-left p-3 text-sm font-hud font-bold md:border-l-2 border transition-all ${view === 'ethos' ? 'border-cyan text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}>ETHOS</button>
                        
                        <div className="hidden md:block text-[9px] text-slate-500 font-code mt-4 mb-2 px-2">SECTORS</div>
                        {SECTORS.map(s => (
                            <button 
                                key={s} 
                                onClick={() => handleNav(s)}
                                className={`flex-shrink-0 md:w-full text-left p-3 text-sm font-hud font-bold md:border-l-2 border uppercase transition-all ${view === s ? 'border-gold text-gold bg-gold/5' : 'border-transparent text-slate-400 hover:text-white'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* MAIN CONTENT */}
                <main className="flex-1 relative overflow-y-auto p-4 md:p-8 pb-32 md:pb-8 bg-black/20 custom-scrollbar">
                    {/* MOBILE HUD */}
                    <div className="md:hidden flex justify-between mb-4 bg-black/50 p-2 border border-slate-800 rounded">
                        <div className="text-cyan font-hud">{userProfile.rank}</div>
                    </div>

                    {view === 'map' && (
                        <div className="h-full flex flex-col gap-4 animate-fade-in">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-hud font-bold text-white glitch-text" data-text="GLOBAL INTEL">GLOBAL INTEL</h2>
                                <p className="text-xs font-code text-gold tracking-widest mt-2">SELECT DEPLOYMENT ZONE</p>
                            </div>
                            <div className="flex-1 relative shadow-2xl min-h-[400px]">
                                <IndiaMap onSectorSelect={(s) => handleNav(s)} />
                            </div>
                        </div>
                    )}

                    {view === 'ethos' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
                            <div className="text-center space-y-4 border-b border-slate-800 pb-8">
                                <h2 className="text-4xl md:text-7xl font-hud text-white glitch-text tracking-tighter" data-text="THE CODE">THE CODE</h2>
                                <p className="font-code text-cyan tracking-[0.5em] text-sm md:text-base">OPERATIONAL MANIFESTO // V1.0</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <h3 className="font-hud text-3xl text-gold">MISSION STATEMENT</h3>
                                    <p className="font-body text-xl text-slate-300 leading-relaxed font-semibold">
                                        We are not a travel agency. We are a tactical deployment unit for explorers who refuse to be tourists.
                                    </p>
                                    <p className="font-body text-lg text-slate-400 leading-relaxed">
                                        The grid is full of noise—tourist traps, inflated prices, and filtered realities. Value WanderWeavers cuts through the signal. We decrypt the best experiences, negotiate the lowest extraction costs, and deliver raw, unadulterated adventure.
                                    </p>
                                </div>
                                <div className="bg-black/50 border border-slate-800 p-8 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                                    <div className="relative z-10 space-y-8">
                                        {ETHOS_DATA.map((e, i) => (
                                            <div key={e.id} className="flex gap-4 group">
                                                <div className="text-4xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">{e.icon}</div>
                                                <div>
                                                    <h4 className="font-hud text-gold text-lg mb-1">{e.title}</h4>
                                                    <p className="font-body text-slate-300 font-medium text-sm leading-relaxed">{e.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-cyan/10 to-transparent p-1 border-l-4 border-cyan mt-12">
                                <div className="bg-black/40 p-8">
                                    <h3 className="font-code text-cyan text-sm tracking-widest mb-4">TACTICAL ADVANTAGE</h3>
                                    <div className="grid md:grid-cols-4 gap-6 text-center">
                                        <div>
                                            <div className="text-3xl font-hud text-white mb-2">100%</div>
                                            <div className="text-[10px] font-code text-slate-500 uppercase">VETTED ASSETS</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-hud text-white mb-2">ZERO</div>
                                            <div className="text-[10px] font-code text-slate-500 uppercase">HIDDEN FEES</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-hud text-white mb-2">24/7</div>
                                            <div className="text-[10px] font-code text-slate-500 uppercase">OPERATIONAL SUPPORT</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-hud text-white mb-2">Lvl 5</div>
                                            <div className="text-[10px] font-code text-slate-500 uppercase">SECURITY CLEARANCE</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {SECTORS.includes(view as string) && (
                        <div className="w-full pb-24 animate-fade-in">
                             <div className="mb-8 p-6 bg-gradient-to-r from-panel to-transparent border-l-4 border-gold">
                                <h2 className="text-3xl md:text-5xl font-hud font-bold text-white mb-2">{PACKAGES[view as string].title.split(':')[1]}</h2>
                                <p className="font-code text-xs md:text-sm text-slate-300 tracking-widest uppercase">{PACKAGES[view as string].subtitle}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {PACKAGES[view as string].missions.map((pkg, idx) => (
                                    <div key={idx} className="bg-panel border border-slate-800 hover:border-gold transition-all group relative overflow-hidden flex flex-col">
                                        <div className="h-48 relative overflow-hidden bg-slate-900">
                                            {pkg.media?.[0]?.src && (
                                                <img src={pkg.media[0].src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-75 group-hover:brightness-100 grayscale group-hover:grayscale-0" alt={pkg.codename} />
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 text-[9px] font-code text-white border border-slate-600">INTEL LVL {pkg.intelLevel}</div>
                                        </div>
                                        
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-hud text-xl text-white font-bold tracking-tight">{pkg.codename}</h3>
                                                <span className={`text-[9px] px-1 font-bold border ${pkg.threat === 'Extreme' ? 'border-crimson text-crimson' : 'border-cyan text-cyan'}`}>{pkg.threat}</span>
                                            </div>
                                            
                                            <div className="font-code text-2xl text-gold font-bold mb-4">{pkg.price}</div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mb-4 bg-black/30 p-2">
                                                <div><div className="text-[8px] text-slate-500">VFM</div><div className="text-green-400 text-sm font-bold">{pkg.vfm}</div></div>
                                                <div><div className="text-[8px] text-slate-500">OPS TIME</div><div className="text-white text-sm font-bold">{pkg.duration}</div></div>
                                            </div>

                                            <p className="text-base font-semibold text-slate-300 font-body mb-4 leading-relaxed line-clamp-3">{pkg.brief}</p>
                                            
                                            <div className="mt-auto space-y-2 pt-4 border-t border-dashed border-slate-800">
                                                {pkg.inclusions.slice(0, 2).map((inc, i) => (
                                                    <div key={i} className="flex gap-2 text-[11px] text-slate-300 font-body font-medium"><span className="text-cyan">»</span>{inc}</div>
                                                ))}
                                                {pkg.lockedInclusions.map((inc, i) => (
                                                    <div 
                                                        key={'l'+i} 
                                                        onClick={() => userProfile.rank === 'RECRUIT' && handleUnlock(pkg)}
                                                        className={`flex gap-2 text-[11px] font-body font-medium relative overflow-hidden items-center ${userProfile.rank === 'RECRUIT' ? 'cursor-pointer group/lock' : ''}`}
                                                    >
                                                        <span className={userProfile.rank !== 'RECRUIT' ? 'text-green-400' : 'text-crimson'}>{userProfile.rank !== 'RECRUIT' ? '🔓' : '🔒'}</span>
                                                        {userProfile.rank !== 'RECRUIT' ? <span className="text-green-400">{inc}</span> : (
                                                            <span className="text-slate-400 group-hover/lock:text-crimson transition-colors decoration-slice line-through decoration-crimson/50">{inc.replace(/[aeiou]/g, '*')} [ENCRYPTED]</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button 
                                                onClick={() => handleUnlock(pkg)}
                                                className="w-full mt-4 py-3 bg-white/5 border border-white/10 text-slate-200 font-hud text-xs font-bold tracking-wider hover:bg-gold hover:text-black hover:border-gold transition-all"
                                            >
                                                {userProfile.rank !== 'RECRUIT' ? 'VIEW MISSION DOSSIER' : 'INITIATE BOOKING PROTOCOL'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <HandlerZero 
                mode={handlerMode} 
                context={lockedContext} 
                sector={SECTORS.includes(view as string) ? view as string : undefined}
                muted={muted}
                onGrant={handleGrant}
            />

            <IntelTerminal />
            
            {/* Dossier Modal */}
            {dossierMission && (
                <MissionDossier 
                    mission={dossierMission} 
                    userProfile={userProfile}
                    onClose={() => setDossierMission(null)} 
                    onBook={() => handleBookingRequest(dossierMission)}
                    isVerified={userProfile.rank !== 'RECRUIT'} 
                />
            )}
        </div>
    );
};

export default App;
