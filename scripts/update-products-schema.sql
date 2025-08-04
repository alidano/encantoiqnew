-- SCRIPT COMPLETO PARA ACTUALIZAR TABLA PRODUCTS EN SUPABASE
-- Basado en el esquema completo de BioTrack

-- Agregar todas las columnas faltantes a la tabla products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ismedicated smallint DEFAULT 1,
ADD COLUMN IF NOT EXISTS requiresweighing smallint DEFAULT 1,
ADD COLUMN IF NOT EXISTS requiresinventory smallint DEFAULT 1,
ADD COLUMN IF NOT EXISTS externalbarcode text,
ADD COLUMN IF NOT EXISTS productdescription text,
ADD COLUMN IF NOT EXISTS qblistid text,
ADD COLUMN IF NOT EXISTS qbresponse text,
ADD COLUMN IF NOT EXISTS inventorytype smallint DEFAULT -1,
ADD COLUMN IF NOT EXISTS created timestamp without time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified timestamp without time zone,
ADD COLUMN IF NOT EXISTS defaultusable numeric,
ADD COLUMN IF NOT EXISTS defaultvendor bigint,
ADD COLUMN IF NOT EXISTS costperunit numeric,
ADD COLUMN IF NOT EXISTS sharedcategories text,
ADD COLUMN IF NOT EXISTS ismembersonly smallint,
ADD COLUMN IF NOT EXISTS kushit smallint,
ADD COLUMN IF NOT EXISTS prepack smallint,
ADD COLUMN IF NOT EXISTS mitsweighable smallint,
ADD COLUMN IF NOT EXISTS ndc text,
ADD COLUMN IF NOT EXISTS replication_val bigint,
ADD COLUMN IF NOT EXISTS days_supply text,
ADD COLUMN IF NOT EXISTS taxcategory_alternate smallint,
ADD COLUMN IF NOT EXISTS pricepoint_alternate text,
ADD COLUMN IF NOT EXISTS desiredamtavailable numeric,
ADD COLUMN IF NOT EXISTS desiredreorderpt numeric,
ADD COLUMN IF NOT EXISTS desiredreorderpt_ignore smallint,
ADD COLUMN IF NOT EXISTS manufacturer text,
ADD COLUMN IF NOT EXISTS producer text,
ADD COLUMN IF NOT EXISTS defaultprepackenabled smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS defaultprepackid integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS activation_time text,
ADD COLUMN IF NOT EXISTS activation_time_unit text,
ADD COLUMN IF NOT EXISTS suggested_use_amt text,
ADD COLUMN IF NOT EXISTS serving_size text,
ADD COLUMN IF NOT EXISTS servings_per_container text,
ADD COLUMN IF NOT EXISTS label_template_id integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS label_template_id_rec integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ics_product_group bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS label_template_id_custom integer,
ADD COLUMN IF NOT EXISTS label_template_id_inventory integer,
ADD COLUMN IF NOT EXISTS metrc_item_id bigint,
ADD COLUMN IF NOT EXISTS metrc_item_name text,
ADD COLUMN IF NOT EXISTS require_scan smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_original_size text,
ADD COLUMN IF NOT EXISTS ncs_api_id integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_prod_field1 text,
ADD COLUMN IF NOT EXISTS custom_prod_field2 text,
ADD COLUMN IF NOT EXISTS custom_prod_field3 text,
ADD COLUMN IF NOT EXISTS custom_prod_field4 text,
ADD COLUMN IF NOT EXISTS pres_medquantity numeric,
ADD COLUMN IF NOT EXISTS pres_medquantity_units text,
ADD COLUMN IF NOT EXISTS pres_frequency1 text,
ADD COLUMN IF NOT EXISTS pres_frequency2 text,
ADD COLUMN IF NOT EXISTS pres_tab text,
ADD COLUMN IF NOT EXISTS pres_everynum1 text,
ADD COLUMN IF NOT EXISTS pres_everynum2 text,
ADD COLUMN IF NOT EXISTS pres_everyqualifier text,
ADD COLUMN IF NOT EXISTS pres_days_supply integer,
ADD COLUMN IF NOT EXISTS nutrition text,
ADD COLUMN IF NOT EXISTS storage_instructions text,
ADD COLUMN IF NOT EXISTS bt_api_last_sync timestamp with time zone,
ADD COLUMN IF NOT EXISTS modified_on timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS id_serial bigint,
ADD COLUMN IF NOT EXISTS istaxoverrideexempt smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by character varying(255) DEFAULT current_user,
ADD COLUMN IF NOT EXISTS created_on timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified_by character varying(255) DEFAULT current_user;

-- Verificar que se agregaron correctamente
SELECT COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'products';

-- Ver las nuevas columnas
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY column_name;
