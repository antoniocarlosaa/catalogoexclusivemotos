-- COPIE TODO O CÓDIGO ABAIXO E COLE NO "SQL EDITOR" DO SUPABASE

-- 1. Cria Tabelas (Veículos e Configurações)
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC,
  price_text TEXT,
  type TEXT NOT NULL CHECK (type IN ('MOTOS', 'CARROS')),
  image_url TEXT,
  images TEXT[],
  video_url TEXT,
  videos TEXT[],
  is_sold BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_promo_semana BOOLEAN DEFAULT false,
  is_promo_mes BOOLEAN DEFAULT false,
  is_zero_km BOOLEAN DEFAULT false,
  specs TEXT,
  km INTEGER,
  year TEXT,
  color TEXT,
  category TEXT,
  displacement TEXT,
  transmission TEXT,
  fuel TEXT,
  motor TEXT,
  is_single_owner BOOLEAN DEFAULT false,
  has_dut BOOLEAN DEFAULT false,
  has_manual BOOLEAN DEFAULT false,
  has_spare_key BOOLEAN DEFAULT false,
  has_revisoes BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_numbers TEXT[],
  google_maps_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insere dados iniciais obrigatórios
INSERT INTO settings (whatsapp_numbers, google_maps_url) VALUES (ARRAY[]::TEXT[], '');

-- 3. Cria o "balde" para salvar as fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-media', 'vehicle-media', true);

-- 4. Habilita Segurança no Banco
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 5. Define as Regras de Acesso (Quem pode ver e editar)
-- Quem pode ver? TODOS
CREATE POLICY "Public Read Vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-media');

-- Quem pode editar? APENAS LOGADO
CREATE POLICY "Auth Insert Vehicles" ON vehicles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Vehicles" ON vehicles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Vehicles" ON vehicles FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-media' AND auth.role() = 'authenticated');
