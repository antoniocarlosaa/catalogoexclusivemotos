const VehicleDetailModal = React.lazy(() => import('./components/VehicleDetailModal')); // Global Modal
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import HeroSearch from './components/HeroSearch';
import StockCarousel from './components/StockCarousel';
import StockGrid from './components/StockGrid';
import SearchBar from './components/SearchBar';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Vehicle, CategoryFilter, VehicleType, AppSettings } from './types';
import VehicleCard from './components/VehicleCard'; // Mantenha este estático pois é usado na Home
// HeroCard e ViewMoreCard não parecem ser usados no render principal ou são leves? 
// Verificando uso: ViewMoreCard não está sendo usado no App.tsx original? 
// Vou manter os imports que não são usados ?? O código original tinha imports não usados.
// Vou remover HeroCard e ViewMoreCard se não forem usados, ou mantê-los se forem.
// No código original: imports HeroCard, ViewMoreCard. Mas no JSX não vi onde são usados.
// Vou mantê-los comentados ou remover para limpar, mas a instrução é Lazy Loading.

// Lazy load Admin e Login para não pesar no check inicial
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const LoginModal = React.lazy(() => import('./components/LoginModal'));
import { db } from './services/VehicleService';
import { supabase } from './services/supabase';
import { useAuth } from './contexts/AuthContext';
import { logger } from './services/LogService';
import { BRAND } from './src/config/brand'; // Relative path check

const App: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null); // State Global do Modal
  const [settings, setSettings] = useState<AppSettings>({ whatsappNumbers: [], googleMapsUrl: '' });
  const [loading, setLoading] = useState(true);
  const [visitCount, setVisitCount] = useState(0);
  const [filter, setFilter] = useState<CategoryFilter>('TUDO');
  const [search, setSearch] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // WhatsApp Selector State
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappTarget, setWhatsappTarget] = useState<Vehicle | null>(null);

  // Registrar Visita (apenas uma vez na montagem)
  useEffect(() => {
    logger.logVisit();
  }, []);

  // Deep Linking: Check for ?v=ID param on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('v');
    if (vehicleId && vehicles.length > 0 && !selectedVehicle) {
      const found = vehicles.find(v => v.id === vehicleId);
      if (found) setSelectedVehicle(found);
    }
  }, [vehicles]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vData, sData, vCount] = await Promise.all([
          db.getAllVehicles(),
          db.getSettings(),
          logger.getVisitCount()
        ]);
        setVehicles(vData);
        setSettings(sData);
        setVisitCount(vCount);
      } catch (err) {
        console.error("Erro ao conectar ao banco:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // ⚡ REALTIME SUBSCRIPTION ⚡
    // Inscreve-se para ouvir mudanças nas tabelas 'vehicles' e 'settings'
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to ALL events (INSERT, UPDATE, DELETE)
          schema: 'public',
        },
        (payload) => {
          console.log('🔄 Mudança detectada no banco!', payload);
          // Recarrega os dados para manter tudo sincronizado
          loadData();
        }
      )
      .subscribe();

    // Limpeza ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // NEW: Sidebar Mobile State

  // Detectar scroll para mostrar botão "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'TUDO'
        || (filter === 'MOTOS' && v.type === VehicleType.MOTO)
        || (filter === 'CARROS' && v.type === VehicleType.CARRO)
        || (filter === 'PROMOÇÕES' && (v.isPromoSemana || v.isPromoMes));
      return matchesSearch && matchesFilter;
    });
  }, [vehicles, filter, search]);

  const destaques = useMemo(() => filteredVehicles.filter(v => v.isFeatured && !v.isSold), [filteredVehicles]);
  const promoSemana = useMemo(() => filteredVehicles.filter(v => v.isPromoSemana && !v.isSold && !v.isFeatured), [filteredVehicles]);
  // CORREÇÃO: Veículos continuam no estoque mesmo se forem destaque ou promo
  const motosEstoque = useMemo(() => filteredVehicles.filter(v => v.type === VehicleType.MOTO && !v.isSold), [filteredVehicles]);
  const carrosEstoque = useMemo(() => filteredVehicles.filter(v => v.type === VehicleType.CARRO && !v.isSold), [filteredVehicles]);

  const handleInterest = (vehicle: Vehicle) => {
    // Verificar se existem números ativos antes de abrir modal
    const activeExists = settings.whatsappNumbers.some(n => !n.startsWith('OFF:') && n.length > 5);

    if (!activeExists) {
      alert("Nenhum atendente disponível no momento. Tente mais tarde.");
      return;
    }

    setWhatsappTarget(vehicle);
    setShowWhatsappModal(true);
  };



  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const onUpload = async (nv: Vehicle) => {
    // Atualização imediata para feedback visual
    setVehicles(prev => [nv, ...prev]);

    // Persistir dados
    await db.saveVehicle(nv);

    // Sincronizar (o service agora garante merge de dados locais)
    const updatedVehicles = await db.getAllVehicles();
    setVehicles(updatedVehicles);
  };

  const onUpdate = async (id: string, up: Partial<Vehicle>) => {
    await db.updateVehicle(id, up);
    const updatedVehicles = await db.getAllVehicles();
    setVehicles(updatedVehicles);
  };

  const onDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este veículo?")) {
      const v = vehicles.find(x => x.id === id);
      await db.deleteVehicle(id);
      setVehicles(prev => prev.filter(x => x.id !== id));

      if (user?.email && v) {
        logger.logAction(user.email, 'EXCLUIR', v.name, 'Veículo excluído permanentemente');
      }
    }
  };

  const handleAdminClick = () => {
    console.log('🔍 Verificando autenticação...', { user: user ? 'Autenticado' : 'Não autenticado' });
    if (user) {
      console.log('✅ Usuário autenticado, abrindo painel ADM');
      setIsAdminOpen(true);
    } else {
      console.log('🔐 Usuário não autenticado, mostrando modal de login');
      setShowLoginModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans relative">
      {/* LAYOUT CONTAINER */}
      <div className="flex w-full min-h-screen">

        {/* SIDEBAR (Desktop & Mobile Overlay) */}
        <Sidebar
          filter={filter}
          setFilter={setFilter}
          onAdminClick={handleAdminClick}
          visitCount={visitCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full pb-24 md:pl-64 bg-[#050505]">

          {/* MOBILE TOP BAR (Logo + Hamburger) */}
          <div className="md:hidden w-full h-20 flex items-center justify-between px-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center -ml-2 text-white/50 hover:text-white"
            >
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>

            {/* Logo Center */}
            <div className="flex flex-col items-center">
              <h1 className="flex items-center gap-2 leading-none">
                <span className="text-2xl font-heading font-bold italic text-white tracking-tighter shadow-lg">
                  <span className={BRAND.colors.highlight}>{BRAND.name.first.charAt(0)}</span>{BRAND.name.first.slice(1)} <span className={BRAND.colors.highlight}>{BRAND.name.second}</span>
                </span>
              </h1>
              <span className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-bold mt-1">{BRAND.slogan}</span>
            </div>

            {/* Spacer to center logo properly */}
            <div className="w-8"></div>
          </div>

          {/* HERO SECTION WITH SEARCH */}
          <HeroSearch
            backgroundImageUrl={settings.backgroundImageUrl}
            backgroundPosition={settings.backgroundPosition}
          />

          <div className="-mt-10 relative z-20 mb-8 px-4 flex flex-col items-center gap-6">
            <SearchBar search={search} setSearch={setSearch} />

            <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Busque por</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFilter('MOTOS')}
                  className={`px-5 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'MOTOS' ? 'bg-gold text-black border-gold' : 'bg-black/50 text-white border-white/10 hover:border-gold/50 hover:text-gold backdrop-blur-sm'}`}
                >
                  Motos
                </button>
                <button
                  onClick={() => setFilter('CARROS')}
                  className={`px-5 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'CARROS' ? 'bg-gold text-black border-gold' : 'bg-black/50 text-white border-white/10 hover:border-gold/50 hover:text-gold backdrop-blur-sm'}`}
                >
                  Carros
                </button>
                <button
                  onClick={() => setFilter('PROMOÇÕES')}
                  className={`px-5 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'PROMOÇÕES' ? 'bg-gold text-black border-gold' : 'bg-black/50 text-gold border-gold/20 hover:border-gold/50 backdrop-blur-sm'}`}
                >
                  Promoções
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-[1400px] mx-auto space-y-4 px-4 md:px-8">

            {/* DESTAQUES CAROUSEL */}
            {(destaques.length > 0) && (filter === 'TUDO') && (
              <StockCarousel
                title="Destaques"
                vehicles={destaques}
                onInterest={handleInterest}
                onViewDetails={handleViewDetails}
                imageFit={settings.cardImageFit}
              />
            )}

            {/* PROMOÇÕES CAROUSEL */}
            {(promoSemana.length > 0) && (filter === 'TUDO' || filter === 'PROMOÇÕES') && (
              <StockCarousel
                title="🔥 Promoções da Semana"
                vehicles={promoSemana}
                onInterest={handleInterest}
                onViewDetails={handleViewDetails}
                imageFit={settings.cardImageFit}
              />
            )}

            {/* SEPARATOR */}
            {(motosEstoque.length > 0) && (
              <div className="w-full h-px bg-white/5 my-8"></div>
            )}

            {/* ÚLTIMOS LANÇAMENTOS (Carousel Mixed) */}
            {(filteredVehicles.length > 0) && (filter === 'TUDO' || filter === 'MOTOS' || filter === 'CARROS') && (
              <StockCarousel
                title="Últimos Lançamentos"
                vehicles={filteredVehicles.filter(v => !v.isSold).slice(0, 10)}
                onInterest={handleInterest}
                onViewDetails={handleViewDetails}
                imageFit={settings.cardImageFit}
              />
            )}

            {/* SEPARATOR */}
            {(motosEstoque.length > 0) && (
              <div className="w-full h-px bg-white/5 my-8"></div>
            )}

            {/* ESTOQUE DE MOTOS (Grid) */}
            {(motosEstoque.length > 0) && (filter === 'TUDO' || filter === 'MOTOS') && (
              <StockGrid
                title="Estoque de Motos"
                vehicles={motosEstoque}
                onInterest={handleInterest}
                onViewDetails={handleViewDetails}
                imageFit={settings.cardImageFit}
              />
            )}

            {/* SEPARATOR */}
            {(motosEstoque.length > 0) && (carrosEstoque.length > 0) && (
              <div className="w-full h-px bg-white/5 my-8"></div>
            )}

            {/* CARROS GRID */}
            {(carrosEstoque.length > 0) && (filter === 'TUDO' || filter === 'CARROS') && (
              <StockGrid
                title="Estoque de Carros"
                vehicles={carrosEstoque.slice(0, 12)}
                onInterest={handleInterest}
                onViewDetails={handleViewDetails}
                imageFit={settings.cardImageFit}
              />
            )}

          </div>

          {/* Desktop Footer (Simplified, mostly in Sidebar now) */}
          {/* Validated Footer (Mobile & Desktop) */}
          <footer className="w-full py-8 text-center border-t border-white/5 mt-16 mb-24 md:mb-0">
            <div className="flex flex-col items-center gap-3">

              {/* Counter only visible on mobile (Desktop has it in Sidebar) */}
              <div className="md:hidden flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-xs">visibility</span>
                <span>{visitCount.toLocaleString('pt-BR')} Visitas</span>
              </div>

              <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{BRAND.contact.copyright} {BRAND.contact.whatsapp} &copy; {new Date().getFullYear()}</span>

              <button onClick={handleAdminClick} className="text-[9px] text-white/10 hover:text-white/30 uppercase tracking-widest font-bold transition-colors">
                Acesso Admin
              </button>
            </div>
          </footer>

        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <BottomNav
        filter={filter}
        setFilter={setFilter}
        onAdminClick={handleAdminClick}
      />

      {/* MODALS */}
      {/* MODALS */}
      <Suspense fallback={<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div></div>}>
        {isAdminOpen && (
          <AdminPanel
            currentNumbers={settings.whatsappNumbers}
            currentMapsUrl={settings.googleMapsUrl}
            currentBackgroundImageUrl={settings.backgroundImageUrl}
            currentBackgroundPosition={settings.backgroundPosition}
            currentCardImageFit={settings.cardImageFit}
            vehicles={vehicles}
            onSaveSettings={async (newSettings) => {
              setSettings(newSettings);
              try {
                await db.saveSettings(newSettings);
              } catch (e) {
                console.error("Erro no App ao salvar:", e);
                throw e;
              }
            }}
            onSaveNumbers={() => { }}
            onSaveMapsUrl={() => { }}
            onSaveBackgroundImageUrl={() => { }}
            onSaveBackgroundPosition={() => { }}
            onSaveCardImageFit={() => { }}
            onUpdateVehicle={onUpdate}
            onDeleteVehicle={onDelete}
            onUpload={onUpload}
            onClose={() => setIsAdminOpen(false)}
          />
        )
        }

        {selectedVehicle && (
          <VehicleDetailModal
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
            onInterest={handleInterest}
          />
        )}

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => {
              setShowLoginModal(false);
              setIsAdminOpen(true);
            }}
          />
        )
        }
      </Suspense>

      {/* Button Scroll Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-6 right-6 z-[60] w-12 h-12 bg-gold text-black rounded-full shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center border border-white/20"
          aria-label="Voltar ao topo"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      )}

      {/* WHATSAPP SELECTOR MODAL */}
      {showWhatsappModal && whatsappTarget && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowWhatsappModal(false)}>
          <div className="w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-heading text-white uppercase tracking-wider">Escolha um Atendente</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Equipe {BRAND.name.full}</p>
              </div>
              <button onClick={() => setShowWhatsappModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {settings.whatsappNumbers.map((num, idx) => {
                if (num.startsWith('OFF:') || num.length < 8) return null;

                const cleanNum = num.replace(/\D/g, '').replace(/^0+/, '');
                // Confiança total no painel (já é Intl format)
                const finalNum = cleanNum;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const link = `${window.location.origin}?v=${whatsappTarget.id}`;
                      const message = encodeURIComponent(`Olá! Vi no catálogo o veículo: ${whatsappTarget.name}.\nAinda está disponível?\nLink: ${link}`);
                      window.open(`https://api.whatsapp.com/send?phone=${finalNum}&text=${message}`, '_blank');
                      setShowWhatsappModal(false);
                    }}
                    className="w-full p-4 bg-white/5 hover:bg-[#25D366] hover:text-white border border-white/5 hover:border-[#25D366] rounded-2xl flex items-center gap-4 group transition-all active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/20 group-hover:bg-white/20 flex items-center justify-center text-[#25D366] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined">support_agent</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] text-white/50 group-hover:text-white/80 uppercase font-bold tracking-widest">Disponível</span>
                      <span className="text-sm font-bold text-white uppercase tracking-wide">Atendente {idx + 1}</span>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-white/30 group-hover:text-white text-lg">chevron_right</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
