// Mapping completo de Products - todas las columnas de BioTrack
function transformCompleteProductData(row) {
  return {
    // Columnas básicas
    id: row.id,
    name: row.name,
    taxcategory: row.taxcategory,
    productcategory: row.productcategory,
    applymemberdiscount: row.applymemberdiscount,
    strain: row.strain,
    pricepoint: row.pricepoint?.toString(),
    image: row.image,
    location: row.location,
    
    // Columnas de configuración
    ismedicated: row.ismedicated,
    requiresweighing: row.requiresweighing,
    requiresinventory: row.requiresinventory,
    deleted: row.deleted,
    
    // Columnas de información adicional
    externalbarcode: row.externalbarcode,
    productdescription: row.productdescription,
    qblistid: row.qblistid,
    qbresponse: row.qbresponse,
    inventorytype: row.inventorytype,
    
    // Columnas de fechas
    created: row.created,
    modified: row.modified,
    modified_on_bt: row.modified_on,
    
    // Columnas de inventario
    defaultusable: row.defaultusable,
    defaultvendor: row.defaultvendor,
    costperunit: row.costperunit,
    sharedcategories: row.sharedcategories,
    
    // Configuraciones especiales
    ismembersonly: row.ismembersonly,
    kushit: row.kushit,
    prepack: row.prepack,
    mitsweighable: row.mitsweighable,
    ndc: row.ndc,
    replication_val: row.replication_val,
    
    // Configuraciones de prescripción
    days_supply: row.days_supply,
    taxcategory_alternate: row.taxcategory_alternate,
    pricepoint_alternate: row.pricepoint_alternate,
    
    // Configuraciones de inventario avanzadas
    desiredamtavailable: row.desiredamtavailable,
    desiredreorderpt: row.desiredreorderpt,
    desiredreorderpt_ignore: row.desiredreorderpt_ignore,
    manufacturer: row.manufacturer,
    producer: row.producer,
    
    // Configuraciones de prepack
    defaultprepackenabled: row.defaultprepackenabled,
    defaultprepackid: row.defaultprepackid,
    
    // Información médica
    activation_time: row.activation_time,
    activation_time_unit: row.activation_time_unit,
    suggested_use_amt: row.suggested_use_amt,
    serving_size: row.serving_size,
    servings_per_container: row.servings_per_container,
    
    // Templates y etiquetas
    label_template_id: row.label_template_id,
    label_template_id_rec: row.label_template_id_rec,
    ics_product_group: row.ics_product_group,
    label_template_id_custom: row.label_template_id_custom,
    label_template_id_inventory: row.label_template_id_inventory,
    
    // METRC integration
    metrc_item_id: row.metrc_item_id,
    metrc_item_name: row.metrc_item_name,
    require_scan: row.require_scan,
    
    // Campos adicionales
    image_original_size: row.image_original_size,
    ncs_api_id: row.ncs_api_id,
    
    // Campos personalizados
    custom_prod_field1: row.custom_prod_field1,
    custom_prod_field2: row.custom_prod_field2,
    custom_prod_field3: row.custom_prod_field3,
    custom_prod_field4: row.custom_prod_field4,
    
    // Campos de prescripción médica
    pres_medquantity: row.pres_medquantity,
    pres_medquantity_units: row.pres_medquantity_units,
    pres_frequency1: row.pres_frequency1,
    pres_frequency2: row.pres_frequency2,
    pres_tab: row.pres_tab,
    pres_everynum1: row.pres_everynum1,
    pres_everynum2: row.pres_everynum2,
    pres_everyqualifier: row.pres_everyqualifier,
    pres_days_supply: row.pres_days_supply,
    
    // Información nutricional y almacenamiento
    nutrition: row.nutrition,
    storage_instructions: row.storage_instructions,
    
    // Campos de sincronización y auditoría
    bt_api_last_sync: row.bt_api_last_sync,
    modified_on: row.modified_on,
    id_serial: row.id_serial,
    istaxoverrideexempt: row.istaxoverrideexempt,
    created_by: row.created_by,
    created_on: row.created_on,
    modified_by: row.modified_by,
    
    // Campos de timestamps de Supabase
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced_at: new Date().toISOString(),
  };
}

// Mapping completo de Sales - todas las columnas de BioTrack
function transformCompleteSaleData(row) {
  return {
    // Columnas básicas
    id: row.id,
    ticketid: row.ticketid,
    strain: row.strain,
    price: row.price,
    tax: row.tax,
    total: row.total,
    
    // Configuraciones de peso
    weighheavy: row.weighheavy,
    manualweigh: row.manualweigh,
    pricepoint: row.pricepoint,
    cumulativepricepoint: row.cumulativepricepoint,
    
    // Referencias
    location: row.location,
    productid: row.productid,
    customerid: row.customerid,
    weight: row.weight,
    datetime: row.datetime,
    
    // Inventario
    inventoryid: row.inventoryid,
    ismedicated: row.ismedicated,
    requiresweighing: row.requiresweighing,
    deleted: row.deleted,
    refunded: row.refunded,
    
    // Devoluciones
    refticketid: row.refticketid,
    usableweight: row.usableweight,
    restocked: row.restocked,
    heavyweight: row.heavyweight,
    
    // Impuestos y categorías
    taxcat: row.taxcat,
    grade: row.grade,
    terminalid: row.terminalid,
    
    // Devoluciones avanzadas
    returnsaleid: row.returnsaleid,
    returntime: row.returntime,
    itemnumber: row.itemnumber,
    price_post_discount: row.price_post_discount,
    
    // Transacciones
    transactionid: row.transactionid,
    transactionid_original: row.transactionid_original,
    replication_val: row.replication_val,
    terminaluid: row.terminaluid,
    dateofbirth: row.dateofbirth,
    sale_type: row.sale_type,
    
    // Precios y descuentos
    price_adjusted_for_ticket_discounts: row.price_adjusted_for_ticket_discounts,
    tax_collected: row.tax_collected,
    price_post_everything: row.price_post_everything,
    caregiver_patient: row.caregiver_patient,
    
    // Impuestos especiales
    tax_excise: row.tax_excise,
    tax_breakdown_hist: row.tax_breakdown_hist,
    tax_collected_excise: row.tax_collected_excise,
    is_medical: row.is_medical,
    
    // Sincronización
    sync_post_sale: row.sync_post_sale,
    custom_data: row.custom_data,
    redcard: row.redcard,
    
    // APIs de terceros
    thirdparty_api_id: row.thirdparty_api_id,
    thirdparty_synced: row.thirdparty_synced,
    package_weight: row.package_weight,
    
    // Impuestos municipales y estatales
    tax_municipal_amt: row.tax_municipal_amt,
    tax_state_amt: row.tax_state_amt,
    oarrs_submitted: row.oarrs_submitted,
    thirdparty_api_id2: row.thirdparty_api_id2,
    
    // Prescripciones
    prescription_id: row.prescription_id,
    usableweightperunit: row.usableweightperunit,
    oarrs_submitted_file_name: row.oarrs_submitted_file_name,
    uid: row.uid,
    
    // Timestamps
    updated_on: row.updated_on,
    bt_api_last_sync: row.bt_api_last_sync,
    modified: row.modified,
    modified_on: row.modified_on,
    modified_on_bt: row.modified_on,
    id_serial: row.id_serial,
    created_by: row.created_by,
    created_on: row.created_on,
    modified_by: row.modified_by,
    
    // Campos de timestamps de Supabase
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced_at: new Date().toISOString(),
  };
}

module.exports = {
  transformCompleteProductData,
  transformCompleteSaleData
};
