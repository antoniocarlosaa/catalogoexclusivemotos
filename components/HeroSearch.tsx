import React from 'react';

interface HeroSearchProps {
    backgroundImageUrl?: string;
    backgroundPosition?: string;
    vehicleCount?: number;
    visitCount?: number;
}

const HeroSearch: React.FC<HeroSearchProps> = ({ backgroundImageUrl, backgroundPosition, vehicleCount = 100, visitCount = 5000 }) => {
    return (
        <div className="relative w-full rounded-[2.5rem] overflow-hidden min-h-[650px] lg:h-[60vh] mb-8 group flex items-center justify-center border border-white/5 shadow-2xl">
            {/* Background Image - Cinematic Override */}
            <div className="absolute inset-0 bg-neutral-900 z-0 bg-[url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-[4000ms] group-hover:scale-105" />

            {/* Premium Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10" />

            {/* Content */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto h-full py-12">
                <span className="text-gold font-bold tracking-[0.3em] uppercase text-[10px] mb-6 drop-shadow-lg px-4 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">Exclusive Veículos</span>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6 leading-tight drop-shadow-2xl">
                    Sua próxima conquista <br />
                    está mais perto <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-[#FFD700]">do que imagina.</span>
                </h1>
                
                <p className="text-white/80 text-sm md:text-base font-medium mb-10 max-w-2xl mx-auto tracking-wide">
                    Veículos selecionados. Atendimento rápido. Negociação simples.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full sm:w-auto">
                    <button 
                        onClick={() => document.getElementById('estoque-view')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gold-light hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,107,0,0.4)] flex items-center justify-center gap-2"
                    >
                        Ver veículos
                    </button>
                    <button 
                        onClick={() => {
                            const btn = document.querySelector('footer button') as HTMLButtonElement;
                            if(btn) btn.click();
                        }}
                        className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">🟢</span>
                        Simular no WhatsApp
                    </button>
                </div>

                {/* Social Proof & Metrics - Glass Cards */}
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 w-full max-w-4xl mt-8">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl w-full md:w-1/3 hover:bg-white/10 transition-colors shadow-lg">
                        <span className="text-3xl drop-shadow-lg">👥</span>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-white font-bold text-base">
                                {60 + Math.floor((Date.now() - new Date('2026-05-15').getTime()) / (1000 * 60 * 60 * 24)) * 2}+
                            </span>
                            <span className="text-white/50 text-[9px] uppercase tracking-widest font-bold">Clientes atendidos</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl w-full md:w-1/3 hover:bg-white/10 transition-colors shadow-lg">
                        <span className="text-3xl drop-shadow-lg">🏍️</span>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-white font-bold text-base">{vehicleCount}</span>
                            <span className="text-white/50 text-[9px] uppercase tracking-widest font-bold">Veículos em estoque</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl w-full md:w-1/3 hover:bg-white/10 transition-colors shadow-lg">
                        <span className="text-3xl drop-shadow-lg">⚡</span>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-white font-bold text-base">Atendimento</span>
                            <span className="text-white/50 text-[9px] uppercase tracking-widest font-bold">Resposta em até 2 min</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSearch;
