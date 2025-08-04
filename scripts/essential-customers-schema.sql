-- CUSTOMERS - Columnas esenciales faltantes
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS visits bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS amountspent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS points numeric,
ADD COLUMN IF NOT EXISTS discount numeric,
ADD COLUMN IF NOT EXISTS membersince bigint,
ADD COLUMN IF NOT EXISTS modified_on timestamp with time zone DEFAULT now();

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND column_name IN ('visits', 'amountspent', 'points', 'discount', 'membersince', 'modified_on')
ORDER BY column_name;
