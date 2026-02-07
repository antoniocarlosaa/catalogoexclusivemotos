import React from 'react';
import { CategoryFilter } from '../types';

interface BottomNavProps {
    filter: CategoryFilter;
    setFilter: (filter: CategoryFilter) => void;
    onAdminClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ filter, setFilter, onAdminClick }) => {
    const navItems: { label: string; icon: string; value: CategoryFilter }[] = [
        { label: 'Início', icon: 'home', value: 'TUDO' },
        { label: 'Motos', icon: 'two_wheeler', value: 'MOTOS' },
        { label: 'Carros', icon: 'directions_car', value: 'CARROS' },
        { label: 'Promos', icon: 'local_offer', value: 'PROMOÇÕES' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-50 px-6 safe-area-bottom">
            <div className="flex items-center justify-between h-full">
                {navItems.map((item) => {
                    const isActive = filter === item.value;
                    return (
                        <button
                            key={item.value}
                            onClick={() => setFilter(item.value)}
                            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-12 ${isActive ? 'text-gold -translate-y-2' : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-gold/10' : 'bg-transparent'}`}>
                                <span className={`material-symbols-outlined text-2xl ${isActive ? 'fill' : ''}`}>
                                    {item.icon}
                                </span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* Admin Button */}
                <button
                    onClick={onAdminClick}
                    className="flex flex-col items-center justify-center gap-1 transition-all duration-300 w-12 text-white/40 hover:text-white/60"
                >
                    <div className="p-1.5 rounded-full bg-transparent">
                        <span className="material-symbols-outlined text-2xl">
                            lock
                        </span>
                    </div>
                    {/* Ghost element to maintain alignment if needed, or hidden label */}
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
