import React from 'react';
import { Mission } from '../types';

interface LeadModalProps {
  pkg: Mission | null;
  onClose: () => void;
  onSubmit: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({ pkg, onClose, onSubmit }) => {
    if (!pkg) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-panel border-2 border-cyan p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] animate-scan">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-hud text-xl text-white tracking-widest">CLEARANCE PROTOCOL</h2>
                    <div className="w-2 h-2 bg-cyan rounded-full animate-ping"></div>
                </div>
                
                <div className="mb-6 p-4 border border-dashed border-slate-700 bg-black/50 flex gap-4 items-center">
                     <div className="text-3xl text-slate-700 font-hud">?</div>
                     <div>
                         <div className="text-[9px] font-code text-gold">TARGET MISSION</div>
                         <div className="font-hud text-white">{pkg.codename}</div>
                     </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-code text-cyan">OPERATIVE ID</label>
                        <input type="text" placeholder="NAME" className="w-full bg-black border border-slate-700 p-3 text-white font-code text-xs focus:border-cyan outline-none transition-colors" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-code text-cyan">SECURE UPLINK</label>
                        <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-black border border-slate-700 p-3 text-white font-code text-xs focus:border-cyan outline-none transition-colors" required />
                    </div>
                    
                    <button type="submit" className="w-full py-4 mt-2 bg-cyan/10 border border-cyan text-cyan font-bold font-hud tracking-widest hover:bg-cyan hover:text-black shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all uppercase">
                        Grant Agent Clearance
                    </button>
                </form>
                
                <button onClick={onClose} className="w-full mt-4 text-[10px] text-slate-500 font-code hover:text-white uppercase tracking-wider">
                    [ Abort Mission ]
                </button>
            </div>
        </div>
    )
};