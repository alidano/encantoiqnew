-- SCRIPT MÍNIMO - Solo columnas esenciales para PRODUCTS
-- Ejecutar en Supabase SQL Editor

-- Solo agregar lo que realmente necesitamos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS modified_on_bt timestamp with time zone;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY column_name;
