# 🔄 Guía de Sincronización EncantoIQ

## 📋 Resumen de Cambios

### ✅ Problemas Solucionados:
1. **Products sync** - Ahora funciona correctamente
2. **Sales sync** - Implementado con filtro de 30 días
3. **API endpoints** - Completamente funcionales
4. **Scripts de testing** - Para debugging y monitoreo

### 🚀 Funcionalidades Nuevas:
- Sincronización de productos desde BioTrack
- Sincronización de ventas (últimos 30 días)
- Scripts de prueba y monitoreo
- Logs detallados para debugging

## 🛠️ Cómo Usar

### 1. Sincronización desde la Web UI
```
1. Ve a: http://localhost:3000/admin/sync
2. Selecciona las tablas: customers, products, sales
3. Elige tipo: Incremental o Completa
4. Clic en "Iniciar Sincronización"
```

### 2. Scripts de Prueba

#### Probar conexión y queries:
```bash
node scripts/test-connection.js
node scripts/test-products-sync.js
```

#### Probar API de sincronización:
```bash
# Test completo
node scripts/test-api-sync.js

# Solo productos
node scripts/test-api-sync.js products
```

#### Sincronización programática:
```bash
node scripts/sync-biotrack.js
```

## 📊 Qué Sincroniza Cada Tabla

### 🏥 **Locations**
- Todas las ubicaciones activas
- Info: nombre, dirección, teléfono

### 👥 **Customers** 
- Solo customers con licencias en ventana de 12 meses (6 pasados + 6 futuros)
- Optimizado para renovaciones y seguimiento
- Info: datos personales, licencia, contacto

### 🛒 **Products**
- Todos los productos activos
- Info: nombre, categoría, strain, precios, imagen

### 💰 **Sales** 
- Solo ventas de los últimos 30 días
- Evita sobrecargar con datos históricos
- Info: ticket, producto, customer, precios, fechas

## ⚠️ Sobre el Impacto en Terminales

**✅ SEGURO ejecutar en cualquier momento** porque:
- Solo **LEE** datos de BioTrack (no los modifica)
- Usa `LIMIT` para evitar sobrecargar la base
- Queries optimizadas y rápidas
- No afecta operaciones de venta

**No necesitas ejecutar de noche** - puedes hacerlo cuando quieras.

## 🔧 Configuración Avanzada

### Cambiar límites de sincronización:
En `src/app/api/sync/biotrack/route.ts`:
```typescript
// Cambiar límites por tipo
const limit = syncType === 'full' ? 2000 : 200;  // Incrementar si necesario
```

### Cambiar ventana de sales:
```typescript
// En syncSales() - cambiar de 30 a X días
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  // Cambiar aquí
```

### Cambiar ventana de customers:
```typescript
// En syncCustomers() - cambiar ventana de licencias
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);   // Cambiar aquí
sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);  // Y aquí
```

## 🐛 Debugging

### Ver logs en tiempo real:
```bash
# En desarrollo
npm run dev

# Los logs aparecen en la consola del servidor
```

### Verificar datos en Supabase:
```sql
-- Contar registros sincronizados
SELECT 
  'customers' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN synced_at IS NOT NULL THEN 1 END) as sincronizados
FROM customers
UNION ALL
SELECT 'products', COUNT(*), COUNT(CASE WHEN synced_at IS NOT NULL THEN 1 END) FROM products
UNION ALL  
SELECT 'sales', COUNT(*), COUNT(CASE WHEN synced_at IS NOT NULL THEN 1 END) FROM sales;
```

## 📅 Automatización (Opcional)

### Cron job para sincronización diaria:
```bash
# Agregar a crontab (crontab -e)
# Ejecutar cada día a las 6 AM
0 6 * * * cd /path/to/project && node scripts/sync-biotrack.js >> sync.log 2>&1
```

### Webhook para tiempo real:
Puedes crear un webhook en BioTrack que llame a tu API cuando hay cambios.

## 🎯 Próximos Pasos Recomendados

1. **Probar products sync** - Ejecutar desde la UI
2. **Probar sales sync** - Verificar que traiga datos recientes  
3. **Monitorear logs** - Ver que no haya errores
4. **Configurar alertas** - Email/Slack si falla sincronización
5. **Dashboard metrics** - Mostrar stats de sincronización

## 🆘 Troubleshooting

### "Products no funciona"
```bash
# 1. Probar query directa
node scripts/test-products-sync.js

# 2. Verificar logs de la API
# Buscar errores en consola del servidor

# 3. Verificar tabla en Supabase
# ¿Existe la tabla 'products'? ¿Tiene las columnas correctas?
```

### "Sales muy lento"
- Reducir ventana de días (de 30 a 7)
- Reducir LIMIT (de 2000 a 500)
- Ejecutar solo incremental

### "Errores de conexión"
```bash
# Probar conexión básica
node scripts/test-connection.js

# Verificar variables .env
echo $BIOTRACK_HOST $BIOTRACK_USER
```

---
**🎉 ¡Ahora tu sincronización debería funcionar perfectamente!**

Cualquier duda o error, revisa los logs o corre los scripts de testing.
