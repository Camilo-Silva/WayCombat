-- ============================================================
-- TABLA: galeria
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.galeria (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  categoria   TEXT NOT NULL CHECK (categoria IN ('entrenamientos', 'jornada-waycombat', 'eventos')),
  url         TEXT NOT NULL,
  storage_path TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_galeria_categoria ON public.galeria(categoria);
CREATE INDEX IF NOT EXISTS idx_galeria_activo    ON public.galeria(activo);

-- RLS: habilitar
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública (imágenes activas visibles para todos)
CREATE POLICY "galeria_public_read" ON public.galeria
  FOR SELECT USING (activo = TRUE);

-- Política: admins pueden hacer todo
CREATE POLICY "galeria_admin_all" ON public.galeria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- ============================================================
-- BUCKET DE STORAGE: galeria
-- Ejecutar en Supabase SQL Editor
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('galeria', 'galeria', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: lectura pública
CREATE POLICY "galeria_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'galeria');

-- Política: admins pueden subir archivos
CREATE POLICY "galeria_storage_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'galeria' AND
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Política: admins pueden eliminar archivos
CREATE POLICY "galeria_storage_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'galeria' AND
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );
