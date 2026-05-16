import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import ImageLightbox from './ImageLightbox';
import VehicleCard from './VehicleCard'; // Reusing for related vehicles

interface VehicleDetailModalProps {
    vehicle: Vehicle;
    allVehicles?: Vehicle[];
    onClose: () => void;
    onInterest: (vehicle: Vehicle) => void;
}

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, allVehicles = [], onClose, onInterest }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    
    // Add to recently viewed on mount
    useEffect(() => {
        try {
            const viewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
            const newViewed = [vehicle.id, ...viewed.filter((id: string) => id !== vehicle.id)].slice(0, 10);
            localStorage.setItem('recently_viewed', JSON.stringify(newViewed));
        } catch (e) {
            console.error('Error saving recent views', e);
        }
    }, [vehicle.id]);

    const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.imageUrl];

    // Get related vehicles (same type, similar price, excluding current)
    const relatedVehicles = allVehicles
        .filter(v => v.id !== vehicle.id && v.type === vehicle.type && !v.isSold)
        .sort(() => 0.5 - Math.random()) // Randomize slightly for variety
        .slice(0, 3);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: vehicle.name,
                    text: `Olha esse veículo que encontrei na Exclusive: ${vehicle.name}`,
                    url: `${window.location.origin}/?v=${vehicle.id}`
                });
            } catch (err) {
                console.log('Share failed', err);
            }
        } else {
            // Fallback copy to clipboard
            navigator.clipboard.writeText(`${window.location.origin}/?v=${vehicle.id}`);
            alert('Link copiado para a área de transferência!');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-[#121212] w-full max-w-7xl max-h-[95vh] rounded-[2rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                <button
                    className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-gold hover:text-black transition-all border border-white/10"
                    onClick={onClose}
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Galeria - Esquerda */}
                <div className="lg:w-[55%] bg-black/80 relative flex flex-col h-[40vh] lg:h-auto">
                    {/* Imagem Principal */}
                    <div className="flex-1 relative overflow-hidden group">
                        <img
                            src={images[activeImageIndex]}
                            className="w-full h-full object-contain cursor-zoom-in transition-transform duration-700 ease-out group-hover:scale-105"
                            alt={vehicle.name}
                            onClick={() => setIsLightboxOpen(true)}
                        />

                        {/* Top Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>

                        {/* Triggers Overlay */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20 pointer-events-none">
                            <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 animate-pulse">
                                <span className="material-symbols-outlined text-gold text-sm">visibility</span>
                                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Veículo com alta procura</span>
                            </div>
                        </div>

                        {isLightboxOpen && (
                            <ImageLightbox
                                src={images[activeImageIndex]}
                                alt={vehicle.name}
                                onClose={() => setIsLightboxOpen(false)}
                            />
                        )}

                        {/* Navegação de Imagens */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-full hover:bg-gold hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-full hover:bg-gold hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <span className="material-symbols-outlined text-2xl">chevron_right</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="p-4 flex gap-3 overflow-x-auto bg-black/40 border-t border-white/5 custom-scrollbar pb-6">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIndex === idx ? 'border-gold shadow-[0_0_15px_rgba(255,107,0,0.4)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detalhes - Direita */}
                <div className="lg:w-[45%] flex flex-col bg-[#121212] relative h-[50vh] lg:h-auto overflow-hidden">
                    
                    {/* Header Details (Sticky) */}
                    <div className="p-8 lg:p-10 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            {vehicle.isFeatured && <span className="px-3 py-1 bg-gold text-black text-[9px] font-bold uppercase tracking-widest rounded-md">🔥 Destaque</span>}
                            {(vehicle.isPromoSemana || vehicle.isPromoMes) && <span className="px-3 py-1 bg-white/10 text-white border border-white/20 text-[9px] font-bold uppercase tracking-widest rounded-md">🚀 Alta procura</span>}
                            {vehicle.isZeroKm && <span className="px-3 py-1 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-md">✨ 0 KM</span>}
                        </div>

                        <h2 className="text-3xl lg:text-5xl font-heading text-white uppercase leading-none mb-3">{vehicle.name}</h2>

                        <div className="flex flex-col mt-6">
                            <span className="text-[10px] text-gold uppercase font-bold tracking-[0.2em] mb-1">Investimento</span>
                            <div className="text-4xl lg:text-5xl font-heading text-white tracking-tighter">
                                R$ {typeof vehicle.price === 'number' ? vehicle.price.toLocaleString('pt-BR') : vehicle.price}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button onClick={handleShare} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white/80 transition-all font-bold text-[10px] uppercase tracking-widest">
                                <span className="material-symbols-outlined text-lg">share</span> Compartilhar
                            </button>
                            <button onClick={() => setIsSaved(!isSaved)} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest ${isSaved ? 'bg-gold/20 border-gold text-gold' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'}`}>
                                <span className={isSaved ? "material-symbols-outlined text-lg" : "material-symbols-outlined text-lg"}>{isSaved ? 'bookmark_added' : 'bookmark_add'}</span>
                                {isSaved ? 'Salvo' : 'Salvar'}
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-10">
                        
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500">trending_up</span>
                            <div>
                                <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-1">Atenção</p>
                                <p className="text-white/80 text-sm">Mais pessoas visualizaram este veículo hoje. A disponibilidade pode mudar rápido.</p>
                            </div>
                        </div>

                        <h3 className="text-[11px] text-white/30 font-bold uppercase tracking-[0.2em] border-b border-white/5 pb-2 mb-6">Especificações Técnicas</h3>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="block text-[9px] text-gold uppercase font-bold tracking-widest mb-1">Ano / Modelo</span>
                                <span className="text-white text-xl font-medium">{vehicle.year || '-'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="block text-[9px] text-gold uppercase font-bold tracking-widest mb-1">Quilometragem</span>
                                <span className="text-white text-xl font-medium">{vehicle.km ? `${vehicle.km.toLocaleString('pt-BR')} KM` : '-'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="block text-[9px] text-gold uppercase font-bold tracking-widest mb-1">Combustível</span>
                                <span className="text-white text-xl font-medium">{vehicle.fuel || '-'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="block text-[9px] text-gold uppercase font-bold tracking-widest mb-1">Cor</span>
                                <span className="text-white text-xl font-medium">{vehicle.color || '-'}</span>
                            </div>
                        </div>

                        {/* Checklist Section */}
                        <div className="mb-8">
                            <h4 className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-4">Garantia & Procedência</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Único Dono', value: vehicle.isSingleOwner, icon: 'person' },
                                    { label: 'DUT na Mão', value: vehicle.hasDut, icon: 'description' },
                                    { label: 'Manual Original', value: vehicle.hasManual, icon: 'menu_book' },
                                    { label: 'Chave Reserva', value: vehicle.hasSpareKey, icon: 'vpn_key' },
                                    { label: 'Revisado', value: vehicle.hasRevisoes, icon: 'build_circle' },
                                ].map((item) => (
                                    <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.value ? 'bg-white/5 border-white/10 text-white' : 'bg-transparent border-transparent opacity-30 text-white/20'}`}>
                                        <span className={`material-symbols-outlined text-lg ${item.value ? 'text-gold' : ''}`}>{item.icon}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
                                        {item.value && <span className="ml-auto material-symbols-outlined text-sm text-green-500">check_circle</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {vehicle.specs && (
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
                                <span className="block text-[10px] text-gold uppercase font-bold tracking-widest mb-3">Detalhes Adicionais</span>
                                <p className="text-white/80 text-sm leading-relaxed font-light">{vehicle.specs ? vehicle.specs.split('|').filter(s => {
                                    const upper = s.trim().toUpperCase();
                                    return !upper.startsWith('COR:') && !upper.startsWith('ANO:') && !upper.startsWith('KM:') && !upper.startsWith('[KM') && !upper.startsWith('SEMI NOVA') && !upper.startsWith('ZERO KM');
                                }).join(' • ') : ''}</p>
                            </div>
                        )}

                        {/* Related Vehicles Section */}
                        {relatedVehicles.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-white/5">
                                <h4 className="text-[14px] text-white font-heading uppercase mb-6 flex items-center gap-2">
                                    Você também pode gostar
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {relatedVehicles.map(v => (
                                        <div key={v.id} className="h-[300px]">
                                            <VehicleCard vehicle={v} onInterest={onInterest} onClick={() => {
                                                // Could potentially route here or set selected vehicle, 
                                                // but since we are in a modal, closing it might be better, or we handle it in parent.
                                                // For now, we just pass onInterest which opens Whatsapp directly.
                                            }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Action (Sticky) */}
                    <div className="p-6 lg:p-8 border-t border-white/5 bg-[#121212] relative z-20">
                        <div className="flex items-center gap-2 justify-center mb-3 text-[10px] font-bold uppercase tracking-widest text-green-500">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Resposta média: menos de 2 minutos
                        </div>
                        <button
                            onClick={() => onInterest(vehicle)}
                            className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white active:scale-95 transition-all rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,211,102,0.3)] hover:shadow-[0_0_40px_rgba(37,211,102,0.5)] border border-green-400/30"
                        >
                            <span className="material-symbols-outlined text-2xl">chat</span>
                            <span className="text-lg font-heading uppercase tracking-wider">Chamar no WhatsApp</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VehicleDetailModal;
