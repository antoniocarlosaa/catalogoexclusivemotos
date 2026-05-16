import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import HeroSearch from './components/HeroSearch';
import StockCarousel from './components/StockCarousel';
import StockGrid from './components/StockGrid';
import SearchBar from './components/SearchBar';
import { Vehicle, CategoryFilter, VehicleType, AppSettings } from './types';
import VehicleCard from './components/VehicleCard'; // Mantenha este estático pois é usado na Home
import { db } from './services/VehicleService';
import { supabase } from './services/supabase';
import { useAuth } from './contexts/AuthContext';
import { logger } from './services/LogService';
import { BRAND } from './src/config/brand'; // Relative path check

const VehicleDetailModal = React.lazy(() => import('./components/VehicleDetailModal')); // Global Modal
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const LoginModal = React.lazy(() => import('./components/LoginModal'));

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

  // Leads Popup State
  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', whatsapp: '' });

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('seen_lead_popup_v2');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowLeadPopup(true);
      }, 8000); // Exibir após 8 segundos
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(leadForm.name && leadForm.whatsapp) {
      localStorage.setItem('seen_lead_popup_v2', 'true');
      setShowLeadPopup(false);
      alert('Cadastro realizado com sucesso! Em breve você receberá nossas novidades.');
    }
  };

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

  // Social Proof & Retention
  const ultimasEntregas = useMemo(() => vehicles.filter(v => v.isSold).slice(0, 8), [vehicles]);

  const [recentViewIds, setRecentViewIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const viewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      setRecentViewIds(viewed);
    } catch(e) {}
  }, [selectedVehicle]); // Update when modal opens/closes

  const recentlyViewedVehicles = useMemo(() => {
    return recentViewIds.map(id => vehicles.find(v => v.id === id)).filter(Boolean) as Vehicle[];
  }, [recentViewIds, vehicles]);

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
          motosCount={motosEstoque.length}
          carrosCount={carrosEstoque.length}
          promocoesCount={promoSemana.length}
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
            vehicleCount={vehicles.filter(v => !v.isSold).length}
            visitCount={visitCount}
          />

          {/* UNIFIED SEARCH & FILTERS BLOCK */}
          <div className="-mt-16 relative z-20 mb-12 px-4 max-w-3xl mx-auto w-full">
            <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-6">
              <h2 className="text-xl md:text-2xl font-heading text-white tracking-wide">
                O que procura hoje?
              </h2>
              
              <div className="w-full">
                <SearchBar search={search} setSearch={setSearch} />
              </div>

              <div className="flex flex-wrap justify-center gap-3 w-full">
                <button
                  onClick={() => setFilter('TUDO')}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'TUDO' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/5'}`}
                >
                  Tudo
                </button>
                <button
                  onClick={() => setFilter('PROMOÇÕES')}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'PROMOÇÕES' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/5'}`}
                >
                  <span className="text-sm">🔥</span>
                  Promoções ({promoSemana.length})
                </button>
                <button
                  onClick={() => setFilter('MOTOS')}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'MOTOS' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/5'}`}
                >
                  <span className="text-sm">🏍️</span>
                  Motos ({motosEstoque.length})
                </button>
                <button
                  onClick={() => setFilter('CARROS')}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'CARROS' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/5'}`}
                >
                  <span className="text-sm">🚗</span>
                  Carros ({carrosEstoque.length})
                </button>
              </div>
            </div>
          </div>

          <div id="estoque-view" className="max-w-[1400px] mx-auto space-y-4 px-4 md:px-8">

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

            {/* CHAMADA MEIO DA NAVEGAÇÃO */}
            {(filter === 'TUDO') && (
              <div className="my-16 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 text-center flex flex-col items-center gap-6 max-w-4xl mx-auto shadow-2xl">
                <h3 className="text-2xl md:text-4xl font-heading text-white font-bold tracking-wide">
                    Não encontrou o <span className="text-gold">veículo ideal?</span>
                </h3>
                <p className="text-white/60 max-w-xl text-sm md:text-base">
                    Nós ajudamos a encontrar a melhor opção para você. Converse com um especialista agora e receba as melhores ofertas em primeira mão.
                </p>
                <button
                  onClick={() => {
                     const btn = document.querySelector('footer button') as HTMLButtonElement;
                     if(btn) btn.click();
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white font-bold uppercase tracking-widest rounded-xl hover:-translate-y-1 transition-all shadow-[0_4px_20px_rgba(37,211,102,0.3)] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">chat</span>
                  Conversar agora
                </button>
                <p className="text-white/40 text-[11px] uppercase tracking-widest font-bold mt-2">
                    🔥 Receba oportunidades antes de todo mundo
                </p>
              </div>
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

            {/* RETENÇÃO: Vistos Recentemente */}
            {(recentlyViewedVehicles.length > 0) && (filter === 'TUDO') && (
              <div className="pt-10">
                <div className="w-full h-px bg-white/5 mb-10"></div>
                <StockCarousel
                  title="Vistos Recentemente"
                  vehicles={recentlyViewedVehicles}
                  onInterest={handleInterest}
                  onViewDetails={handleViewDetails}
                  imageFit={settings.cardImageFit}
                />
              </div>
            )}

            {/* Smart Return Trigger (if user viewed multiple) */}
            {(recentlyViewedVehicles.length > 2) && (filter === 'TUDO') && (
              <div className="my-12 bg-gradient-to-r from-gold/10 via-transparent to-transparent border-l-4 border-gold p-8 rounded-r-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-heading text-white uppercase tracking-wider mb-2">Encontrou algo interessante?</h3>
                  <p className="text-white/60 text-sm">Nossos especialistas estão prontos para ajudar você a fechar o melhor negócio.</p>
                </div>
                <button
                  onClick={() => {
                     const btn = document.querySelector('footer button') as HTMLButtonElement;
                     if(btn) btn.click();
                  }}
                  className="px-8 py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gold-light hover:scale-105 transition-all shadow-lg whitespace-nowrap"
                >
                  Falar com especialista
                </button>
              </div>
            )}

            {/* PROVA SOCIAL: Últimas Entregas */}
            {(ultimasEntregas.length > 0) && (filter === 'TUDO') && (
              <div className="pt-10 mb-10">
                <div className="w-full h-px bg-white/5 mb-10"></div>
                <div className="flex flex-col items-center text-center mb-8">
                  <h3 className="text-2xl md:text-3xl font-heading text-white uppercase tracking-wider mb-2">
                    Sonhos <span className="text-gold">Realizados</span>
                  </h3>
                  <p className="text-white/50 text-sm">Nossas últimas entregas e clientes satisfeitos.</p>
                </div>
                {/* Horizontal Scroll Carousel - Lightweight Review Style */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-8 max-w-[1400px] mx-auto custom-scrollbar">
                  {ultimasEntregas.slice(0, 8).map((v) => (
                    <div key={v.id} className="min-w-[300px] w-[300px] snap-center bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-start gap-4 hover:bg-white/10 transition-colors flex-shrink-0">
                       <div className="flex items-center gap-4 w-full border-b border-white/5 pb-4">
                           <div className="relative">
                               <img src={v.imageUrl} className="w-16 h-16 rounded-full object-cover border-2 border-gold" alt={v.name} loading="lazy" />
                               <div className="absolute -bottom-1 -right-1 bg-[#25D366] w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center">
                                   <span className="material-symbols-outlined text-[12px] text-white">check</span>
                               </div>
                           </div>
                           <div className="flex flex-col items-start">
                               <div className="flex gap-0.5 text-gold text-sm">⭐⭐⭐⭐⭐</div>
                               <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest mt-1 w-32 truncate" title={v.name}>{v.name}</span>
                           </div>
                       </div>
                       <p className="text-white/80 text-sm italic font-medium leading-relaxed">
                           "Excelente atendimento e sem burocracia! Veículo entregue impecável. Recomendo muito a loja!"
                       </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* POR QUE ESCOLHER */}
          <div className="w-full bg-[#111] py-16 mt-12 border-t border-white/5">
             <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                <div className="text-center mb-10">
                   <h2 className="text-2xl md:text-3xl font-heading text-white font-bold tracking-wide">Por que escolher a <span className="text-gold">Exclusive?</span></h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 text-center">
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-2 shadow-lg hover:scale-110 transition-transform">⚡</div>
                      <h4 className="text-white font-bold text-[11px] md:text-sm tracking-widest uppercase">Estoque Atualizado</h4>
                      <p className="text-white/40 text-[9px] md:text-[10px] uppercase font-bold">Diariamente</p>
                   </div>
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-2 shadow-lg hover:scale-110 transition-transform">🤝</div>
                      <h4 className="text-white font-bold text-[11px] md:text-sm tracking-widest uppercase">Atendimento Rápido</h4>
                      <p className="text-white/40 text-[9px] md:text-[10px] uppercase font-bold">Sem burocracia</p>
                   </div>
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-2 shadow-lg hover:scale-110 transition-transform">🏍️</div>
                      <h4 className="text-white font-bold text-[11px] md:text-sm tracking-widest uppercase">Veículos Selecionados</h4>
                      <p className="text-white/40 text-[9px] md:text-[10px] uppercase font-bold">Alta qualidade</p>
                   </div>
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-2 shadow-lg hover:scale-110 transition-transform">📍</div>
                      <h4 className="text-white font-bold text-[11px] md:text-sm tracking-widest uppercase">Loja Física</h4>
                      <p className="text-white/40 text-[9px] md:text-[10px] uppercase font-bold">Visite-nos</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Validated Footer (Mobile & Desktop) */}
          <footer className="w-full py-12 text-center border-t border-white/5 bg-[#0a0a0a] mb-24 md:mb-0">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              
              {/* Brand & Social */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <h1 className="flex items-center gap-2 leading-none mb-2">
                  <span className="text-2xl font-heading font-bold italic text-white tracking-tighter shadow-lg">
                    <span className={BRAND.colors.highlight}>{BRAND.name.first.charAt(0)}</span>{BRAND.name.first.slice(1)} <span className={BRAND.colors.highlight}>{BRAND.name.second}</span>
                  </span>
                </h1>
                <p className="text-white/40 text-[11px] uppercase tracking-widest max-w-[200px] text-center md:text-left">Catálogo de veículos premium e selecionados.</p>
                <div className="flex gap-4 mt-2">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <button onClick={() => setShowWhatsappModal(true)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <h4 className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-2">Informações</h4>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="material-symbols-outlined text-gold text-lg">schedule</span>
                  Segunda a Sexta: 08:00 - 18:00<br/>Sábado: 08:00 - 12:00
                </div>
                <div className="flex items-start gap-2 text-white/80 text-sm mt-2 max-w-[250px] text-center md:text-left">
                  <span className="material-symbols-outlined text-gold text-lg">location_on</span>
                  Endereço da Loja, Número - Bairro, Cidade - Estado
                </div>
              </div>

              {/* Extras */}
              <div className="flex flex-col items-center md:items-end justify-center gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0">
                <div className="md:hidden flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest mb-4">
                  <span className="material-symbols-outlined text-xs">visibility</span>
                  <span>{visitCount.toLocaleString('pt-BR')} Visitas</span>
                </div>

                <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{BRAND.contact.copyright} {BRAND.contact.whatsapp} &copy; {new Date().getFullYear()}</span>

                <button onClick={handleAdminClick} className="text-[9px] text-white/10 hover:text-white/30 uppercase tracking-widest font-bold transition-colors">
                  Acesso Admin
                </button>
              </div>

            </div>
          </footer>
          
          {/* MOBILE FIXED BOTTOM BAR */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-between gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-safe">
             <button onClick={() => setFilter('PROMOÇÕES')} className="flex flex-col items-center justify-center gap-1 text-white/60 hover:text-white flex-1 py-1 transition-colors">
                <span className="text-xl leading-none">🔥</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Promoções</span>
             </button>
             <button onClick={() => window.open(`https://wa.me/55${BRAND.contact.whatsapp.replace(/\D/g,'')}`, '_blank')} className="flex flex-col items-center justify-center gap-1 text-white bg-gradient-to-r from-[#25D366] to-[#1DA851] flex-[1.5] py-2 rounded-xl shadow-[0_0_15px_rgba(37,211,102,0.3)] border border-[#25D366]/50 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[22px] leading-none">chat</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</span>
             </button>
             <button onClick={() => window.open(`tel:+55${BRAND.contact.whatsapp.replace(/\D/g,'')}`, '_self')} className="flex flex-col items-center justify-center gap-1 text-white/60 hover:text-white flex-1 py-1 transition-colors">
                <span className="material-symbols-outlined text-[22px] leading-none">call</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Ligar</span>
             </button>
          </div>

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
            allVehicles={vehicles}
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
        )}
      </Suspense>

      {/* LEADS POPUP */}
      {showLeadPopup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-[#121212] w-full max-w-md rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => {
              setShowLeadPopup(false);
              localStorage.setItem('seen_lead_popup_v2', 'true');
            }} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="p-8">
              <div className="w-12 h-12 bg-gold/20 text-gold rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-2xl">directions_car</span>
              </div>
              <h3 className="text-2xl font-heading text-white uppercase tracking-tight mb-2">Receba novidades do estoque</h3>
              <p className="text-white/60 text-sm mb-8">Entre para receber oportunidades e veículos recém-chegados antes de todo mundo.</p>
              
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <input type="text" placeholder="Seu nome" required value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none transition-colors" />
                </div>
                <div>
                  <input type="tel" placeholder="Seu WhatsApp" required value={leadForm.whatsapp} onChange={e => setLeadForm({...leadForm, whatsapp: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none transition-colors" />
                </div>
                <button type="submit" className="w-full py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gold-light transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)] mt-2">
                  Receber oportunidades
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

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
