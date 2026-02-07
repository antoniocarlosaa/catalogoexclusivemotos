import React from 'react';
import { CategoryFilter } from '../types';
import { BRAND } from '../src/config/brand'; // Correction: Import added

interface SidebarProps {
    filter: CategoryFilter;
    setFilter: (filter: CategoryFilter) => void;
    onAdminClick: () => void;
    visitCount: number;
    isOpen: boolean;           // NEW: Control visibility on mobile
    onClose: () => void;       // NEW: Close sidebar on mobile
}

const Sidebar: React.FC<SidebarProps> = ({ filter, setFilter, onAdminClick, visitCount, isOpen, onClose }) => {
    const navItems: { label: string; icon: string; value: CategoryFilter }[] = [
        { label: 'Visão Geral', icon: 'dashboard', value: 'TUDO' },
        { label: 'Motos', icon: 'two_wheeler', value: 'MOTOS' },
        { label: 'Carros', icon: 'directions_car', value: 'CARROS' },
        { label: 'Promoções', icon: 'local_offer', value: 'PROMOÇÕES' },
    ];

    return (
        <>
            {/* MOBILE BACKDROP */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            {/* SIDEBAR CONTENT */}
            <aside className={`
                fixed inset-y-0 left-0 bg-[#050505] border-r border-white/10 z-[60]
                w-[280px] md:w-64 flex flex-col transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            `}>
                {/* Logo Area */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h1 className="flex flex-col">
                        <span className="text-2xl font-heading font-bold italic text-white tracking-tighter">
                            <span className={BRAND.colors.highlight}>{BRAND.name.first.charAt(0)}</span>{BRAND.name.first.slice(1)} <span className={BRAND.colors.highlight}>{BRAND.name.second}</span>
                        </span>
                        <span className="text-[10px] text-white/40 tracking-[0.2em] font-light uppercase">
                            {BRAND.version}
                        </span>
                    </h1>

                    {/* Close Button (Mobile Only) */}
                    <button onClick={onClose} className="md:hidden text-white/50 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-8 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.value}
                            onClick={() => {
                                setFilter(item.value);
                                onClose(); // Close on selection (mobile)
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${filter === item.value
                                ? 'bg-gold text-black shadow-lg shadow-gold/20'
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className={`material-symbols-outlined ${filter === item.value ? 'fill' : ''}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>

                            {filter === item.value && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 mt-auto border-t border-white/5 space-y-4">


                    {/* Admin Access Button */}
                    <button
                        onClick={() => { onAdminClick(); onClose(); }}
                        className="w-full mb-4 flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-gold/20 text-white/50 hover:text-gold rounded-xl transition-all group"
                        title="Acesso Administrativo"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">lock_person</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Área Restrita</span>
                    </button>

                    {/* Status / Copyright */}
                    <div className="px-2 pt-2">
                        <div className="flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span>
                            <span>Sistema Online</span>
                        </div>

                        <div className="flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            <span>{visitCount.toLocaleString('pt-BR')} Visitas</span>
                        </div>

                        <p className="mt-4 text-[9px] text-white/10 text-center uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} {BRAND.contact.copyright} {BRAND.contact.whatsapp}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
