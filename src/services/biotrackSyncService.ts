// src/services/biotrackSyncService.ts
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuración de BioTrack
const biotrackConfig = {
  host: process.env.BIOTRACK_HOST || '64.89.2.20',
  port: parseInt(process.env.BIOTRACK_PORT || '5432'),
  database: process.env.BIOTRACK_DATABASE || 'biotrackthc',
  user: process.env.BIOTRACK_USER || 'egro',
  password: process.env.BIOTRACK_PASSWORD || 'swfCi2i4R7NSuEe64TD40qYDuud',
  ssl: false, // Ajustar según configuración del servidor
};

export interface SyncResult {
  success: boolean;
  table: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors: string[];
  lastSyncTime: Date;
}

export interface SyncStats {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  errors: number;
  duration: number;
}

export class BioTrackSyncService {
  private biotrackClient: Client;
  private isConnected = false;

  constructor() {
    this.biotrackClient = new Client(biotrackConfig);
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.biotrackClient.connect();
        this.isConnected = true;
        console.log('✅ Conectado a BioTrack PostgreSQL');
      } catch (error) {
        console.error('❌ Error conectando a BioTrack:', error);
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.biotrackClient.end();
      this.isConnected = false;
      console.log('🔌 Desconectado de BioTrack');
    }
  }

  // ========================================
  // SINCRONIZACIÓN DE CUSTOMERS
  // ========================================
  async syncCustomers(fullSync = false): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      table: 'customers',
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: [],
      lastSyncTime: new Date(),
    };

    try {
      await this.connect();

      // Obtener fecha de última sincronización si no es full sync
      let lastSync = null;
      if (!fullSync) {
        const { data: lastSyncData } = await supabase
          .from('customers')
          .select('synced_at')
          .order('synced_at', { ascending: false })
          .limit(1);
        
        if (lastSyncData && lastSyncData.length > 0) {
          lastSync = lastSyncData[0].synced_at;
        }
      }

      // Query incremental o completo
      let query = `
        SELECT 
          customerid, lastname, firstname, middlename,
          birthmonth, birthday, birthyear,
          phone, fpassociated, stubid, address1, address2, 
          city, state, zip, ismember, email, cell,
          licensenum, licenseexpmonth, licenseexpyear,
          createdate, modified_on, deleted, location
        FROM customers
        WHERE deleted = 0
      `;

      if (lastSync && !fullSync) {
        query += ` AND (modified_on > '${lastSync}' OR createdate > EXTRACT(EPOCH FROM TIMESTAMP '${lastSync}'))`;
      }

      query += ` ORDER BY modified_on DESC LIMIT 1000`;

      console.log(`🔄 Sincronizando customers ${fullSync ? '(Full)' : '(Incremental)'}`);
      const biotrackData = await this.biotrackClient.query(query);
      
      result.recordsProcessed = biotrackData.rows.length;
      console.log(`📊 Procesando ${result.recordsProcessed} customers de BioTrack`);

      for (const row of biotrackData.rows) {
        try {
          // Transformar datos de BioTrack a formato Supabase
          const customerData = this.transformCustomerData(row);

          // Verificar si existe el customer
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('customerid, updated_at')
            .eq('customerid', customerData.customerid)
            .single();

          if (existingCustomer) {
            // Actualizar
            const { error: updateError } = await supabase
              .from('customers')
              .update({
                ...customerData,
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              })
              .eq('customerid', customerData.customerid);

            if (updateError) {
              result.errors.push(`Error actualizando customer ${customerData.customerid}: ${updateError.message}`);
            } else {
              result.recordsUpdated++;
            }
          } else {
            // Insertar nuevo
            const { error: insertError } = await supabase
              .from('customers')
              .insert({
                ...customerData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              });

            if (insertError) {
              result.errors.push(`Error insertando customer ${customerData.customerid}: ${insertError.message}`);
            } else {
              result.recordsInserted++;
            }
          }
        } catch (error) {
          result.errors.push(`Error procesando customer: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      const duration = Date.now() - startTime;
      console.log(`✅ Sincronización customers completada en ${duration}ms - Insertados: ${result.recordsInserted}, Actualizados: ${result.recordsUpdated}, Errores: ${result.errors.length}`);

    } catch (error) {
      result.errors.push(`Error general en sincronización: ${error.message}`);
      console.error('❌ Error en syncCustomers:', error);
    }

    return result;
  }

  // ========================================
  // SINCRONIZACIÓN DE PAYMENTS
  // ========================================
  async syncPayments(fullSync = false): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      table: 'payments',
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: [],
      lastSyncTime: new Date(),
    };

    try {
      await this.connect();

      let lastSync = null;
      if (!fullSync) {
        const { data: lastSyncData } = await supabase
          .from('payments')
          .select('synced_at')
          .order('synced_at', { ascending: false })
          .limit(1);
        
        if (lastSyncData && lastSyncData.length > 0) {
          lastSync = lastSyncData[0].synced_at;
        }
      }

      let query = `
        SELECT 
          id, ticketid, paymentmethod, paymentamount, amount,
          customerid, datetime, approvalcode, location,
          deleted, refunded, pointsused, modified_on
        FROM payments
        WHERE deleted = 0
      `;

      if (lastSync && !fullSync) {
        query += ` AND modified_on > '${lastSync}'`;
      }

      query += ` ORDER BY modified_on DESC LIMIT 2000`;

      console.log(`🔄 Sincronizando payments ${fullSync ? '(Full)' : '(Incremental)'}`);
      const biotrackData = await this.biotrackClient.query(query);
      
      result.recordsProcessed = biotrackData.rows.length;

      for (const row of biotrackData.rows) {
        try {
          const paymentData = this.transformPaymentData(row);

          const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('id', paymentData.id)
            .single();

          if (existingPayment) {
            const { error: updateError } = await supabase
              .from('payments')
              .update({
                ...paymentData,
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              })
              .eq('id', paymentData.id);

            if (updateError) {
              result.errors.push(`Error actualizando payment ${paymentData.id}: ${updateError.message}`);
            } else {
              result.recordsUpdated++;
            }
          } else {
            const { error: insertError } = await supabase
              .from('payments')
              .insert({
                ...paymentData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              });

            if (insertError) {
              result.errors.push(`Error insertando payment ${paymentData.id}: ${insertError.message}`);
            } else {
              result.recordsInserted++;
            }
          }
        } catch (error) {
          result.errors.push(`Error procesando payment: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      const duration = Date.now() - startTime;
      console.log(`✅ Sincronización payments completada en ${duration}ms`);

    } catch (error) {
      result.errors.push(`Error general: ${error.message}`);
    }

    return result;
  }

  // ========================================
  // SINCRONIZACIÓN DE PRODUCTS
  // ========================================
  async syncProducts(fullSync = false): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      table: 'products',
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: [],
      lastSyncTime: new Date(),
    };

    try {
      await this.connect();

      let query = `
        SELECT 
          id, name, taxcategory, productcategory, applymemberdiscount,
          strain, pricepoint, image, location, deleted, modified_on
        FROM products
        WHERE deleted = 0
        ORDER BY modified_on DESC LIMIT 1000
      `;

      const biotrackData = await this.biotrackClient.query(query);
      result.recordsProcessed = biotrackData.rows.length;

      for (const row of biotrackData.rows) {
        try {
          const productData = this.transformProductData(row);

          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('id', productData.id)
            .single();

          if (existingProduct) {
            const { error } = await supabase
              .from('products')
              .update({
                ...productData,
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              })
              .eq('id', productData.id);

            if (!error) result.recordsUpdated++;
          } else {
            const { error } = await supabase
              .from('products')
              .insert({
                ...productData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              });

            if (!error) result.recordsInserted++;
          }
        } catch (error) {
          result.errors.push(`Error procesando product: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Error general: ${error.message}`);
    }

    return result;
  }

  // ========================================
  // SINCRONIZACIÓN DE SALES
  // ========================================
  async syncSales(fullSync = false): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      table: 'sales',
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: [],
      lastSyncTime: new Date(),
    };

    try {
      await this.connect();

      let query = `
        SELECT 
          id, ticketid, strain, price, tax, total,
          weighheavy, manualweigh, pricepoint, customerid,
          productid, weight, datetime, location,
          deleted, refunded, modified_on
        FROM sales
        WHERE deleted = 0
        ORDER BY modified_on DESC LIMIT 2000
      `;

      const biotrackData = await this.biotrackClient.query(query);
      result.recordsProcessed = biotrackData.rows.length;

      for (const row of biotrackData.rows) {
        try {
          const saleData = this.transformSaleData(row);

          const { data: existingSale } = await supabase
            .from('sales')
            .select('id')
            .eq('id', saleData.id)
            .single();

          if (existingSale) {
            const { error } = await supabase
              .from('sales')
              .update({
                ...saleData,
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              })
              .eq('id', saleData.id);

            if (!error) result.recordsUpdated++;
          } else {
            const { error } = await supabase
              .from('sales')
              .insert({
                ...saleData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              });

            if (!error) result.recordsInserted++;
          }
        } catch (error) {
          result.errors.push(`Error procesando sale: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Error general: ${error.message}`);
    }

    return result;
  }

  // ========================================
  // SINCRONIZACIÓN COMPLETA
  // ========================================
  async syncAll(fullSync = false): Promise<{ results: SyncResult[]; summary: SyncStats }> {
    console.log(`🚀 Iniciando sincronización completa ${fullSync ? '(FULL)' : '(INCREMENTAL)'}`);
    const startTime = Date.now();

    const results: SyncResult[] = [];

    try {
      // Sincronizar en orden de dependencias
      results.push(await this.syncCustomers(fullSync));
      results.push(await this.syncProducts(fullSync));
      results.push(await this.syncPayments(fullSync));
      results.push(await this.syncSales(fullSync));

    } catch (error) {
      console.error('❌ Error en sincronización completa:', error);
    } finally {
      await this.disconnect();
    }

    // Calcular estadísticas de resumen
    const summary: SyncStats = {
      totalRecords: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
      newRecords: results.reduce((sum, r) => sum + r.recordsInserted, 0),
      updatedRecords: results.reduce((sum, r) => sum + r.recordsUpdated, 0),
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      duration: Date.now() - startTime,
    };

    console.log(`🎉 Sincronización completada en ${summary.duration}ms`);
    console.log(`📊 Resumen: ${summary.totalRecords} procesados, ${summary.newRecords} nuevos, ${summary.updatedRecords} actualizados, ${summary.errors} errores`);

    return { results, summary };
  }

  // ========================================
  // MÉTODOS DE TRANSFORMACIÓN
  // ========================================
  private transformCustomerData(row: any): any {
    return {
      customerid: row.customerid,
      lastname: row.lastname,
      firstname: row.firstname,
      middlename: row.middlename,
      birthmonth: row.birthmonth,
      birthday: row.birthday,
      birthyear: row.birthyear,
      phone: row.phone,
      fpassociated: row.fpassociated,
      stubid: row.stubid,
      address1: row.address1,
      address2: row.address2,
      city: row.city,
      state: row.state,
      zip: row.zip,
      ismember: row.ismember,
      email: row.email,
      cell: row.cell,
      licensenum: row.licensenum,
      licenseexpmonth: row.licenseexpmonth,
      licenseexpyear: row.licenseexpyear,
      createdate: row.createdate,
      modified_on_bt: row.modified_on,
      deleted: row.deleted,
      location: row.location,
    };
  }

  private transformPaymentData(row: any): any {
    return {
      id: row.id,
      ticketid: row.ticketid,
      paymentmethod: row.paymentmethod,
      paymentamount: row.paymentamount,
      amount: row.amount,
      customerid: row.customerid,
      datetime: row.datetime,
      approvalcode: row.approvalcode,
      location: row.location,
      deleted: row.deleted,
      refunded: row.refunded,
      pointsused: row.pointsused,
    };
  }

  private transformProductData(row: any): any {
    return {
      id: row.id,
      name: row.name,
      taxcategory: row.taxcategory,
      productcategory: row.productcategory,
      applymemberdiscount: row.applymemberdiscount,
      strain: row.strain,
      pricepoint: row.pricepoint?.toString(),
      image: row.image,
      location: row.location,
      modified_on_bt: row.modified_on, // ✅ Ahora sí existe la columna
      deleted: row.deleted,
    };
  }

  private transformSaleData(row: any): any {
    return {
      id: row.id,
      ticketid: row.ticketid,
      strain: row.strain,
      price: row.price,
      tax: row.tax,
      total: row.total,
      weighheavy: row.weighheavy,
      manualweigh: row.manualweigh,
      pricepoint: row.pricepoint,
      customerid: row.customerid,
      productid: row.productid,
      weight: row.weight,
      datetime: row.datetime,
      location: row.location,
      modified_on_bt: row.modified_on, // ✅ Ahora sí existe la columna
      deleted: row.deleted,
      refunded: row.refunded,
    };
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================
  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.biotrackClient.query('SELECT 1 as test');
      await this.disconnect();
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Test de conexión falló:', error);
      return false;
    }
  }

  async getTableCounts(): Promise<Record<string, number>> {
    try {
      await this.connect();
      
      const tables = ['customers', 'payments', 'products', 'sales'];
      const counts: Record<string, number> = {};

      for (const table of tables) {
        const result = await this.biotrackClient.query(`SELECT COUNT(*) as count FROM ${table} WHERE deleted = 0`);
        counts[table] = parseInt(result.rows[0].count);
      }

      return counts;
    } catch (error) {
      console.error('Error obteniendo conteos:', error);
      return {};
    } finally {
      await this.disconnect();
    }
  }
}

// Instancia singleton
export const biotrackSync = new BioTrackSyncService();
