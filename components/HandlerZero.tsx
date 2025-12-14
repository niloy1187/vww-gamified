
import React, { useState, useEffect, useRef } from 'react';
import { HANDLER_SCRIPT, HANDLER_CONFIG } from '../constants';
import { audio } from '../services/audio';
import { Mission } from '../types';

interface HandlerProps {
    mode: 'IDLE' | 'ACTIVE' | 'FORM';
    context?: Mission | null;
    sector?: string;
    muted: boolean;
    onGrant: () => void;
}

export const HandlerZero: React.FC<HandlerProps> = ({ mode, context, sector, muted, onGrant }) => {
    // Entrance State
    const [bootState, setBootState] = useState<'INIT' | 'EXPAND' | 'SHRINK' | 'DOCKED'>('INIT');
    
    // Logic State
    const [message, setMessage] = useState('');
    const [displayMessage, setDisplayMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [pupilSize, setPupilSize] = useState(1);
    const [glitchState, setGlitchState] = useState(false);
    
    // Tutorial State
    const [tutorialStep, setTutorialStep] = useState<number | null>(null);

    // Position State (Draggable & Responsive)
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 140 });
    const [targetPosition, setTargetPosition] = useState<{x: number, y: number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const [bubbleOrient, setBubbleOrient] = useState<'TOP' | 'BOTTOM'>('TOP');
    const [eyeRotation, setEyeRotation] = useState(0);

    // Behavior Tracking
    const mouseHistory = useRef<{x: number, y: number, t: number}[]>([]);
    const clickCount = useRef<number>(0);
    const clickTimer = useRef<number | null>(null);
    const lastInteraction = useRef(Date.now());
    const lastScrollY = useRef(0);
    const scrollVelocity = useRef(0);

    // Conversation State
    const [chatStep, setChatStep] = useState<'NONE' | 'NAME' | 'EMAIL' | 'PROCESSING' | 'DONE'>('NONE');
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Timers
    const idleTimer = useRef<number | null>(null);
    const typingInterval = useRef<number | null>(null);
    const proactiveTimer = useRef<number | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

    // --- RESPONSIVE HANDLER ---
    useEffect(() => {
        const handleResize = () => {
            const maxX = window.innerWidth - 80;
            const maxY = window.innerHeight - 80;
            
            setPosition(prev => ({
                x: Math.min(Math.max(20, prev.x), maxX),
                y: Math.min(Math.max(20, prev.y), maxY)
            }));
            
            // Adjust bubble orientation based on new Y
            if (position.y < window.innerHeight / 2) setBubbleOrient('BOTTOM');
            else setBubbleOrient('TOP');
        };

        window.addEventListener('resize', handleResize);
        // Initial setup for mobile
        if (window.innerWidth < 768 && bootState === 'INIT') {
             setPosition({ x: 20, y: 100 }); // Top-left on mobile initially
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [position.y, bootState]);

    // --- ROBUST VOICE LOADER ---
    const loadVoices = () => {
        if (!synthRef.current) return;
        const voices = synthRef.current.getVoices();
        
        // Priority 1: Specific Indian Female Voice Names
        const indianFemale = voices.find(v => 
            v.lang.includes('en-IN') && 
            (v.name.includes("Heera") || v.name.includes("Veena") || v.name.includes("Lekha") || v.name.includes("Rani") || v.name.includes("Neerja") || v.name.includes("Google"))
        );

        // Priority 2: Any Indian English
        const genericIndian = voices.find(v => v.lang === 'en-IN');

        // Priority 3: High Quality US Female
        const genericFemale = voices.find(v => 
            v.name.includes("Zira") || 
            v.name.includes("Samantha") ||
            v.name.includes("Google US English")
        );

        voiceRef.current = indianFemale || genericIndian || genericFemale || voices[0] || null;
    };

    useEffect(() => {
        loadVoices();
        if (synthRef.current) {
            synthRef.current.onvoiceschanged = loadVoices;
        }
    }, []);

    // --- SPEAK FUNCTION ---
    const speak = (text: string) => {
        if (muted || !synthRef.current) return;
        
        synthRef.current.cancel(); // Stop previous speech

        if (!voiceRef.current) loadVoices();

        const u = new SpeechSynthesisUtterance(text);
        u.volume = 1.0;
        u.rate = 1.15; 
        u.pitch = 1.05; 

        if (voiceRef.current) {
            u.voice = voiceRef.current;
            if (!voiceRef.current.lang.includes('en-IN')) {
                 u.pitch = 1.3; 
                 u.rate = 1.2;
            }
        }

        u.onstart = () => { setIsSpeaking(true); setPupilSize(1.5); };
        u.onend = () => { 
            setIsSpeaking(false); 
            setPupilSize(1);
            // Advance tutorial step if applicable
            if (tutorialStep !== null && tutorialStep < HANDLER_SCRIPT.tutorial.length - 1) {
                 setTutorialStep(prev => (prev !== null ? prev + 1 : null));
            } else if (tutorialStep === HANDLER_SCRIPT.tutorial.length - 1) {
                 setTutorialStep(null);
            }
        };
        u.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(u);
    };

    // --- BOOT SEQUENCE ---
    useEffect(() => {
        setTimeout(() => setBootState('EXPAND'), 500);
        
        setTimeout(() => {
            setBootState('SHRINK');
            audio.playSFX('scan');
        }, 3000); 
        
        setTimeout(() => {
            setBootState('DOCKED');
            // Check for mobile layout for initial dock position
            const initialY = window.innerWidth < 768 ? 100 : window.innerHeight - 140;
            const initialX = window.innerWidth < 768 ? 20 : 20;
            setPosition({ x: initialX, y: initialY });
            
            audio.playSFX('success');
            // Start Tutorial Loop
            setTutorialStep(0);
        }, 4000);
    }, []);

    // --- TUTORIAL SEQUENCER ---
    useEffect(() => {
        if (tutorialStep !== null && bootState === 'DOCKED' && tutorialStep < HANDLER_SCRIPT.tutorial.length) {
            const msg = HANDLER_SCRIPT.tutorial[tutorialStep];
            setMessage(msg);
            // Note: Advancement is now handled by the 'onend' event of speech synthesis
        }
    }, [tutorialStep, bootState]);

    // --- MESSAGE SPEAKER ---
    useEffect(() => {
        if (bootState === 'DOCKED' && !isMinimized && message) {
             speak(message);
        }
    }, [message, bootState, isMinimized]);

    // --- AUTO FOCUS INPUT ---
    useEffect(() => {
        if ((chatStep === 'NAME' || chatStep === 'EMAIL') && !isMinimized && bootState === 'DOCKED') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [chatStep, isMinimized, bootState]);

    // --- BEHAVIORAL ANALYSIS ---
    useEffect(() => {
        // Disable behaviors during tutorial
        if (tutorialStep !== null) return;

        const handleScroll = () => {
            const now = Date.now();
            lastInteraction.current = now;
            const currentY = window.scrollY;
            const delta = Math.abs(currentY - lastScrollY.current);
            scrollVelocity.current = delta;
            lastScrollY.current = currentY;

            if (delta > 50 && Math.random() > 0.98 && bootState === 'DOCKED' && !isMinimized && chatStep === 'NONE') {
                triggerBehavior('scrolling');
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            lastInteraction.current = now;

            if (bootState === 'DOCKED') {
                const eyeX = position.x + 40; 
                const eyeY = position.y + 40;
                const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX) * (180 / Math.PI);
                setEyeRotation(angle);
                
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.tagName === 'A') {
                     if (Math.random() > 0.995 && chatStep === 'NONE') {
                         triggerBehavior('hover');
                     }
                }
            }

            mouseHistory.current.push({ x: e.clientX, y: e.clientY, t: now });
            if (mouseHistory.current.length > 10) mouseHistory.current.shift();
            
            if (Math.random() > 0.99 && mouseHistory.current.length > 5) {
                const start = mouseHistory.current[0];
                const end = mouseHistory.current[mouseHistory.current.length - 1];
                const dist = Math.hypot(end.x - start.x, end.y - start.y);
                const timeDiff = end.t - start.t;
                const speed = dist / timeDiff; 

                if (speed > 3 && !isMinimized && chatStep === 'NONE') {
                    triggerBehavior('highVelocity');
                }
            }

            if (isDragging) {
                let newX = e.clientX - dragOffset.current.x;
                let newY = e.clientY - dragOffset.current.y;
                // Safer bounds
                newX = Math.max(0, Math.min(window.innerWidth - 80, newX));
                newY = Math.max(0, Math.min(window.innerHeight - 80, newY));
                setPosition({ x: newX, y: newY });
                if (newY < window.innerHeight / 2) setBubbleOrient('BOTTOM');
                else setBubbleOrient('TOP');
            }
        };

        const handleMouseUp = () => setIsDragging(false);

        const handleGlobalClick = (e: MouseEvent) => {
            const now = Date.now();
            lastInteraction.current = now;
            clickCount.current += 1;
            if (clickTimer.current) clearTimeout(clickTimer.current);
            clickTimer.current = window.setTimeout(() => { clickCount.current = 0; }, 800);

            if (clickCount.current > 5 && !isMinimized && chatStep === 'NONE' && tutorialStep === null) {
                triggerBehavior('rageClick');
                clickCount.current = 0;
            }

            if (bootState !== 'DOCKED' || isDragging) return;
            const dist = Math.hypot(e.clientX - (position.x + 40), e.clientY - (position.y + 40));
            if (dist < 120 && !isDragging) evadeThreat(e.clientX, e.clientY);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousedown', handleGlobalClick);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [isDragging, bootState, position, isMinimized, chatStep, tutorialStep]);

    // --- TOUCH SUPPORT ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (bootState !== 'DOCKED') return;
        const touch = e.touches[0];
        setIsDragging(true);
        setTargetPosition(null);
        dragOffset.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        let newX = touch.clientX - dragOffset.current.x;
        let newY = touch.clientY - dragOffset.current.y;
        
        newX = Math.max(0, Math.min(window.innerWidth - 80, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 80, newY));
        
        setPosition({ x: newX, y: newY });
        if (newY < window.innerHeight / 2) setBubbleOrient('BOTTOM');
        else setBubbleOrient('TOP');
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };


    const triggerBehavior = (type: 'rageClick' | 'highVelocity' | 'scrolling' | 'hover') => {
        if (bootState !== 'DOCKED') return;
        const msgs = HANDLER_SCRIPT[type];
        if (!msgs) return;
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        if (msg !== message) {
            setMessage(msg);
            setGlitchState(true);
            setTimeout(() => setGlitchState(false), 200);
            audio.playSFX('scan');
        }
    };

    const evadeThreat = (threatX: number, threatY: number) => {
        if (chatStep !== 'NONE') return;

        audio.playSFX('scan'); 
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        
        const safeZones = [
            { id: 'BL', x: 20, y: winH - 140 },
            { id: 'TL', x: 20, y: 100 }, // Good for mobile
            { id: 'TR', x: winW - 100, y: 100 }, 
            { id: 'BR', x: winW - 140, y: winH - 140 }
        ];
        let bestZone = safeZones[0];
        let maxDist = 0;
        safeZones.forEach(zone => {
            if (Math.hypot(zone.x - position.x, zone.y - position.y) < 100) return;
            
            const dist = Math.hypot(zone.x - threatX, zone.y - threatY);
            if (dist > maxDist) {
                maxDist = dist;
                bestZone = zone;
            }
        });
        setTargetPosition({ x: bestZone.x, y: bestZone.y });
        setPosition({ x: bestZone.x, y: bestZone.y }); 
        
        if (bestZone.y < winH / 2) setBubbleOrient('BOTTOM');
        else setBubbleOrient('TOP');
        
        const evasiveMsgs = ["Tactical displacement.", "Too close. Relocating.", "Personal space breached."];
        setMessage(evasiveMsgs[Math.floor(Math.random() * evasiveMsgs.length)]);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (bootState !== 'DOCKED') return;
        setIsDragging(true);
        setTargetPosition(null);
        dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    // --- TYPING ENGINE ---
    useEffect(() => {
        if (typingInterval.current) clearInterval(typingInterval.current);
        setDisplayMessage('');
        
        let charIndex = 0;
        typingInterval.current = window.setInterval(() => {
            if (charIndex < message.length) {
                setDisplayMessage(message.substring(0, charIndex + 1));
                charIndex++;
            } else {
                if (typingInterval.current) clearInterval(typingInterval.current);
            }
        }, 20);

        return () => {
            if (typingInterval.current) clearInterval(typingInterval.current);
        };
    }, [message, isMinimized, bootState]); 

    // --- IDLE & PROACTIVE LOGIC ---
    useEffect(() => {
        const checkIdle = () => {
            if (bootState !== 'DOCKED' || isDragging || chatStep !== 'NONE' || mode === 'ACTIVE' || tutorialStep !== null) return;
            
            const now = Date.now();
            if (now - lastInteraction.current > 12000 && !isMinimized) {
                let pool = HANDLER_SCRIPT.idle;
                if (sector) pool = [...pool, ...HANDLER_SCRIPT.idleContext.sector];
                else if (window.location.hash === '#ethos') pool = [...pool, ...HANDLER_SCRIPT.idleContext.ethos]; 
                else pool = [...pool, ...HANDLER_SCRIPT.idleContext.map];

                const msg = pool[Math.floor(Math.random() * pool.length)];
                if (msg !== message) {
                    setMessage(msg);
                    audio.playSFX('scan');
                }
                lastInteraction.current = now; 
            }
        };

        const triggerProactive = () => {
             if (bootState !== 'DOCKED' || isDragging || chatStep !== 'NONE' || mode === 'ACTIVE' || isMinimized || tutorialStep !== null) return;
             if (Math.random() > 0.7) {
                 setGlitchState(true);
                 setTimeout(() => setGlitchState(false), 300);
             }
             
             if (sector && HANDLER_SCRIPT.proactive[sector]) {
                 const tips = HANDLER_SCRIPT.proactive[sector];
                 const tip = tips[Math.floor(Math.random() * tips.length)];
                 setMessage(tip);
                 audio.playSFX('success'); 
             }
        };
        
        idleTimer.current = window.setInterval(checkIdle, 10000); 
        proactiveTimer.current = window.setInterval(triggerProactive, 35000); 

        return () => {
            if (idleTimer.current) clearInterval(idleTimer.current);
            if (proactiveTimer.current) clearInterval(proactiveTimer.current);
        };
    }, [mode, isMinimized, chatStep, bootState, sector, isDragging, message, tutorialStep]);

    // --- CONTEXT REACTION ---
    useEffect(() => {
        if (bootState !== 'DOCKED') return;

        if (mode === 'IDLE' && sector) {
            const script = HANDLER_SCRIPT.sectorIntro[sector] || "Sector data loaded.";
            setMessage(script);
            audio.playSFX('scan');
            setChatStep('NONE');
        } else if (mode === 'ACTIVE' && context) {
            const script = HANDLER_SCRIPT.restricted[Math.floor(Math.random() * HANDLER_SCRIPT.restricted.length)];
            setMessage(script);
            audio.playSFX('scan');
            setIsMinimized(false);
            setChatStep('NAME'); 
        }
    }, [mode, context, sector, bootState]);

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        
        audio.playSFX('click');
        
        if (chatStep === 'NAME') {
            const nextMsg = `Registered: ${inputValue}. ` + HANDLER_SCRIPT.formPrompts.askEmail;
            setMessage(nextMsg);
            setChatStep('EMAIL');
            setInputValue('');
        } else if (chatStep === 'EMAIL') {
            setMessage(HANDLER_SCRIPT.formPrompts.processing);
            setChatStep('PROCESSING');
            setInputValue('');
            audio.playSFX('scan');
            
            setTimeout(() => {
                const successMsg = HANDLER_SCRIPT.success[Math.floor(Math.random() * HANDLER_SCRIPT.success.length)];
                setMessage(successMsg);
                setChatStep('DONE');
                audio.playSFX('success');
                setTimeout(() => {
                    onGrant();
                    setChatStep('NONE');
                    setMessage("Standing by for tactical input.");
                }, 3000);
            }, 2500);
        }
    };

    if (bootState === 'INIT') return null;

    const style = bootState === 'DOCKED' ? { left: position.x, top: position.y } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    const containerClass = bootState === 'DOCKED' ? 'fixed z-[100] cursor-move transition-all duration-100 ease-out touch-none' : 'fixed z-[100] flex flex-col items-center justify-center pointer-events-none inset-0';
    const avatarSize = bootState === 'DOCKED' ? 'w-20 h-20' : 'w-64 h-64';
    const showChat = bootState === 'DOCKED' && !isMinimized;
    
    const eyeColorClass = glitchState ? 'bg-white shadow-[0_0_50px_#FFFFFF]' : (chatStep !== 'NONE' || isSpeaking ? 'bg-crimson shadow-[0_0_30px_#FF2A2A]' : 'bg-gold shadow-[0_0_20px_#FFD700]');

    return (
        <div 
            className={containerClass} 
            style={bootState === 'DOCKED' ? style : {}} 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            
            {/* SYSTEM TAKEOVER OVERLAY */}
            {bootState === 'EXPAND' && (
                <div className="absolute inset-0 bg-black z-[-1] animate-fade-in flex flex-col items-center justify-center pointer-events-auto">
                     <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
                     <div className="absolute inset-0 bg-noise opacity-20"></div>
                     <div className="w-full h-1 bg-gold absolute top-1/2 -translate-y-1/2 animate-scan"></div>
                </div>
            )}

            {/* CHAT BUBBLE */}
            {showChat && (
                <div 
                    className={`absolute ${bubbleOrient === 'TOP' ? 'bottom-24 rounded-bl-none' : 'top-24 rounded-tl-none'} left-0 bg-black/95 backdrop-blur-xl border border-gold/40 p-4 rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.1)] animate-fade-in w-72 md:w-80 flex flex-col gap-2 cursor-default`}
                    onMouseDown={(e) => e.stopPropagation()} 
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center border-b border-gold/20 pb-2 mb-1">
                        <span className="font-hud text-[9px] text-gold tracking-widest">{HANDLER_CONFIG.name} // {HANDLER_CONFIG.version}</span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse"></div>
                            <div className={`w-1.5 h-1.5 bg-gold/30 rounded-full ${isSpeaking ? 'bg-cyan animate-ping' : ''}`}></div>
                        </div>
                    </div>

                    <div className="min-h-[3em] relative">
                         <p className="font-body font-semibold text-lg text-slate-100 leading-relaxed whitespace-pre-wrap break-words tracking-wide">
                            <span className="text-gold font-bold mr-2">>></span>
                            {displayMessage}
                            <span className="inline-block w-2 h-4 bg-gold ml-1 animate-pulse align-middle"></span>
                        </p>
                    </div>

                    {(chatStep === 'NAME' || chatStep === 'EMAIL') && (
                        <form onSubmit={handleInputSubmit} className="mt-2 border-t border-dashed border-slate-700 pt-2 animate-fade-in-up">
                            <div className="flex items-center bg-black/50 border border-slate-600 focus-within:border-cyan px-2 py-1">
                                <span className="text-cyan font-code text-xs mr-2">$</span>
                                <input 
                                    ref={inputRef}
                                    type={chatStep === 'EMAIL' ? 'email' : 'text'}
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    placeholder={chatStep === 'NAME' ? "ENTER_HANDLE" : "ENTER_FREQUENCY"}
                                    className="bg-transparent border-none outline-none text-white font-body font-semibold text-sm w-full placeholder-slate-500"
                                    autoFocus
                                />
                                <button type="submit" className="text-cyan hover:text-white font-bold px-2">↵</button>
                            </div>
                        </form>
                    )}
                    
                    <button 
                        onClick={() => setIsMinimized(true)} 
                        className="absolute -top-3 -right-3 w-6 h-6 bg-black border border-slate-600 text-slate-400 hover:text-white hover:border-gold rounded-full flex items-center justify-center text-[10px]"
                    >
                        _
                    </button>
                </div>
            )}

            {/* AVATAR */}
            <div className={`relative ${avatarSize} group transition-all duration-300`}>
                {bootState === 'EXPAND' && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-center z-20">
                        <h2 className="font-hud text-3xl text-gold animate-pulse tracking-widest drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">SYSTEM OVERRIDE</h2>
                        <p className="font-code text-sm text-cyan mt-1">INITIALIZING NEURAL LINK...</p>
                    </div>
                )}
                
                {bootState === 'DOCKED' && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="text-[8px] font-code text-slate-500 uppercase tracking-widest bg-black px-1 border border-slate-800">:: DRAG ::</div>
                    </div>
                )}

                <div className={`absolute inset-0 rounded-full border-2 border-dashed border-gold/30 animate-spin-slow group-hover:border-gold/60 ${isSpeaking ? 'shadow-[0_0_40px_rgba(0,240,255,0.3)]' : ''}`}></div>
                <div className="absolute inset-[10%] rounded-full border border-cyan/40 animate-reverse-spin group-hover:border-cyan/80"></div>
                
                <div className="absolute inset-[20%] rounded-full bg-black border-2 border-gold shadow-[0_0_30px_#FFD700] overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-grid-pattern opacity-30 animate-scan"></div>
                    
                    <div 
                        className={`w-[20%] h-[20%] rounded-full transition-all duration-100 ease-out ${eyeColorClass}`}
                        style={{ 
                            transform: `rotate(${glitchState ? Math.random() * 360 : eyeRotation}deg) translateX(20px) scale(${pupilSize})` 
                        }}
                    >
                        <div className="absolute inset-0 bg-white/50 rounded-full animate-ping opacity-50"></div>
                    </div>
                    
                    <div className="absolute w-full h-0.5 bg-gold/20 rotate-45"></div>
                    <div className="absolute w-full h-0.5 bg-gold/20 -rotate-45"></div>
                </div>
            </div>
        </div>
    );
};
