-- SALES - Columnas esenciales faltantes
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS weighheavy smallint,
ADD COLUMN IF NOT EXISTS manualweigh smallint,
ADD COLUMN IF NOT EXISTS inventoryid text,
ADD COLUMN IF NOT EXISTS terminalid bigint,
ADD COLUMN IF NOT EXISTS tax_collected numeric,
ADD COLUMN IF NOT EXISTS is_medical smallint,
ADD COLUMN IF NOT EXISTS modified_on timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified_on_bt timestamp with time zone;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('weighheavy', 'manualweigh', 'inventoryid', 'terminalid', 'tax_collected', 'is_medical', 'modified_on', 'modified_on_bt')
ORDER BY column_name;
