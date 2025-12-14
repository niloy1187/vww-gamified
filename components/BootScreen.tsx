import React, { useState, useEffect } from 'react';
import { audio } from '../services/audio';

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
    const [clicked, setClicked] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleStart = () => {
        setClicked(true);
        audio.init();
        audio.playSFX('boot');
        
        // Boot Sequence
        let p = 0;
        const int = setInterval(() => {
            p += Math.random() * 8;
            if (p >= 100) {
                p = 100;
                clearInterval(int);
                audio.startBGM();
                setTimeout(onComplete, 800);
            }
            setProgress(p);
        }, 80);
    };

    if (clicked) {
        return (
            <div className="fixed inset-0 bg-void z-50 flex flex-col items-center justify-center p-8 select-none">
                 <h1 className="text-4xl md:text-6xl font-hud text-white glitch-text mb-4 text-center leading-tight" data-text="VALUE WANDERWEAVERS">
                     VALUE <span className="text-gold">WANDERWEAVERS</span>
                 </h1>
                 <div className="w-full max-w-md h-1 bg-gray-800 mt-8 relative overflow-hidden">
                     <div className="absolute top-0 left-0 h-full bg-gold shadow-[0_0_15px_#FFD700]" style={{ width: `${progress}%` }}></div>
                 </div>
                 <div className="font-code text-xs text-cyan mt-4 animate-pulse">
                     SYSTEM_BOOT::LOAD_ASSETS... {Math.round(progress)}%
                 </div>
                 <div className="mt-2 text-[10px] font-code text-slate-500">
                     OPTIMIZING VFM ALGORITHMS...
                 </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-void z-50 flex flex-col items-center justify-center select-none p-4">
            <div 
                onClick={handleStart}
                className="group relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center cursor-pointer"
            >
                 <div className="absolute inset-0 border-2 border-gray-800 rounded-full animate-ping opacity-20"></div>
                 <div className="absolute inset-4 border border-gold/50 rounded-full animate-spin-slow"></div>
                 <div className="absolute inset-0 border-4 border-gold rounded-full shadow-[0_0_30px_rgba(255,215,0,0.3)] group-hover:shadow-[0_0_60px_rgba(255,215,0,0.6)] transition-all bg-black/50 backdrop-blur-sm"></div>
                 
                 <div className="flex flex-col items-center z-10">
                    <h1 className="font-hud font-black text-3xl md:text-5xl text-white tracking-tighter group-hover:text-gold transition-colors">
                        START
                    </h1>
                    <span className="text-[10px] font-code text-cyan tracking-widest mt-2 group-hover:scale-110 transition-transform">INITIALIZE INTERFACE</span>
                 </div>
            </div>
            <div className="mt-12 text-center">
                <h2 className="font-hud text-lg md:text-2xl text-white tracking-widest mb-2">VALUE WANDERWEAVERS</h2>
                <p className="font-code text-xs text-gray-500 uppercase tracking-[0.2em]">An Exclusive Palate Pilgrim Offering</p>
            </div>
        </div>
    );
};