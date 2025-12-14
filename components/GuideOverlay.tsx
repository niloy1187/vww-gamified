import React, { useState } from 'react';
import { HANDLER_AVATAR } from '../constants';
import { Mission } from '../types';
import { audio } from '../services/audio';

interface GuideOverlayProps {
  type: 'UNLOCK' | 'WELCOME';
  contextData?: Mission | null;
  onClose: () => void;
  onSubmit: () => void;
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({ type, contextData, onClose, onSubmit }) => {
    const [step, setStep] = useState<'BRIEF' | 'FORM' | 'SUCCESS'>('BRIEF');
    const [submitting, setSubmitting] = useState(false);

    const handleNext = () => {
        audio.playSFX('click');
        setStep('FORM');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        audio.playSFX('scan');
        
        // Simulate network delay
        setTimeout(() => {
            setSubmitting(false);
            setStep('SUCCESS');
            audio.playSFX('success');
            setTimeout(onSubmit, 1500);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-panel border-2 border-gold shadow-[0_0_50px_rgba(255,215,0,0.15)] flex flex-col md:flex-row overflow-hidden animate-fade-in relative">
                
                {/* CHARACTER PANEL */}
                <div className="w-full md:w-1/3 bg-black border-r border-gold/30 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-gold p-1 mb-4 relative">
                        <img src={HANDLER_AVATAR} alt="Handler Zero" className="w-full h-full rounded-full bg-void" />
                        <div className="absolute inset-0 rounded-full bg-gold/10 animate-pulse"></div>
                    </div>
                    <h3 className="font-hud text-gold text-lg tracking-widest text-center">HANDLER ZERO</h3>
                    <p className="font-code text-[9px] text-slate-500 uppercase tracking-widest text-center mt-1">TACTICAL LEAD</p>
                    
                    <div className="mt-6 w-full h-16 bg-void border border-slate-800 p-2 overflow-hidden relative">
                         <div className="absolute inset-0 opacity-10 bg-noise"></div>
                         <div className="font-code text-[8px] text-cyan animate-pulse leading-tight">
                             > UPLINK ESTABLISHED<br/>
                             > ENCRYPTING CHANNEL...<br/>
                             > {type === 'UNLOCK' ? `TARGET: ${contextData?.codename}` : 'INIT: BRIEFING_MODE'}
                         </div>
                    </div>
                </div>

                {/* INTERACTION PANEL */}
                <div className="w-full md:w-2/3 p-8 flex flex-col relative bg-gradient-to-br from-panel to-void">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-white font-code text-xs">[TERMINATE]</button>
                    
                    {step === 'BRIEF' && (
                        <div className="flex-1 flex flex-col justify-center animate-fade-in">
                            <h2 className="font-hud text-2xl text-white mb-4">
                                {type === 'UNLOCK' ? 'RESTRICTED INTEL DETECTED' : 'WELCOME, OPERATIVE.'}
                            </h2>
                            <p className="font-body text-lg text-slate-300 mb-6 leading-relaxed">
                                {type === 'UNLOCK' 
                                    ? `You're attempting to access Level-5 classified assets for Operation ${contextData?.codename}. I need to verify your clearance before releasing the locked inclusion data.`
                                    : "I am Handler Zero. I curate the most tactical, high-value travel operations on the grid. My intel is not for tourists. It is for those who seek the signal in the noise."
                                }
                            </p>
                            <button onClick={handleNext} className="self-start px-8 py-3 bg-gold text-black font-hud font-bold text-sm tracking-widest hover:bg-white transition-colors clip-corner shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                                {type === 'UNLOCK' ? 'REQUEST CLEARANCE' : 'ACKNOWLEDGE'}
                            </button>
                        </div>
                    )}

                    {step === 'FORM' && (
                        <div className="flex-1 flex flex-col justify-center animate-fade-in">
                            <h2 className="font-hud text-xl text-cyan mb-4">ESTABLISH SECURE UPLINK</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-code text-gold uppercase tracking-wider">Operative ID (Name)</label>
                                    <input type="text" className="w-full bg-void border-b border-slate-700 p-2 text-white font-code focus:border-cyan outline-none transition-colors" required autoFocus />
                                </div>
                                <div>
                                    <label className="text-[10px] font-code text-gold uppercase tracking-wider">Comms Channel (Email)</label>
                                    <input type="email" className="w-full bg-void border-b border-slate-700 p-2 text-white font-code focus:border-cyan outline-none transition-colors" required />
                                </div>
                                
                                <button type="submit" disabled={submitting} className="w-full mt-4 py-4 bg-cyan/10 border border-cyan text-cyan font-hud font-bold tracking-widest hover:bg-cyan hover:text-black transition-all flex items-center justify-center gap-2">
                                    {submitting ? (
                                        <>
                                            <span className="animate-spin text-xl">⟳</span> VERIFYING...
                                        </>
                                    ) : 'TRANSMIT CREDENTIALS'}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in">
                            <div className="w-16 h-16 border-2 border-green-500 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl text-green-500">✓</span>
                            </div>
                            <h2 className="font-hud text-2xl text-white mb-2">ACCESS GRANTED</h2>
                            <p className="font-code text-sm text-green-400">Decryption Key: [ ALPHA-7-ZERO ]</p>
                            <p className="text-slate-500 text-xs mt-4">Unlocking tactical assets...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};