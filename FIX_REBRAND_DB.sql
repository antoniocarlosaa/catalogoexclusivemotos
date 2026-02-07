-- SCRIPT DE CORREÇÃO E REBRANDING (EXCLUSIVE VEÍCULOS)
-- Este script corrige os erros de "policy already exists" e configura o novo bucket de imagens.

-- 1. GARANTIR QUE O BUCKET DE IMAGENS EXISTA
INSERT INTO storage.buckets (id, name, public)
VALUES ('exclusive-media', 'exclusive-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-media', 'vehicle-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. LIMPEZA TOTAL DE POLÍTICAS (Para evitar erros de duplicidade)
-- Removemos TODAS as políticas das tabelas para recriar as corretas.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover policies da tabela vehicles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'vehicles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON vehicles';
    END LOOP;

    -- Remover policies da tabela settings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'settings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON settings';
    END LOOP;
    
    -- Remover policies da tabela access_logs
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'access_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON access_logs';
    END LOOP;

    -- Remover policies da tabela audit_logs
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON audit_logs';
    END LOOP;
    
    -- Remover policies da tabela site_stats
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'site_stats') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON site_stats';
    END LOOP;

    -- Remover policies de storage antigos
    DROP POLICY IF EXISTS "Public Access Storage" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Storage" ON storage.objects;
    DROP POLICY IF EXISTS "Give me all access" ON storage.objects; -- Política comum antiga
END $$;

-- 3. RECRIAR AS POLÍTICAS (AGORA CORRETAS COM O NOVO NOME)

-- Veículos (Público lê, Admin altera)
CREATE POLICY "Public Read Vehicles" ON vehicles FOR SELECT TO public USING (true);
CREATE POLICY "Admin Insert Vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin Update Vehicles" ON vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin Delete Vehicles" ON vehicles FOR DELETE TO authenticated USING (true);

-- Configurações (Público lê, Admin altera)
CREATE POLICY "Public Read Settings" ON settings FOR SELECT TO public USING (true);
CREATE POLICY "Admin Update Settings" ON settings FOR UPDATE TO authenticated USING (true);

-- Logs (Público cria log de visita, Admin vê tudo)
CREATE POLICY "Public Log Insert" ON access_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin Log Select" ON access_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin Audit All" ON audit_logs FOR ALL TO authenticated USING (true);

-- Estatísticas (Público lê)
CREATE POLICY "Public Read Stats" ON site_stats FOR SELECT TO public USING (true);

-- Storage (Bucket 'exclusive-media')
-- Permitir leitura pública nos dois buckets (antigo e novo) para não quebrar imagens antigas
CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (bucket_id IN ('vehicle-media', 'exclusive-media', 'alfamotos-media'));

-- Permitir upload apenas para Admin e nos buckets permitidos
CREATE POLICY "Admin Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('vehicle-media', 'exclusive-media') AND auth.role() = 'authenticated');

CREATE POLICY "Admin Update Storage" ON storage.objects FOR UPDATE USING (bucket_id IN ('vehicle-media', 'exclusive-media') AND auth.role() = 'authenticated');
CREATE POLICY "Admin Delete Storage" ON storage.objects FOR DELETE USING (bucket_id IN ('vehicle-media', 'exclusive-media') AND auth.role() = 'authenticated');

SELECT 'CORREÇÃO CONCLUÍDA: Buckets e Permissões Atualizados!' as status;
