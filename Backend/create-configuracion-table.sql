-- ============================================================
-- TABLA: configuracion  (clave-valor para ajustes del sitio)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.configuracion (
  clave   TEXT PRIMARY KEY,
  valor   TEXT,
  activo  BOOLEAN DEFAULT TRUE
);

-- RLS
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el home la necesita sin auth)
CREATE POLICY "config_public_read" ON public.configuracion
  FOR SELECT USING (TRUE);

-- Solo admins pueden modificar
CREATE POLICY "config_admin_all" ON public.configuracion
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Datos iniciales del CTA
INSERT INTO public.configuracion (clave, valor, activo)
VALUES
  ('cta_certificacion_texto',    'PRÓXIMA FECHA DE CERTIFICACIÓN',  TRUE),
  ('cta_certificacion_sublabel', '— Click acá para más info.',      TRUE),
  ('cta_certificacion_activo',   'true',                            TRUE)
ON CONFLICT (clave) DO NOTHING;
