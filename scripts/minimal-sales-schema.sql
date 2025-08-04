-- SCRIPT MÍNIMO - Solo columnas esenciales para SALES  
-- Ejecutar en Supabase SQL Editor

-- Solo agregar lo que realmente necesitamos
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS modified_on_bt timestamp with time zone;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY column_name;
