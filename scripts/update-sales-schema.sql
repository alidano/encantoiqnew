-- SCRIPT COMPLETO PARA ACTUALIZAR TABLA SALES EN SUPABASE
-- Basado en el esquema completo de BioTrack

-- Agregar todas las columnas faltantes a la tabla sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS cumulativepricepoint text,
ADD COLUMN IF NOT EXISTS inventoryid text,
ADD COLUMN IF NOT EXISTS ismedicated smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS requiresweighing smallint DEFAULT 1,
ADD COLUMN IF NOT EXISTS refticketid character varying(16),
ADD COLUMN IF NOT EXISTS usableweight numeric,
ADD COLUMN IF NOT EXISTS restocked smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS heavyweight numeric,
ADD COLUMN IF NOT EXISTS taxcat integer,
ADD COLUMN IF NOT EXISTS grade bigint,
ADD COLUMN IF NOT EXISTS terminalid bigint,
ADD COLUMN IF NOT EXISTS returnsaleid bigint,
ADD COLUMN IF NOT EXISTS returntime bigint,
ADD COLUMN IF NOT EXISTS itemnumber integer,
ADD COLUMN IF NOT EXISTS price_post_discount numeric,
ADD COLUMN IF NOT EXISTS transactionid bigint,
ADD COLUMN IF NOT EXISTS transactionid_original bigint,
ADD COLUMN IF NOT EXISTS replication_val bigint,
ADD COLUMN IF NOT EXISTS terminaluid text,
ADD COLUMN IF NOT EXISTS dateofbirth text,
ADD COLUMN IF NOT EXISTS sale_type integer,
ADD COLUMN IF NOT EXISTS price_adjusted_for_ticket_discounts numeric,
ADD COLUMN IF NOT EXISTS tax_collected numeric,
ADD COLUMN IF NOT EXISTS price_post_everything numeric,
ADD COLUMN IF NOT EXISTS caregiver_patient text,
ADD COLUMN IF NOT EXISTS tax_excise numeric,
ADD COLUMN IF NOT EXISTS tax_breakdown_hist text,
ADD COLUMN IF NOT EXISTS tax_collected_excise numeric,
ADD COLUMN IF NOT EXISTS is_medical smallint,
ADD COLUMN IF NOT EXISTS sync_post_sale smallint DEFAULT 1,
ADD COLUMN IF NOT EXISTS custom_data text,
ADD COLUMN IF NOT EXISTS redcard text,
ADD COLUMN IF NOT EXISTS thirdparty_api_id text,
ADD COLUMN IF NOT EXISTS thirdparty_synced smallint,
ADD COLUMN IF NOT EXISTS package_weight numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_municipal_amt numeric,
ADD COLUMN IF NOT EXISTS tax_state_amt numeric,
ADD COLUMN IF NOT EXISTS oarrs_submitted smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS thirdparty_api_id2 text,
ADD COLUMN IF NOT EXISTS prescription_id bigint,
ADD COLUMN IF NOT EXISTS usableweightperunit text,
ADD COLUMN IF NOT EXISTS oarrs_submitted_file_name text,
ADD COLUMN IF NOT EXISTS uid text,
ADD COLUMN IF NOT EXISTS updated_on timestamp without time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS bt_api_last_sync timestamp with time zone,
ADD COLUMN IF NOT EXISTS modified timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified_on timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS id_serial bigint,
ADD COLUMN IF NOT EXISTS created_by character varying(255) DEFAULT current_user,
ADD COLUMN IF NOT EXISTS created_on timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified_by character varying(255) DEFAULT current_user;

-- Corregir tipos de columnas existentes si es necesario
ALTER TABLE public.sales 
ALTER COLUMN ticketid TYPE character(16),
ALTER COLUMN customerid TYPE character(10);

-- Verificar que se agregaron correctamente
SELECT COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'sales';

-- Ver todas las columnas
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY column_name;
