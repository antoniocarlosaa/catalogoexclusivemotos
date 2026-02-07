
import React, { useState } from 'react';
import { Vehicle, VehicleType } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onInterest: (vehicle: Vehicle) => void;
  onClick?: () => void;
  variant?: 'default' | 'promo' | 'featured' | 'hero';
  imageFit?: 'cover' | 'contain';
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onInterest, onClick, variant = 'default', imageFit = 'cover' }) => {
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
      className={`relative rounded-2xl overflow-hidden group transition-all duration-500 h-full bg-[#121212] border border-white/5 hover:border-gold/30 flex flex-col ${vehicle.isSold ? 'opacity-60 grayscale' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setIsHovered(false); setZoomStyle({ transformOrigin: 'center center', scale: '1' }); }}
    >
      {/* IMAGE SECTION - TOP */}
      <div
        className={`relative w-full aspect-[4/3] overflow-hidden bg-black/40 cursor-pointer overflow-hidden`}
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
            src={vehicle.imageUrl}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out`}
            style={{
              transformOrigin: zoomStyle.transformOrigin,
              transform: `scale(${zoomStyle.scale})`,
              willChange: 'transform',
              objectPosition: vehicle.imagePosition || '50% 50%'
            }}
            loading="lazy"
            alt={vehicle.name}
          />
        )}

        {/* TOP BADGES */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20 pointer-events-none">
          {vehicle.isFeatured && <span className="px-2 py-0.5 bg-gold text-black text-[8px] font-bold uppercase tracking-widest rounded shadow-lg">Destaque</span>}
          {(vehicle.isPromoSemana || vehicle.isPromoMes) && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-lg">Promo</span>}
          {vehicle.isZeroKm && <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-lg">0 KM</span>}
          {vehicle.isRepasse && <span className="px-2 py-0.5 bg-white text-black text-[8px] font-bold uppercase tracking-widest rounded shadow-lg">Repasse</span>}
        </div>

        {/* Sold Overlay */}
        {vehicle.isSold && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 pointer-events-none">
            <span className="px-4 py-1 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded bg-red-600/50 backdrop-blur-sm">Vendido</span>
          </div>
        )}
      </div>

      {/* CONTENT SECTION - BOTTOM */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Name & Title */}
        <div className="mb-2">
          <h3 className="text-sm font-heading text-white uppercase leading-tight line-clamp-2 h-10 flex items-center">
            {vehicle.name}
          </h3>
        </div>

        {/* Price */}
        <div className="mb-3">
          <p className="text-gold font-bold text-lg tracking-tight">
            {typeof vehicle.price === 'number' ? `R$ ${vehicle.price.toLocaleString('pt-BR')}` : vehicle.price}
          </p>
          <div className="w-8 h-0.5 bg-white/10 mt-2"></div>
        </div>

        {/* Specs: Year & KM */}
        <div className="flex items-center justify-between text-[10px] text-white/50 font-bold uppercase tracking-wider mb-4">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>{vehicle.year || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">speed</span>
            <span>{vehicle.km === undefined ? '-' : vehicle.km <= 0 ? '0 KM' : vehicle.km <= 10 ? 'Semi Nova' : `${vehicle.km.toLocaleString('pt-BR')} KM`}</span>
          </div>
        </div>

        {/* Action Buttons - Always Visible now */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onInterest(vehicle); }}
            className="py-2.5 bg-white/5 hover:bg-[#25D366] hover:text-white text-white/70 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-transparent"
          >
            WhatsApp
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
            className="py-2.5 bg-transparent hover:bg-white/10 text-white/50 hover:text-white rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/20"
          >
            Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
