import React, { useState, useRef, useEffect } from 'react';
import { audio } from '../services/audio';
import { getGeminiResponse, ChatMessage } from '../services/geminiService';

export const IntelTerminal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "TACTICAL INTEL ONLINE. Awaiting queries regarding sector conditions, weather, or local events." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const toggle = () => {
        audio.playSFX('click');
        setIsOpen(!isOpen);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);
        audio.playSFX('scan');

        const response = await getGeminiResponse(userMsg, messages);
        setMessages(prev => [...prev, response]);
        setLoading(false);
        audio.playSFX('success');
    };

    return (
        <>
            <button 
                onClick={toggle}
                className={`fixed bottom-32 md:bottom-8 right-6 md:right-32 z-50 p-4 border-2 transition-all duration-300 ${isOpen ? 'bg-gold border-gold text-black rotate-90' : 'bg-black/80 border-cyan text-cyan hover:bg-cyan/10'}`}
            >
                {isOpen ? '✕' : 'AI'}
            </button>

            {isOpen && (
                <div className="fixed bottom-32 md:bottom-24 right-4 md:right-32 w-[90vw] md:w-96 h-[50vh] max-h-[500px] bg-panel border border-cyan/50 shadow-[0_0_50px_rgba(0,240,255,0.15)] z-40 flex flex-col clip-corner backdrop-blur-xl">
                    <div className="p-3 bg-cyan/10 border-b border-cyan/30 flex justify-between items-center">
                        <span className="font-hud text-xs text-cyan tracking-widest">MISSION SUPPORT AI</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-cyan rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-cyan/50 rounded-full"></div>
                        </div>
                    </div>
                    
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-body text-sm font-medium custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-3 border ${m.role === 'user' ? 'border-gold/50 bg-gold/5 text-gold' : 'border-cyan/50 bg-cyan/5 text-cyan'}`}>
                                    {m.text}
                                </div>
                                {m.sources && (
                                    <div className="mt-1 flex flex-wrap gap-2 justify-end max-w-[85%]">
                                        {m.sources.map((s, idx) => (
                                            <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="text-[9px] font-code text-slate-400 hover:text-white underline truncate max-w-[150px]">
                                                [{idx + 1}] {s.title}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="text-cyan animate-pulse font-code text-xs">
                                > UPLINKING TO SATELLITE...
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-t border-cyan/30 bg-black/50">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="REQUEST INTEL..." 
                            className="w-full bg-transparent border-b border-slate-700 text-white font-body font-medium text-sm focus:border-cyan outline-none py-2 placeholder-slate-500 tracking-wide"
                            autoFocus
                        />
                    </form>
                </div>
            )}
        </>
    );
};