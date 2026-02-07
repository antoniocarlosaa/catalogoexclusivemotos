-- SCRIPT DE INSTALACAO COMPLETA
-- Copie e cole tudo no SQL Editor do Supabase e clique em RUN

-- 1. TABELAS PRINCIPAIS ----------------------------------------------------

CREATE TABLE IF NOT EXISTS vehicles (
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
  is_repasse BOOLEAN DEFAULT false,
  specs TEXT,
  km INTEGER,
  year TEXT,
  color TEXT,
  plate_last3 TEXT,
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
  image_position TEXT DEFAULT '50% 50%',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_numbers TEXT[],
  google_maps_url TEXT,
  background_image_url TEXT,
  background_position TEXT DEFAULT '50% 50%',
  card_image_fit TEXT DEFAULT 'cover',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settings (whatsapp_numbers, google_maps_url)
SELECT ARRAY[]::TEXT[], ''
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- 2. LOGS E ESTATISTICAS --------------------------------------------------

CREATE TABLE IF NOT EXISTS access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT,
  location TEXT,
  device_info TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  action_type TEXT,
  target TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_stats (
  id INT PRIMARY KEY DEFAULT 1,
  total_visits BIGINT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO site_stats (id, total_visits)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE site_stats
  SET total_visits = total_visits + 1,
      last_updated = NOW()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_visit_created ON access_logs;
CREATE TRIGGER on_visit_created
  AFTER INSERT ON access_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_visit_count();

-- 3. STORAGE ---------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-media', 'vehicle-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exclusive-media', 'exclusive-media', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SEGURANCA (RLS) -------------------------------------------------------

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Limpeza de regras antigas
DROP POLICY IF EXISTS "Public Read Vehicles" ON vehicles;
DROP POLICY IF EXISTS "Auth Insert Vehicles" ON vehicles;
DROP POLICY IF EXISTS "Auth Update Vehicles" ON vehicles;
DROP POLICY IF EXISTS "Auth Delete Vehicles" ON vehicles;
DROP POLICY IF EXISTS "Public Read Settings" ON settings;
DROP POLICY IF EXISTS "Auth Update Settings" ON settings;
DROP POLICY IF EXISTS "Public Log Insert" ON access_logs;
DROP POLICY IF EXISTS "Admin Log Select" ON access_logs;
DROP POLICY IF EXISTS "Admin Audit All" ON audit_logs;
DROP POLICY IF EXISTS "Public Read Stats" ON site_stats;
DROP POLICY IF EXISTS "Public Access Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Storage" ON storage.objects;

-- Regras Veiculos
CREATE POLICY "Public Read Vehicles" ON vehicles FOR SELECT TO public USING (true);
CREATE POLICY "Admin Insert Vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin Update Vehicles" ON vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin Delete Vehicles" ON vehicles FOR DELETE TO authenticated USING (true);

-- Regras Settings
CREATE POLICY "Public Read Settings" ON settings FOR SELECT TO public USING (true);
CREATE POLICY "Admin Update Settings" ON settings FOR UPDATE TO authenticated USING (true);

-- Regras Logs
CREATE POLICY "Public Log Insert" ON access_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin Log Select" ON access_logs FOR SELECT TO authenticated USING (true);

-- Regras Auditoria
CREATE POLICY "Admin Audit All" ON audit_logs FOR ALL TO authenticated USING (true);

-- Regras Stats
CREATE POLICY "Public Read Stats" ON site_stats FOR SELECT TO public USING (true);

-- Regras Storage
CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (bucket_id IN ('vehicle-media', 'exclusive-media'));
CREATE POLICY "Admin Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('vehicle-media', 'exclusive-media') AND auth.role() = 'authenticated');

SELECT 'INSTALACAO CONCLUIDA COM SUCESSO' as status;
