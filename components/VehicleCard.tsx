
import React, { useState } from 'react';
import { Vehicle, VehicleType } from '../types';

import { getOptimizedImageUrl } from '../src/utils/imageUtils';

interface VehicleCardProps {
  vehicle: Vehicle;
  onInterest: (vehicle: Vehicle) => void;
  onClick?: () => void;
  variant?: 'default' | 'promo' | 'featured' | 'hero';
  imageFit?: 'cover' | 'contain';
  priority?: boolean; // NEW: Priority loading for LCP
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onInterest, onClick, variant = 'default', imageFit = 'cover', priority = false }) => {
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', scale: '1' });
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Dynamic Styles based on Variant
  const isFeatured = variant === 'featured' || variant === 'promo';
  const aspectRatio = isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]';
  const cardPadding = isFeatured ? 'p-0' : 'p-3';

  // Mouse Move for Zoom Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (vehicle.videoUrl || vehicle.isSold || imageError) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, scale: '1.5' });
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden group transition-all duration-300 h-full bg-[#121212] border border-white/5 hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5 flex flex-col ${vehicle.isSold ? 'opacity-80' : ''}`}
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
            className={`w-full h-full object-cover transition-transform duration-700 ease-out`}
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

        {/* TOP BADGES */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20 pointer-events-none">
          {vehicle.isFeatured && <span className="px-2 py-0.5 bg-gold text-black text-[8px] font-bold uppercase tracking-widest rounded shadow-lg backdrop-blur-md">Destaque</span>}
          {(vehicle.isPromoSemana || vehicle.isPromoMes) && <span className="px-2 py-0.5 bg-red-600/90 text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-lg backdrop-blur-md">Promo</span>}
          {vehicle.isZeroKm && <span className="px-2 py-0.5 bg-blue-500/90 text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-lg backdrop-blur-md">0 KM</span>}
          {vehicle.isRepasse && <span className="px-2 py-0.5 bg-white/90 text-black text-[8px] font-bold uppercase tracking-widest rounded shadow-lg backdrop-blur-md">Repasse</span>}
        </div>

        {/* Sold Overlay */}
        {vehicle.isSold && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 pointer-events-none">
            <span className="px-4 py-1 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded bg-red-600/50 backdrop-blur-sm">Vendido</span>
          </div>
        )}
      </div>

      {/* CONTENT SECTION - BOTTOM */}
      <div className="flex-1 p-4 flex flex-col relative">
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* Name & Title */}
        <div className="mb-2 pt-2">
          <h3 className="text-sm font-heading text-white uppercase leading-tight line-clamp-2 h-10 flex items-center tracking-wide group-hover:text-gold transition-colors duration-300">
            {vehicle.name}
          </h3>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-gold font-bold text-lg tracking-tight drop-shadow-sm">
            {typeof vehicle.price === 'number' ? `R$ ${vehicle.price.toLocaleString('pt-BR')}` : vehicle.price}
          </p>
        </div>

        {/* Specs: Year & KM */}
        <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider mb-5 bg-white/5 rounded-lg px-2 py-1.5 border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>{vehicle.year || '-'}</span>
          </div>
          <div className="w-px h-3 bg-white/10"></div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">speed</span>
            <span>{vehicle.km === undefined ? '-' : vehicle.km <= 0 ? '0 KM' : vehicle.km <= 10 ? 'Semi Nova' : `${vehicle.km.toLocaleString('pt-BR')} KM`}</span>
          </div>
        </div>

        {/* Action Buttons - Redesigned */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onInterest(vehicle); }}
            className="group/btn relative overflow-hidden flex-1 py-2.5 px-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-lg hover:shadow-green-500/20 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Tailwind emerald-500 to emerald-600
              color: 'white'
            }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
            <span className="material-symbols-outlined text-[18px]">whatsapp</span>
            <span className="truncate">Tenho Interesse</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
            className="group/btn relative overflow-hidden w-10 flex-none rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center border border-white/10 hover:border-gold/50 hover:bg-gold/10 text-white/80 hover:text-gold active:scale-95"
            title="Ver Detalhes"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
