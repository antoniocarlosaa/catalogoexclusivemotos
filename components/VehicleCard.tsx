import React, { useState } from 'react';
import { Vehicle, VehicleType } from '../types';
import { getOptimizedImageUrl } from '../src/utils/imageUtils';

interface VehicleCardProps {
  vehicle: Vehicle;
  onInterest: (vehicle: Vehicle) => void;
  onClick?: () => void;
  variant?: 'default' | 'promo' | 'featured' | 'hero';
  imageFit?: 'cover' | 'contain';
  priority?: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onInterest, onClick, variant = 'default', imageFit = 'cover', priority = false }) => {
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', scale: '1' });
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Mouse Move for Zoom Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (vehicle.videoUrl || vehicle.isSold || imageError) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, scale: '1.4' });
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden group transition-all duration-500 h-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/5 hover:border-gold/40 hover:shadow-[0_15px_40px_-10px_rgba(255,107,0,0.4)] hover:-translate-y-[6px] flex flex-col ${vehicle.isSold ? 'opacity-80' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setIsHovered(false); setZoomStyle({ transformOrigin: 'center center', scale: '1' }); }}
    >
      {/* IMAGE SECTION - TOP */}
      <div
        className={`relative w-full aspect-[4/3] overflow-hidden bg-black/40 cursor-pointer overflow-hidden ${vehicle.isSold ? 'grayscale' : ''}`}
        onClick={onClick}
      >
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 bg-surface">
            <span className="material-symbols-outlined text-4xl">no_photography</span>
          </div>
        ) : vehicle.videoUrl ? (
          <video src={vehicle.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <img
            src={getOptimizedImageUrl(vehicle.imageUrl, 500)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110`}
            style={{
              transformOrigin: zoomStyle.transformOrigin,
              transform: `scale(${zoomStyle.scale})`,
              willChange: 'transform',
              objectPosition: vehicle.imagePosition || '50% 50%'
            }}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            // @ts-ignore
            fetchPriority={priority ? "high" : "auto"}
            alt={vehicle.name}
          />
        )}

        {/* Premium Gradient Overlay on Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>

        {/* TOP BADGES - Smart Tags */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-20 pointer-events-none">
          {vehicle.isFeatured && <span className="px-2.5 py-1 bg-gold/90 text-black text-[9px] font-bold uppercase tracking-widest rounded-md shadow-lg backdrop-blur-md flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">local_fire_department</span> Destaque</span>}
          {(vehicle.isPromoSemana || vehicle.isPromoMes) && <span className="px-2.5 py-1 bg-white/10 border border-white/20 text-white text-[9px] font-bold uppercase tracking-widest rounded-md shadow-lg backdrop-blur-md flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">rocket_launch</span> Alta Procura</span>}
          {vehicle.isZeroKm && <span className="px-2.5 py-1 bg-blue-500/90 text-white text-[9px] font-bold uppercase tracking-widest rounded-md shadow-lg backdrop-blur-md flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">new_releases</span> 0 KM</span>}
          {vehicle.isRepasse && <span className="px-2.5 py-1 bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-widest rounded-md shadow-lg backdrop-blur-md flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">bolt</span> Chegou Hoje</span>}
          {!vehicle.isFeatured && !vehicle.isPromoSemana && !vehicle.isPromoMes && !vehicle.isZeroKm && !vehicle.isRepasse && <span className="px-2.5 py-1 bg-black/40 border border-white/10 text-white/90 text-[9px] font-bold uppercase tracking-widest rounded-md shadow-lg backdrop-blur-md flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">diamond</span> Selecionado</span>}
        </div>

        {/* Sold Overlay */}
        {vehicle.isSold && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 pointer-events-none backdrop-blur-[2px]">
            <span className="px-6 py-2 border-2 border-white/20 text-white text-xs font-bold uppercase tracking-[0.3em] rounded-lg bg-red-600/50 backdrop-blur-md rotate-[-15deg] shadow-2xl">Vendido</span>
          </div>
        )}
      </div>

      {/* CONTENT SECTION - BOTTOM */}
      <div className="flex-1 p-5 flex flex-col relative z-20 bg-gradient-to-b from-transparent to-black/50">
        
        {/* Name & Title */}
        <div className="mb-1 pt-1">
          <h3 className="text-[15px] font-heading text-white uppercase leading-snug line-clamp-2 h-11 flex items-start tracking-wide group-hover:text-gold transition-colors duration-300">
            {vehicle.name}
          </h3>
        </div>

        {/* Price & Emotional Tag */}
        <div className="mb-5 flex flex-col items-start gap-1">
          <p className="text-gold font-bold text-xl tracking-tight drop-shadow-sm flex items-center gap-2">
            {typeof vehicle.price === 'number' ? `R$ ${vehicle.price.toLocaleString('pt-BR')}` : vehicle.price}
          </p>
          {!vehicle.isSold && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 shadow-[0_0_10px_rgba(255,107,0,0.1)]">
              {['⚡ Mais vistos hoje', '🔥 Procurada esta semana', '🚨 Pode sair do estoque'][ (vehicle.name.length + (Number(vehicle.price) || 0)) % 3 ]}
            </span>
          )}
        </div>

        {/* Specs: Year & KM */}
        <div className="flex items-center justify-between text-[10px] text-white/50 font-bold uppercase tracking-wider mb-6 bg-white/5 rounded-xl px-3 py-2 border border-white/5 backdrop-blur-sm shadow-inner group-hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-white/40">calendar_today</span>
            <span>{vehicle.year || '-'}</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-white/40">speed</span>
            <span>{vehicle.km === undefined ? '-' : vehicle.km <= 0 ? '0 KM' : vehicle.km <= 10 ? 'Semi Nova' : `${vehicle.km.toLocaleString('pt-BR')} KM`}</span>
          </div>
        </div>

        {/* Action Buttons - Stacked Vertical */}
        <div className="flex flex-col gap-3 mt-auto">
          {/* Details Button - Top */}
          <button
            onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
            className="w-full py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>Ver Detalhes</span>
          </button>

          {/* WhatsApp Button - Bottom (Primary) */}
          <button
            onClick={(e) => { e.stopPropagation(); onInterest(vehicle); }}
            className="w-full py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-[#111] text-white border border-gold/30 hover:bg-[#25D366] hover:border-[#25D366] hover:text-white shadow-lg hover:shadow-[0_4px_25px_rgba(37,211,102,0.4)] group/btn"
          >
            <span className="material-symbols-outlined text-[20px] text-[#25D366] group-hover/btn:text-white transition-colors duration-300">chat</span>
            <span className="truncate">Conversar agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
