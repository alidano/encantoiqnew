import { supabase } from '@/lib/supabase/client';
import type { Patient, Note, LicenseSubmission, EnhancedLicenseSubmission, SubmissionStats, MonthlyTrendItem, TypedSubmissionStats, MarketingSendLog, MonthlyLocationBreakdown, DashboardExpirationCardStats, ExpirationDataPoint, CriticalExpirationStats, TodayProcessingStats, DispensaryPerformance } from '@/types';
import { differenceInDays, parseISO, isValid, format, startOfMonth, endOfMonth, subMonths, getMonth, getYear, isWithinInterval, startOfToday, addMonths, addDays, subYears } from 'date-fns';

// MIGRATED: Helper function to transform a customer row to Patient type
function transformSupabaseRowToPatient(rowData: any): Patient | null {
  // Enhanced validation with detailed logging
  if (!rowData) {
    console.error('[patientService] Received null/undefined rowData');
    return null;
  }
  
  // Debug: Log raw data for license fields
  console.log(`[patientService] Raw license data for patient ${rowData.customerid}:`, {
    redcard: rowData.redcard,
    redcardyear: rowData.redcardyear,
    redcardmonth: rowData.redcardmonth,
    redcardday: rowData.redcardday,
    licensenum: rowData.licensenum,
    licenseexpyear: rowData.licenseexpyear,
    licenseexpmonth: rowData.licenseexpmonth
  });
  
  // Validate customerid exists
  if (!rowData.customerid) {
    console.error('[patientService] Missing customerid:', {
      original: rowData.customerid,
      type: typeof rowData.customerid
    });
    return null;
  }
  
  // Keep customerid as string to maintain consistency
  const customerId = rowData.customerid.toString();

  // CALCULATE license_exp_date from redcardyear and redcardmonth (licencia médica)
  let rawExpirationDate = '';
  let days_to_expiration = -9999; // Default for invalid/missing dates

  if (rowData.redcardyear && rowData.redcardmonth) {
    try {
      const year = parseInt(rowData.redcardyear.toString());
      const month = parseInt(rowData.redcardmonth.toString());
      const day = rowData.redcardday ? parseInt(rowData.redcardday.toString()) : null;
      
      if (year > 1900 && month >= 1 && month <= 12) {
        let expirationDate: Date;
        
        if (day && day >= 1 && day <= 31) {
          // Use specific day if available
          expirationDate = new Date(year, month - 1, day);
        } else {
          // Use last day of the month if no specific day
          expirationDate = new Date(year, month - 1, 1);
          expirationDate.setMonth(expirationDate.getMonth() + 1);
          expirationDate.setDate(expirationDate.getDate() - 1);
        }
        
        rawExpirationDate = format(expirationDate, 'yyyy-MM-dd');
        
        // Calculate days to expiration from current date to expiration date
        // This is the correct way - always calculate from TODAY to expiration date
        days_to_expiration = differenceInDays(expirationDate, startOfToday());
        
        console.log(`[patientService] License expiration calculation:`, {
          redcard: rowData.redcard,
          year, month, day,
          calculatedExpirationDate: rawExpirationDate,
          daysToExpiration: days_to_expiration,
          today: format(startOfToday(), 'yyyy-MM-dd'),
          willShowAsExpired: days_to_expiration <= 0
        });
      }
    } catch (error) {
      console.warn('[patientService] Error calculating medical license expiration date:', error);
    }
  }

  // Calculate birthdate and customer_since from customers table
  let birthDate = '';
  if (rowData.birthyear && rowData.birthmonth && rowData.birthday) {
    try {
      const year = parseInt(rowData.birthyear.toString());
      const month = parseInt(rowData.birthmonth.toString());
      const day = parseInt(rowData.birthday.toString());
      if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        birthDate = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
      }
    } catch (error) {
      console.warn('[patientService] Error calculating birth date:', error);
    }
  }

  const customerSinceDate = rowData.createdate || '';
  const memberStatus = rowData.ismember ? 'Member' : 'Non-Member';

  const patient: Patient = {
    id: customerId, // Use customerid as string for consistency
    days_to_expiration: days_to_expiration,
    lastname: (rowData.lastname || '').toString(),
    firstname: (rowData.firstname || '').toString(),
    middlename: rowData.middlename ? rowData.middlename.toString() : undefined,
    mmj_card: (rowData.redcard || '').toString(),
    mmj_card_expiration: rawExpirationDate,
    birthdate: birthDate,
    address1: (rowData.address1 || '').toString(),
    city: (rowData.city || '').toString(),
    state: (rowData.state || '').toString(),
    zip: (rowData.zip || '').toString(),
    member_status: memberStatus as 'Member' | 'Non-Member' | 'VIP',
    email: (rowData.email || '').toString(),
    cell: (rowData.cell || rowData.phone || '').toString(), // Use cell or phone
    emailoptin: true, // Default - customers table doesn't have this
    smsoptin: true, // Default - customers table doesn't have this
    drivers_license: undefined, // Not in customers table
    license_expiration: undefined, // Not in customers table
    dispensary_name: (rowData.locationName || `Location ${rowData.location}` || 'Unknown Location').toString(),
    customer_since: customerSinceDate,
    member_since: rowData.createdate ? rowData.createdate.toString() : undefined,
    number_of_visits: 0, // Default - not in customers table
    spent_to_date: 0, // Default - not in customers table
    last_communication_type: undefined,
    last_communication_date: undefined,
    renewal_status: undefined,
    license_photo_url: undefined,
    email_marketing_status: undefined,
    // Campos de licencia de paciente médica
    redcard: rowData.redcard || undefined,
    redcardmonth: rowData.redcardmonth || undefined,
    redcardday: rowData.redcardday || undefined,
    redcardyear: rowData.redcardyear || undefined,
    redcardtime: rowData.redcardtime || undefined, // Timestamp de procesamiento de licencia médica
    license_exp_date: rawExpirationDate || undefined,
  };

  return patient;
}

// MIGRATED: Updated fetchPatients function to use customers table
export async function fetchPatients(options = {}) {
  const { 
    limit = null, // null means no limit
    offset = 0,
    searchTerm = null,
    expirationFilter = null,
    locationFilter = null
  } = options;

  // UPDATED: For proper global sorting by expiration urgency, we need to:
  // 1. Fetch ALL records that match filters
  // 2. Calculate days_to_expiration for all
  // 3. Sort globally by urgency
  // 4. Apply pagination manually
  
  let query = supabase
    .from('customers')
    .select(`
      customerid, lastname, firstname, middlename,
      birthmonth, birthday, birthyear,
      phone, email, cell, address1, address2, city, state, zip,
      licensenum, licenseexpmonth, licenseexpyear,
      redcard, redcardmonth, redcardday, redcardyear, redcardtime,
      createdate, modified_on_bt, deleted, location, ismember
    `, { count: 'exact' }) // Get total count with specific fields
    .eq('deleted', 0) // Only non-deleted customers
    .not('customerid', 'is', null) // Filter out null customerids
    .not('customerid', 'eq', '') // Filter out empty customerids
    .order('lastname', { ascending: true }) // Basic ordering for consistency
    .order('firstname', { ascending: true });

  // Apply search filter if provided
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    query = query.or(`firstname.ilike.%${term}%,lastname.ilike.%${term}%,email.ilike.%${term}%,redcard.ilike.%${term}%,cell.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  // Note: We'll apply expiration filtering after transforming the data
  // since we need to calculate the actual expiration dates first

  // Apply location filter if provided
  if (locationFilter) {
    // First get the location ID from the location name
    const { data: locationData } = await supabase
      .from('locations')
      .select('id')
      .eq('name', locationFilter)
      .single();
    
    if (locationData?.id) {
      query = query.eq('location', locationData.id);
    }
  }

  // DON'T apply pagination yet - we need to sort first
  // Apply limit later after sorting

  const { data, error, count } = await query;

  if (error) {
    console.error("[patientService] Error fetching customers from Supabase: ", error);
    throw new Error("Failed to fetch customers from database.");
  }

  if (!data) {
    console.log("[patientService] fetchPatients: No data returned from Supabase for customers query.");
    return { patients: [], totalCount: 0 };
  }

  console.log(`[patientService] fetchPatients: Fetched ${data.length} customers out of ${count} total for sorting.`);

  // Add debug logging for problematic records
  const validData = data.filter(row => {
    if (!row) {
      console.warn(`[patientService] Row is null/undefined`);
      return false;
    }
    
    // Just validate that customerid exists - don't convert to number
    if (!row.customerid) {
      console.warn(`[patientService] Missing customerid:`, {
        original: row.customerid,
        type: typeof row.customerid,
        rowSample: {
          firstname: row.firstname,
          lastname: row.lastname,
          licensenum: row.licensenum,
          allKeys: Object.keys(row)
        }
      });
      return false;
    }
    
    return true;
  });

  console.log(`[patientService] After filtering: ${validData.length} valid customers out of ${data.length} fetched.`);
  
  // Debug: Log some sample customerid values to verify they're being preserved correctly
  if (validData.length > 0) {
    console.log('[patientService] Sample customerid values:', validData.slice(0, 3).map(row => ({
      customerid: row.customerid,
      type: typeof row.customerid,
      name: `${row.firstname} ${row.lastname}`
    })));
  }
  
  // Show sample of what we got
  if (data.length > 0) {
    console.log(`[patientService] Sample raw data from Supabase:`, data[0]);
  }
  if (validData.length > 0) {
    console.log(`[patientService] Sample valid data:`, validData[0]);
  }

  // Get location names for the customers
  const locationIds = [...new Set(validData.map(row => row.location).filter(id => id))];
  
  if (locationIds.length === 0) {
    console.log('[patientService] No location IDs found in customer data');
    const transformedPatients = validData
      .map(row => ({
        ...row,
        locationName: 'Unknown Location'
      }))
      .map(row => transformSupabaseRowToPatient(row))
      .filter(patient => patient !== null) as Patient[];
    
    return { 
      patients: transformedPatients, 
      totalCount: count || 0 
    };
  }
  
  console.log('[patientService] Looking up location names for IDs:', locationIds);
  
  const { data: locationsData, error: locationsError } = await supabase
    .from('locations')
    .select('id, name')
    .in('id', locationIds);
  
  if (locationsError) {
    console.error('[patientService] Error fetching location names:', locationsError);
  }
  
  // Create location lookup map
  const locationMap = new Map();
  if (locationsData) {
    locationsData.forEach(loc => {
      locationMap.set(loc.id, loc.name);
    });
  }

  // Add location names to customer data
  const customersWithLocations = validData.map(customer => ({
    ...customer,
    locationName: locationMap.get(customer.location) || `Location ${customer.location}` || 'Unknown Location'
  }));

  const transformedPatients = customersWithLocations
    .map(row => transformSupabaseRowToPatient(row))
    .filter(patient => patient !== null) as Patient[];

  // Apply expiration filtering after calculating the actual expiration dates
  let filteredPatients = transformedPatients;
  
  // UPDATED: By default, show ALL patients (more inclusive filtering)
  if (!expirationFilter || expirationFilter === 'all') {
    // Default: Show ALL patients (don't filter by expiration unless specifically requested)
    filteredPatients = transformedPatients; // No filtering - show everyone
    console.log(`[patientService] Default filter applied (show all patients): ${filteredPatients.length} patients out of ${transformedPatients.length} total`);
  } else {
    // Apply specific expiration filters
    switch (expirationFilter) {
      case '1to60days':
        filteredPatients = transformedPatients.filter(patient => {
          if (patient.days_to_expiration !== undefined && patient.days_to_expiration !== -9999) {
            return patient.days_to_expiration >= 1 && patient.days_to_expiration <= 60;
          }
          return false;
        });
        break;
      case '61to120days':
        filteredPatients = transformedPatients.filter(patient => {
          if (patient.days_to_expiration !== undefined && patient.days_to_expiration !== -9999) {
            return patient.days_to_expiration >= 61 && patient.days_to_expiration <= 120;
          }
          return false;
        });
        break;
      case '120plusdays':
        filteredPatients = transformedPatients.filter(patient => {
          if (patient.days_to_expiration !== undefined && patient.days_to_expiration !== -9999) {
            return patient.days_to_expiration > 120;
          }
          return false;
        });
        break;
      case 'expired':
        filteredPatients = transformedPatients.filter(patient => {
          if (patient.days_to_expiration !== undefined && patient.days_to_expiration !== -9999) {
            return patient.days_to_expiration < 0;
          }
          // Fallback to date comparison if days_to_expiration not available
          if (patient.license_exp_date) {
            const expirationDate = new Date(patient.license_exp_date);
            const today = new Date();
            return expirationDate < today;
          }
          return false;
        });
        break;
      case 'expiring_today':
        filteredPatients = transformedPatients.filter(patient => {
          if (patient.days_to_expiration !== undefined && patient.days_to_expiration !== -9999) {
            return patient.days_to_expiration === 0;
          }
          return false;
        });
        break;
    }
    
    console.log(`[patientService] Expiration filter '${expirationFilter}' applied: ${filteredPatients.length} patients out of ${transformedPatients.length} total`);
  }

  // TODO: Restore sorting by expiration urgency after confirming data is loading
  // For now, patients will be sorted by lastname/firstname from the database query
  // Once we confirm patients are loading, we'll re-implement the in-memory sorting
  // to achieve the desired pagination with global expiration order
  
  // UPDATED: Sort patients globally by expiration urgency - closest to expiring first (0 days, 1 day, 2 days, etc.)
  filteredPatients.sort((a, b) => {
    // If both have valid days_to_expiration
    if (a.days_to_expiration !== undefined && a.days_to_expiration !== -9999 && 
        b.days_to_expiration !== undefined && b.days_to_expiration !== -9999) {
      
      // For non-expired patients, sort by closest to expiring first (0, 1, 2, 3, etc.)
      if (a.days_to_expiration >= 0 && b.days_to_expiration >= 0) {
        return a.days_to_expiration - b.days_to_expiration;
      }
      
      // For expired patients (when shown), sort by most recently expired first (closest to 0)
      if (a.days_to_expiration < 0 && b.days_to_expiration < 0) {
        return b.days_to_expiration - a.days_to_expiration; // -1, -2, -3, etc.
      }
      
      // Non-expired always comes before expired (but expired are hidden by default anyway)
      if (a.days_to_expiration >= 0 && b.days_to_expiration < 0) return -1;
      if (a.days_to_expiration < 0 && b.days_to_expiration >= 0) return 1;
    }
    
    // Fallback to license_exp_date if days_to_expiration not available
    if (a.license_exp_date && b.license_exp_date) {
      const aExpiration = new Date(a.license_exp_date);
      const bExpiration = new Date(b.license_exp_date);
      const today = new Date();
      
      // For non-expired dates, sort by closest to expiring first
      if (aExpiration >= today && bExpiration >= today) {
        return aExpiration.getTime() - bExpiration.getTime();
      }
      
      // For expired dates, sort by most recently expired first
      if (aExpiration < today && bExpiration < today) {
        return bExpiration.getTime() - aExpiration.getTime();
      }
      
      // Non-expired before expired
      if (aExpiration >= today && bExpiration < today) return -1;
      if (aExpiration < today && bExpiration >= today) return 1;
    }
    
    // If only one has expiration date, prioritize the one with date
    if (a.license_exp_date && !b.license_exp_date) return -1;
    if (!a.license_exp_date && b.license_exp_date) return 1;
    
    // If neither has expiration date, maintain original order
    return 0;
  });
  
  console.log(`[patientService] Globally sorted ${filteredPatients.length} patients by expiration urgency (closest to expiring first)`);
  if (filteredPatients.length > 0) {
    console.log(`[patientService] First patient expires in: ${filteredPatients[0].days_to_expiration} days (${filteredPatients[0].firstname} ${filteredPatients[0].lastname})`);
    if (filteredPatients.length > 5) {
      console.log(`[patientService] Last patient in sort expires in: ${filteredPatients[filteredPatients.length - 1].days_to_expiration} days`);
    }
  }
  
  // NOW apply pagination manually after global sorting
  let paginatedPatients = filteredPatients;
  if (limit && limit > 0) {
    const startIndex = offset;
    const endIndex = offset + limit;
    paginatedPatients = filteredPatients.slice(startIndex, endIndex);
    console.log(`[patientService] Applied manual pagination: showing ${startIndex + 1}-${Math.min(endIndex, filteredPatients.length)} of ${filteredPatients.length} total`);
  }

  return { 
    patients: paginatedPatients, 
    totalCount: filteredPatients.length // Use filtered count, not original DB count
  };
}

export async function fetchPatientById(id: string | number): Promise<Patient | null> {
  if (!id) {
     console.error("[patientService] Invalid customer ID provided to fetchPatientById:", id);
     return null;
  }
  
  // Convert ID to string since customerid is stored as character varying in DB
  const customerIdToSearch = typeof id === 'number' ? id.toString() : id;
  
  console.log(`[patientService] Searching for customer with ID: ${customerIdToSearch} (original: ${id}, type: ${typeof id})`);
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customerid', customerIdToSearch) // Search by customerid as string
    .eq('deleted', 0) // Only non-deleted customers
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116' && error.message.includes('0 rows')) { // PGRST116: "The result contains 0 rows"
        console.log(`[patientService] Customer with ID ${customerIdToSearch} not found (this is normal if ID doesn't exist)`);
        return null;
    }
    console.error(`[patientService] Error fetching customer with id ${customerIdToSearch} from Supabase: `, error);
    throw new Error(`Failed to fetch customer with id ${customerIdToSearch} from database.`);
  }

  if (!data) {
    console.log(`[patientService] No data returned for customer ID ${customerIdToSearch}`);
    return null;
  }

  console.log(`[patientService] Successfully found customer: ${data.firstname} ${data.lastname} (customerid: ${data.customerid})`);
  return transformSupabaseRowToPatient(data);
}

export async function fetchNotesByPatientId(patientId: number): Promise<Note[]> {
  if (isNaN(patientId)) {
    console.error("[patientService] Invalid patient ID provided to fetchNotesByPatientId:", patientId);
    return [];
  }
  const { data, error } = await supabase
    .from('patient_notes')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[patientService] Error fetching notes for patient ${patientId}:`, error);
    throw new Error('Failed to fetch patient notes.');
  }
  return (data || []).map(note => ({
    ...note,
    id: note.id.toString(), 
    created_at: note.created_at 
  })) as Note[];
}

export async function fetchAllPatientNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('patient_notes')
    .select(`
      *,
      customer:customers!customer_id(
        customerid,
        firstname,
        lastname
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[patientService] Error fetching all patient notes:', error);
    throw new Error('Failed to fetch all patient notes.');
  }

  return (data || []).map(note => ({
    ...note,
    id: note.id.toString(),
    created_at: note.created_at,
    patient: note.customer ? {
      id: parseInt(note.customer.customerid),
      firstname: note.customer.firstname || '',
      lastname: note.customer.lastname || ''
    } : undefined
  })) as Note[];
}

export async function addPatientNote(patientId: number, noteContent: string, createdByUserId?: string): Promise<Note> {
  if (isNaN(patientId) || !noteContent.trim()) {
    throw new Error('Invalid input for adding patient note.');
  }
  const noteData: any = {
    patient_id: patientId,
    note_content: noteContent,
    // Include created_by_user_id if provided
    ...(createdByUserId && { created_by_user_id: createdByUserId }),
  };

  const { data, error } = await supabase
    .from('patient_notes')
    .insert([noteData])
    .select()
    .single();

  if (error) {
    console.error('[patientService] Error adding patient note:', error);
    throw new Error('Failed to add patient note.');
  }
  return {
      ...data,
      id: data.id.toString(),
      created_at: data.created_at
  } as Note;
}

export async function uploadLicensePhoto(patientId: number, file: File): Promise<string> {
  const fileName = `patient_licenses/${patientId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('license-photos') 
    .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true 
    });

  if (uploadError) {
    console.error('[patientService] Error uploading license photo to Supabase Storage:', uploadError);
    throw new Error(`Failed to upload license photo: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('license-photos') 
    .getPublicUrl(uploadData.path);

  if (!publicUrlData?.publicUrl) {
    console.error('[patientService] Could not get public URL for uploaded license photo.');
    try {
      await supabase.storage.from('license-photos').remove([uploadData.path]);
    } catch (removeError) {
      console.error('[patientService] Failed to remove orphaned license photo from storage:', removeError);
    }
    throw new Error('Failed to get public URL for license photo.');
  }

  return publicUrlData.publicUrl;
}

export async function fetchUniqueDispensaryNames(): Promise<string[]> {
  console.log('[patientService] Fetching unique location names from locations table...');

  const { data, error } = await supabase
    .from('locations')
    .select('name')
    .order('name');

  if (error) {
    console.error('[patientService] Error fetching unique location names:', error);
    // Return a default list or empty array in case of error
    return []; 
  }

  if (!data) {
    console.warn("[patientService] fetchUniqueDispensaryNames: No data returned from Supabase.");
    return [];
  }

  const uniqueNames = Array.from(new Set(data
    .map(row => row.name)
    .filter((name): name is string => typeof name === 'string' && name.trim() !== ''))); // Filter out null, undefined, and empty strings

  console.log('[patientService] Found dispensary names:', uniqueNames);
  return uniqueNames.sort(); // Sort alphabetically
}
export async function updatePatientLicensePhotoUrl(patientId: number, photoUrl: string): Promise<void> {
    // NOTE: This function might need to be updated based on how you want to store license photos
    // for customers. For now, we'll update the customer record or create a separate table
    console.warn('[patientService] updatePatientLicensePhotoUrl: This function needs to be updated for customers table');
    
    // Option 1: Add license_photo_url column to customers table
    // Option 2: Create a separate customer_documents table
    // For now, we'll just log the action
    console.log(`[patientService] Would update license photo URL for customer ${patientId}: ${photoUrl}`);
}

// FIXED: Updated fetchSubmissionsForPatient function with proper field mapping
export async function fetchSubmissionsForPatient(patient: Patient): Promise<LicenseSubmission[]> {
  if (!patient) return [];

  const orConditions: string[] = [];
  if (patient.id) orConditions.push(`patient_id.eq.${patient.id}`);
  if (patient.mmj_card) orConditions.push(`mmj_card_number.eq.${patient.mmj_card}`);
  if (patient.email && patient.email.trim() !== '') orConditions.push(`email.ilike.%${patient.email.trim()}%`);
  
  if (patient.cell && patient.cell.trim() !== '') {
      const numericCell = patient.cell.replace(/\D/g, '');
      if (numericCell) {
          // For numeric phone_number field
          orConditions.push(`phone_number.eq.${numericCell}`);
      }
  }

  if (orConditions.length === 0) {
    console.warn("[patientService] No valid identifiers to fetch submissions for patient:", patient);
    return [];
  }

  const { data, error } = await supabase
    .from('license_submissions')
    .select(`
      id,
      submitted_at,
      submission_type,
      first_name,
      last_name,
      email,
      phone_number,
      mmj_card_number,
      status,
      processed_at,
      patient_id,
      date_of_birth
    `)
    .or(orConditions.join(','))
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error(`[patientService] Error fetching submissions for patient ${patient.id || patient.email}:`, error);
    return []; 
  }

  // Transform to match expected interface - map database fields to expected fields
  return (data || []).map(sub => ({
      id: sub.id.toString(),
      submitted_at: sub.submitted_at,
      submission_type: sub.submission_type === 'Renewal Medical License' ? 'RENEWAL' : 'NEW',
      first_name: sub.first_name,
      last_name: sub.last_name,
      email: sub.email,
      phone_number: sub.phone_number?.toString() || '',
      date_of_birth: sub.date_of_birth,
      mmj_card_number: sub.mmj_card_number,
      new_mmj_expiration_date: null, // This field doesn't exist in your DB
      email_opt_in: true, // Default values since these fields may not exist
      sms_opt_in: true,
      status: sub.status || 'UNKNOWN',
      processed_at: sub.processed_at,
      patient_id: sub.patient_id || patient.id,
  })) as LicenseSubmission[];
}

export async function fetchRecentRenewals(): Promise<Patient[]> {
  const now = new Date();
  const startDate = format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"); 
  const endDate = format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");     

  const { data: submissionsData, error: submissionsError } = await supabase
    .from('license_submissions')
    .select('patient_id')
    .eq('submission_type', 'Renewal Medical License') // Match exact type
    .eq('status', 'PROCESSED')                   
    .gte('processed_at', startDate)               
    .lte('processed_at', endDate)
    .not('patient_id', 'is', null);             

  if (submissionsError) {
    console.error('[patientService] Error fetching recent renewal submissions:', submissionsError);
    return [];
  }

  if (!submissionsData || submissionsData.length === 0) {
    return []; 
  }

  const customerIds = submissionsData
    .map(s => s.patient_id)
    .filter(id => id !== null && id !== undefined && !isNaN(Number(id))) as number[];

  if (customerIds.length === 0) {
    return [];
  }

  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .in('customerid', customerIds)
    .eq('deleted', 0);

  if (customersError) {
    console.error('[patientService] Error fetching customers for recent renewals:', customersError);
    return [];
  }

  const transformedPatients = (customersData || [])
    .map(row => transformSupabaseRowToPatient(row))
    .filter(p => p !== null) as Patient[];
  return transformedPatients;
}

// ENHANCED: Updated fetchEnhancedSubmissions function with better 12-month support
export async function fetchEnhancedSubmissions(filterStartDate?: Date): Promise<EnhancedLicenseSubmission[]> {
  console.log(`[patientService] fetchEnhancedSubmissions called with filterStartDate:`, filterStartDate);
  
  let query = supabase
    .from('license_submissions')
    .select(`
      id,
      submitted_at,
      submission_type,
      first_name,
      last_name,
      middle_name,
      email,
      phone_number,
      date_of_birth,
      mmj_card_number,
      address1,
      city,
      state,
      zip_code,
      dispensary_location,
      email_opt_in,
      sms_opt_in,
      license_photo_url,
      patient_id,
      status,
      processed_at,
      patient_walkIn_payment,
      payment,
      promotion,
      order_payment_status,
      order_payment_method,
      payment_confirmation
    `)
    .order('submitted_at', { ascending: false });

  if (filterStartDate) {
    const isoStartDate = filterStartDate.toISOString();
    query = query.gte('submitted_at', isoStartDate);
    console.log(`[patientService] fetchEnhancedSubmissions: Filtering submissions from: ${isoStartDate} (${format(filterStartDate, 'yyyy-MM-dd')})`);
  } else {
    console.log("[patientService] fetchEnhancedSubmissions: No date filter applied - fetching all submissions");
    // Remove the default limit when no date filter is provided to allow "All Time" option
    // query = query.limit(250); // Commented out to allow unlimited fetching
  }

  const { data: submissionsData, error: submissionsError } = await query;

  if (submissionsError) {
    console.error(
      "[patientService] Supabase error fetching submissions for enhanced view. Raw error object:",
      JSON.stringify(submissionsError, Object.getOwnPropertyNames(submissionsError), 2)
    );
    let detailedMessage = "Failed to fetch submissions from Supabase.";
    if (submissionsError.message) {
      detailedMessage += ` Message: ${submissionsError.message}`;
    }
    if (submissionsError.details) {
      detailedMessage += ` Details: ${submissionsError.details}`;
    }
    if (submissionsError.hint) {
      detailedMessage += ` Hint: ${submissionsError.hint}`;
    }
    if (submissionsError.code) {
      detailedMessage += ` Code: ${submissionsError.code}`;
    }
    if (Object.keys(submissionsError).length === 0 || (!submissionsError.message && !submissionsError.details)) {
        detailedMessage += " This might be due to RLS policies, incorrect table/column names, or an issue with the query structure. Please verify your Supabase setup and RLS policies for the 'license_submissions' table.";
    }
    throw new Error(detailedMessage);
  }

  if (!submissionsData) {
    console.warn("[patientService] No submissions data returned from Supabase for enhanced view (submissionsData is null/undefined), but no explicit error.");
    return [];
  }
  
  if (submissionsData.length === 0) {
      console.warn("[patientService] Fetched 0 submissions for enhanced view. Check table data, RLS policies, or if the table is truly empty for the query.");
      return [];
  }
  console.log(`[patientService] Fetched ${submissionsData.length} submissions for enhanced view (filtered from: ${filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : 'All time'}).`);

  // Fetch customers for matching - use correct field names from customers table
  const { data: patientsData, error: patientsError } = await supabase
    .from('customers')
    .select('customerid, email, cell, licensenum') // Updated to use customers fields
    .eq('deleted', 0);

  if (patientsError) {
    console.error("[patientService] Supabase error fetching patients for matching in enhanced submissions:", patientsError);
  }

  // Create lookup maps for patient matching
  const patientMapById = new Map<number, { id: number }>();
  const patientMapByEmail = new Map<string, { id: number }>();
  const patientMapByPhone = new Map<string, { id: number }>();
  const patientMapByMmjCard = new Map<string, { id: number }>();

  if (patientsData) {
    for (const p of patientsData) {
      if (p.customerid) patientMapById.set(p.customerid, { id: p.customerid });
      if (p.email) patientMapByEmail.set(p.email.toLowerCase(), { id: p.customerid });
      if (p.cell) {
        const numericPhone = p.cell.toString().replace(/\D/g, '');
        if (numericPhone) patientMapByPhone.set(numericPhone, { id: p.customerid});
      }
      if (p.licensenum) patientMapByMmjCard.set(p.licensenum, { id: p.customerid});
    }
  }

  // Enhanced submissions with patient matching logic
  const enhancedSubmissions = submissionsData.map(sub => {
    let isExistingPatient = false;
    let matchedPatientId: number | null = null;

    // First check if patient_id is already set and valid
    if (sub.patient_id) {
      const numericPatientId = typeof sub.patient_id === 'string' ? parseInt(sub.patient_id, 10) : sub.patient_id;
      if (!isNaN(numericPatientId) && patientMapById.has(numericPatientId)) {
        isExistingPatient = true;
        matchedPatientId = numericPatientId;
      }
    }

    // If no direct patient_id match, try other matching methods
    if (!matchedPatientId) {
      // Try email matching
      if (sub.email) {
        const patientByEmail = patientMapByEmail.get(sub.email.toLowerCase());
        if (patientByEmail) {
          isExistingPatient = true;
          matchedPatientId = patientByEmail.id;
        }
      }

      // Try phone matching
      if (!matchedPatientId && sub.phone_number) { 
        const normalizedPhone = sub.phone_number.toString().replace(/\D/g, '');
        if (normalizedPhone) {
          const patientByPhone = patientMapByPhone.get(normalizedPhone);
          if (patientByPhone) {
            isExistingPatient = true;
            matchedPatientId = patientByPhone.id;
          }
        }
      }

      // Try MMJ card matching
      if (!matchedPatientId && sub.mmj_card_number) { 
        const patientByMmj = patientMapByMmjCard.get(sub.mmj_card_number);
        if (patientByMmj) {
          isExistingPatient = true;
          matchedPatientId = patientByMmj.id;
        }
      }
    }

    return {
      ...sub,
      id: sub.id.toString(), 
      isExistingPatient,
      matchedPatientId: matchedPatientId?.toString() || null, // Convert to string for consistency
    } as EnhancedLicenseSubmission;
  });

  return enhancedSubmissions;
}

// FIXED: Support for flexible date ranges in license submission stats including current month
const processSubmissionsForType = (
  submissions: any[],
  targetType: string,
  typeLabel: string,
  monthsLookback: number = 4 // Default to 4 months
): TypedSubmissionStats => {
  const typeSubmissions = submissions.filter(
    (s) => s.submission_type?.toLowerCase() === targetType.toLowerCase() || 
          (targetType.toLowerCase() === 'renewal medical license' && s.submission_type === null)
  );
  console.log(`[patientService] Found ${typeSubmissions.length} submissions of type '${typeLabel}' (target: '${targetType.toLowerCase()}').`);

  if (typeSubmissions.length === 0) {
    return { topLocation: null, monthlyTrend: [], totalCount: 0 };
  }

  const countsByLocation: Record<string, number> = {};
  typeSubmissions.forEach((s) => {
    const location = s.dispensary_location || 'Unknown Location';
    countsByLocation[location] = (countsByLocation[location] || 0) + 1;
  });

  let topLocationValue: string | null = null;
  let maxCount = 0;
  for (const [location, count] of Object.entries(countsByLocation)) {
    if (count > maxCount) {
      maxCount = count;
      topLocationValue = location;
    }
  }
  const topLocationStat = topLocationValue ? { name: topLocationValue, count: maxCount } : null;

  // FIXED: Generate monthly trend to include current month (i=0) and previous months
  const monthlyTrendDataMap: Record<string, { month: string; monthKey: string; count: number }> = {};
  const today = new Date();
  
  for (let i = monthsLookback - 1; i >= 0; i--) { // i=3,2,1,0 for 4 months including current
    const targetDate = subMonths(today, i);
    const monthKey = format(targetDate, 'yyyy-MM');
    const monthLabel = format(targetDate, 'MMM yy');
    monthlyTrendDataMap[monthKey] = { month: monthLabel, monthKey, count: 0 };
    console.log(`[patientService] Added monthly trend key for ${typeLabel}: ${monthKey} (${monthLabel}) - Today: ${format(today, 'yyyy-MM-dd')}, i=${i}`);
  }

  // Count submissions for each month
  typeSubmissions.forEach((s) => {
    if (s.submitted_at) {
      const parsedDate = parseISO(s.submitted_at);
      if (isValid(parsedDate)) {
        const submissionMonthKey = format(parsedDate, 'yyyy-MM');
        if (monthlyTrendDataMap[submissionMonthKey]) {
          monthlyTrendDataMap[submissionMonthKey].count++;
          console.log(`[patientService] Counted ${typeLabel} submission in ${submissionMonthKey}: ${s.dispensary_location}`);
        }
      }
    }
  });

  const monthlyTrend = Object.values(monthlyTrendDataMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  console.log(`[patientService] Calculated monthly trend for type '${typeLabel}':`, monthlyTrend);

  return { topLocation: topLocationStat, monthlyTrend, totalCount: typeSubmissions.length };
};

// FIXED: fetchLicenseSubmissionStats function with current month inclusion
export async function fetchLicenseSubmissionStats(): Promise<SubmissionStats> {
  console.log('[patientService] Fetching ALL license submissions for dashboard stats (no status filter)...');

  const { data: allSubmissions, error: allError } = await supabase
    .from('license_submissions')
    .select('id, dispensary_location, submission_type, submitted_at')
    .order('submitted_at', { ascending: false }) 
    .limit(1000); 

  if (allError) {
    console.error('[patientService] Supabase error fetching submissions for stats calculation. Raw error object:', JSON.stringify(allError, Object.getOwnPropertyNames(allError), 2));
    throw new Error('Failed to fetch submissions for stats calculation.');
  }

  const fetchedCount = allSubmissions?.length || 0;
  console.log(`[patientService] Fetched ${fetchedCount} total submissions for dashboard stats calculation (capped at ${fetchedCount < 1000 ? fetchedCount : '1000 by Supabase default'}).`);

  if (!allSubmissions || allSubmissions.length === 0) {
    console.warn("[patientService] No submissions found for stats. Dashboard stats will be empty or show 'No data'.");
    return {
      renewalStats: { topLocation: null, monthlyTrend: [], totalCount: 0 },
      newLicenseStats: { topLocation: null, monthlyTrend: [], totalCount: 0 },
      allLocationsMonthlyBreakdown: [],
    };
  }
  
  console.log('[patientService] Sample submissions for stats (first 3):', allSubmissions?.slice(0, 3).map(s => {
    const parsedDate = s.submitted_at ? parseISO(s.submitted_at) : null;
    return {
      id: s.id,
      raw_submitted_at: s.submitted_at,
      parsed_submitted_at: parsedDate && isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd HH:mm:ss') : 'Invalid or Null Date',
      is_valid_date: parsedDate ? isValid(parsedDate) : false,
      submission_type: s.submission_type,
      dispensary_location: s.dispensary_location
    };
  }));
  
  const renewalStats = processSubmissionsForType(allSubmissions, 'Renewal Medical License', 'Renewal Medical License', 4);
  const newLicenseStats = processSubmissionsForType(allSubmissions, 'New Medical License', 'New Medical License', 4);

  // FIXED: Generate month keys to include current month (June 2025)
  const allLocationsMonthlyBreakdownMap: Record<string, Record<string, { renewals: number; newLicenses: number }>> = {};
  const todayForBreakdown = new Date();
  const breakdownMonthKeys: string[] = [];
  
  // FIXED: Include current month (i=0) and 3 previous months (i=1,2,3)
  for (let i = 3; i >= 0; i--) { 
    const targetDate = subMonths(todayForBreakdown, i);
    const monthKey = format(targetDate, 'yyyy-MM');
    breakdownMonthKeys.push(monthKey);
    console.log(`[patientService] Added month key for breakdown: ${monthKey} (${format(targetDate, 'MMM yyyy')}) - Current date: ${format(todayForBreakdown, 'yyyy-MM-dd')}`);
}

  console.log('[patientService] All breakdown month keys:', breakdownMonthKeys);

  // FIXED: Filter submissions to include current month properly
  const submissionsInDateRange = allSubmissions.filter(s => {
      if (!s.submitted_at) return false;
      const parsedDate = parseISO(s.submitted_at);
      if (!isValid(parsedDate)) return false;
      
      const submissionMonthKey = format(parsedDate, 'yyyy-MM');
      const isInRange = breakdownMonthKeys.includes(submissionMonthKey);
      
      if (isInRange) {
        console.log(`[patientService] Including submission from ${submissionMonthKey}: ${s.submission_type} at ${s.dispensary_location}`);
      }
      
      return isInRange;
  });

  console.log(`[patientService] Filtered ${submissionsInDateRange.length} submissions out of ${allSubmissions.length} for breakdown (last 4 months including current)`);

  // Initialize all locations and months with zero counts
  const allLocations = new Set<string>();
  submissionsInDateRange.forEach(s => {
    const location = s.dispensary_location || 'Unknown Location';
    allLocations.add(location);
  });

  // Initialize the breakdown map
  allLocations.forEach(location => {
    allLocationsMonthlyBreakdownMap[location] = {};
    breakdownMonthKeys.forEach(monthKey => { 
        allLocationsMonthlyBreakdownMap[location][monthKey] = { renewals: 0, newLicenses: 0 };
    });
  });

  // FIXED: Process submissions and count them properly
  submissionsInDateRange.forEach(s => {
    if (s.submitted_at) { 
        const parsedDate = parseISO(s.submitted_at); 
        const monthKey = format(parsedDate, 'yyyy-MM');
        const location = s.dispensary_location || 'Unknown Location';

        // Ensure location exists in map
        if (!allLocationsMonthlyBreakdownMap[location]) {
            allLocationsMonthlyBreakdownMap[location] = {};
            breakdownMonthKeys.forEach(mk => { 
                allLocationsMonthlyBreakdownMap[location][mk] = { renewals: 0, newLicenses: 0 };
            });
        }
        
        const typeLower = s.submission_type?.toLowerCase();
        // FIXED: Handle NULL submission_type and broader matching
        if (typeLower === 'renewal medical license' || typeLower === 'renewal' || s.submission_type === null) {
            allLocationsMonthlyBreakdownMap[location][monthKey].renewals++;
            console.log(`[patientService] Added renewal for ${location} in ${monthKey} (type: ${s.submission_type})`);
        } else if (typeLower === 'new medical license' || typeLower === 'new') {
            allLocationsMonthlyBreakdownMap[location][monthKey].newLicenses++;
            console.log(`[patientService] Added new license for ${location} in ${monthKey} (type: ${s.submission_type})`);
        } else {
            console.log(`[patientService] Unknown submission type: '${s.submission_type}' for ${location} in ${monthKey}`);
        }
    }
  });

  // Build the final breakdown array
  const allLocationsMonthlyBreakdown: MonthlyLocationBreakdown[] = [];
  for (const location in allLocationsMonthlyBreakdownMap) {
    for (const monthKey of breakdownMonthKeys) { 
        const monthDate = parseISO(`${monthKey}-01`); 
        const monthLabel = format(monthDate, 'MMM yy');
        
        const renewals = allLocationsMonthlyBreakdownMap[location][monthKey]?.renewals || 0;
        const newLicenses = allLocationsMonthlyBreakdownMap[location][monthKey]?.newLicenses || 0;
        
        allLocationsMonthlyBreakdown.push({
            location,
            month: monthLabel,
            monthKey,
            renewals,
            newLicenses,
        });
        
        if (renewals > 0 || newLicenses > 0) {
          console.log(`[patientService] Final breakdown entry: ${location} - ${monthLabel} - R:${renewals} N:${newLicenses}`);
        }
    }
  }

  // Sort by location then by month
  allLocationsMonthlyBreakdown.sort((a, b) => {
    if (a.location < b.location) return -1;
    if (a.location > b.location) return 1;
    return a.monthKey.localeCompare(b.monthKey); 
  });

  console.log(`[patientService] Top Renewal Location for stats:`, renewalStats.topLocation);
  console.log(`[patientService] Top New License Location for stats:`, newLicenseStats.topLocation);
  console.log(`[patientService] Total locations in breakdown: ${new Set(allLocationsMonthlyBreakdown.map(b => b.location)).size}`);
  console.log(`[patientService] Breakdown entries with data:`, allLocationsMonthlyBreakdown.filter(b => b.renewals > 0 || b.newLicenses > 0).length);
  
  if (renewalStats.monthlyTrend.every(m => m.count === 0) && renewalStats.totalCount > 0) {
    console.warn(`[patientService] Renewal monthly trend for stats is empty (all zero counts), but renewal submissions exist. Check 'submitted_at' field format and date range logic.`);
  }
  if (newLicenseStats.monthlyTrend.every(m => m.count === 0) && newLicenseStats.totalCount > 0) {
     console.warn(`[patientService] New License monthly trend for stats is empty (all zero counts), but new license submissions exist. Check 'submitted_at' field format and date range logic.`);
  }

  return {
    renewalStats,
    newLicenseStats,
    allLocationsMonthlyBreakdown,
  };
}

export async function fetchPatientMarketingHistory(patientEmail: string): Promise<MarketingSendLog[]> {
  if (!patientEmail || patientEmail.trim() === '') {
    return [];
  }

  const { data, error } = await supabase
    .from('marketing_campaign_sends')
    .select('*')
    .eq('subscriber_email', patientEmail)
    .order('sent_at', { ascending: false })
    .limit(50); 

  if (error) {
    console.error(`[patientService] Error fetching marketing history for ${patientEmail}:`, error);
    throw new Error('Failed to fetch patient marketing communication history.');
  }

  if (!data) {
    return [];
  }
  return data.map(log => ({
    ...log,
    id: log.id.toString(), 
  })) as MarketingSendLog[];
}

// UPDATED: Use pre-calculated stats from database for optimal performance
export async function fetchDashboardExpirationCardStats(): Promise<DashboardExpirationCardStats> {
  try {
    console.log('[fetchDashboardExpirationCardStats] Using pre-calculated stats from database...');
    
    // Use RPC function to get pre-calculated stats
    const { data, error } = await supabase.rpc('get_dashboard_expiration_stats');
    
    if (error) {
      console.error('[fetchDashboardExpirationCardStats] RPC Error:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[fetchDashboardExpirationCardStats] No data returned from RPC');
      return {
        expiredPatients: 0,
        expiringIn30Days: 0,
        expiringIn60Days: 0,
        expiringIn90Days: 0,
        renewalRatePercentage: 0
      };
    }
    
    console.log('[fetchDashboardExpirationCardStats] Pre-calculated stats retrieved:', data);
    
    return {
      expiredPatients: data.expiredPatients || 0,
      expiringIn30Days: data.expiringIn30Days || 0,
      expiringIn60Days: data.expiringIn60Days || 0,
      expiringIn90Days: data.expiringIn90Days || 0,
      renewalRatePercentage: data.renewalRatePercentage || 0
    };
    
  } catch (error) {
    console.error('[fetchDashboardExpirationCardStats] Error fetching pre-calculated stats:', error);
    
    // Fallback: Return default values if pre-calculated stats fail
    console.log('[fetchDashboardExpirationCardStats] Using fallback default values...');
    return {
      expiredPatients: 0,
      expiringIn30Days: 0,
      expiringIn60Days: 0,
      expiringIn90Days: 0,
      renewalRatePercentage: 0
    };
  }
}

export async function fetchMonthlyExpirationChartData(): Promise<ExpirationDataPoint[]> {
  console.log("[patientService] Fetching monthly expiration chart data via RPC...");
  const { data, error } = await supabase.rpc('get_monthly_expiration_counts');

  if (error) {
    console.error("[patientService] Error fetching monthly expiration chart data via RPC:", error);
    throw new Error("Failed to fetch monthly expiration chart data.");
  }

  if (!data) {
    console.warn("[patientService] No data returned from get_monthly_expiration_counts RPC.");
    return [];
  }
  
  const chartData: ExpirationDataPoint[] = data.map((item: any) => ({
    month: item.month_label, 
    patients: item.patient_count, 
  }));

  console.log("[patientService] Successfully fetched and transformed monthly expiration chart data:", chartData);
  return chartData;
}

// ENHANCED: Call logging functions with better integration for license renewal tracking
export interface CallLog {
  id: string;
  patient_id: number;
  call_outcome: string;
  call_notes?: string;
  created_at: string;
  user_id?: number;
  call_duration?: number;
  follow_up_date?: string;
  priority_level?: string;
}

export interface CallOutcomeType {
  id: number;
  outcome_code: string;
  outcome_label: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

// Fetch call logs for a specific patient
export async function fetchCallLogsByPatientId(patientId: number): Promise<CallLog[]> {
  if (isNaN(patientId)) {
    console.error("[patientService] Invalid patient ID provided to fetchCallLogsByPatientId:", patientId);
    return [];
  }

  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[patientService] Error fetching call logs for patient ${patientId}:`, error);
    throw new Error('Failed to fetch call logs.');
  }

  return (data || []).map(log => ({
    ...log,
    id: log.id.toString(),
    created_at: log.created_at
  })) as CallLog[];
}

// Add a new call log
export async function addCallLog(
  patientId: number, 
  callOutcome: string, 
  callNotes?: string,
  callDuration?: number,
  followUpDate?: string,
  priorityLevel?: string
): Promise<CallLog> {
  if (isNaN(patientId) || !callOutcome.trim()) {
    throw new Error('Invalid input for adding call log.');
  }

  const callLogData: any = {
    patient_id: patientId,
    call_outcome: callOutcome,
    call_notes: callNotes || null,
    call_duration: callDuration || null,
    follow_up_date: followUpDate || null,
    priority_level: priorityLevel || 'normal'
  };

  const { data, error } = await supabase
    .from('call_logs')
    .insert([callLogData])
    .select()
    .single();

  if (error) {
    console.error('[patientService] Error adding call log:', error);
    throw new Error('Failed to add call log.');
  }

  return {
    ...data,
    id: data.id.toString(),
    created_at: data.created_at
  } as CallLog;
}

// ENHANCED: Fetch available call outcome types with better license renewal context
export async function fetchCallOutcomeTypes(): Promise<CallOutcomeType[]> {
  const { data, error } = await supabase
    .from('call_outcome_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[patientService] Error fetching call outcome types:', error);
    // Return enhanced default options focused on license renewal process
    return [
      { id: 1, outcome_code: 'LICENSE_RENEWAL_INTERESTED', outcome_label: 'Interested in License Renewal', is_active: true, sort_order: 1 },
      { id: 2, outcome_code: 'LICENSE_RENEWAL_SCHEDULED', outcome_label: 'License Renewal Scheduled', is_active: true, sort_order: 2 },
      { id: 3, outcome_code: 'RENEWAL_APPOINTMENT_BOOKED', outcome_label: 'Renewal Appointment Booked', is_active: true, sort_order: 3 },
      { id: 4, outcome_code: 'RENEWAL_DOCUMENTS_NEEDED', outcome_label: 'Renewal Documents Needed', is_active: true, sort_order: 4 },
      { id: 5, outcome_code: 'RENEWAL_PAYMENT_DISCUSSED', outcome_label: 'Renewal Payment Discussed', is_active: true, sort_order: 5 },
      { id: 6, outcome_code: 'NOT_INTERESTED', outcome_label: 'Not Interested in Renewal', is_active: true, sort_order: 10 },
      { id: 7, outcome_code: 'NO_ANSWER', outcome_label: 'No Answer', is_active: true, sort_order: 20 },
      { id: 8, outcome_code: 'CALLBACK_REQUESTED', outcome_label: 'Callback Requested', is_active: true, sort_order: 21 },
      { id: 9, outcome_code: 'VOICEMAIL_LEFT', outcome_label: 'Voicemail Left', is_active: true, sort_order: 22 },
      { id: 10, outcome_code: 'WRONG_NUMBER', outcome_label: 'Wrong Number', is_active: true, sort_order: 30 },
      { id: 11, outcome_code: 'DO_NOT_CALL', outcome_label: 'Do Not Call', is_active: true, sort_order: 40 },
      { id: 12, outcome_code: 'FOLLOW_UP_NEEDED', outcome_label: 'Follow-up Needed', is_active: true, sort_order: 50 },
      { id: 13, outcome_code: 'COMPLETED_RENEWAL', outcome_label: 'Completed Renewal Process', is_active: true, sort_order: 60 },
      { id: 14, outcome_code: 'RENEWAL_EXPIRED_DISCUSSED', outcome_label: 'Expired License Discussed', is_active: true, sort_order: 70 },
      { id: 15, outcome_code: 'OTHER', outcome_label: 'Other', is_active: true, sort_order: 99 }
    ];
  }

  return data || [];
}

export async function fetchAllCallLogs(limit: number = 20): Promise<CallLog[]> {
  const { data, error } = await supabase
    .from('call_logs')
    .select(`
      *,
      customer:customers!customer_id(
        customerid,
        firstname,
        lastname,
        email,
        cell
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[patientService] Error fetching call logs:', error);
    throw new Error('Failed to fetch call logs.');
  }

  return (data || []).map(log => ({
    ...log,
    id: log.id.toString(),
    created_at: log.created_at,
    patient: log.customer ? {
      id: parseInt(log.customer.customerid),
      firstname: log.customer.firstname || '',
      lastname: log.customer.lastname || '',
      email: log.customer.email || '',
      cell: log.customer.cell || ''
    } : undefined
  })) as CallLog[];
}

// NEW: Enhanced submission analytics for 12-month license renewal periods
export interface SubmissionAnalytics {
  totalSubmissions: number;
  renewalSubmissions: number;
  newLicenseSubmissions: number;
  renewalRate: number;
  monthlyBreakdown: {
    month: string;
    renewals: number;
    newLicenses: number;
    total: number;
  }[];
  topLocations: {
    location: string;
    renewals: number;
    newLicenses: number;
    total: number;
  }[];
  statusBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
  paymentStatusBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

export async function fetchSubmissionAnalytics(startDate?: Date, endDate?: Date): Promise<SubmissionAnalytics> {
  console.log('[patientService] Fetching submission analytics for license renewal period...');
  
  let query = supabase
    .from('license_submissions')
    .select('submission_type, dispensary_location, status, order_payment_status, submitted_at');

  if (startDate) {
    query = query.gte('submitted_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('submitted_at', endDate.toISOString());
  }

  const { data: submissions, error } = await query;

  if (error) {
    console.error('[patientService] Error fetching submission analytics:', error);
    throw new Error('Failed to fetch submission analytics.');
  }

  if (!submissions) {
    return {
      totalSubmissions: 0,
      renewalSubmissions: 0,
      newLicenseSubmissions: 0,
      renewalRate: 0,
      monthlyBreakdown: [],
      topLocations: [],
      statusBreakdown: [],
      paymentStatusBreakdown: []
    };
  }

  const renewals = submissions.filter(s => s.submission_type?.toLowerCase().includes('renewal'));
  const newLicenses = submissions.filter(s => s.submission_type?.toLowerCase().includes('new'));
  const renewalRate = submissions.length > 0 ? (renewals.length / submissions.length) * 100 : 0;

  // Monthly breakdown
  const monthlyMap = new Map<string, { renewals: number; newLicenses: number }>();
  submissions.forEach(s => {
    if (s.submitted_at) {
      const date = parseISO(s.submitted_at);
      if (isValid(date)) {
        const monthKey = format(date, 'yyyy-MM');
        const existing = monthlyMap.get(monthKey) || { renewals: 0, newLicenses: 0 };
        
        if (s.submission_type?.toLowerCase().includes('renewal')) {
          existing.renewals++;
        } else if (s.submission_type?.toLowerCase().includes('new')) {
          existing.newLicenses++;
        }
        
        monthlyMap.set(monthKey, existing);
      }
    }
  });

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .map(([monthKey, data]) => ({
      month: format(parseISO(`${monthKey}-01`), 'MMM yyyy'),
      renewals: data.renewals,
      newLicenses: data.newLicenses,
      total: data.renewals + data.newLicenses
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Location breakdown
  const locationMap = new Map<string, { renewals: number; newLicenses: number }>();
  submissions.forEach(s => {
    const location = s.dispensary_location || 'Unknown';
    const existing = locationMap.get(location) || { renewals: 0, newLicenses: 0 };
    
    if (s.submission_type?.toLowerCase().includes('renewal')) {
      existing.renewals++;
    } else if (s.submission_type?.toLowerCase().includes('new')) {
      existing.newLicenses++;
    }
    
    locationMap.set(location, existing);
  });

  const topLocations = Array.from(locationMap.entries())
    .map(([location, data]) => ({
      location,
      renewals: data.renewals,
      newLicenses: data.newLicenses,
      total: data.renewals + data.newLicenses
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Status breakdown
  const statusMap = new Map<string, number>();
  submissions.forEach(s => {
    const status = s.status || 'Unknown';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: (count / submissions.length) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Payment status breakdown
  const paymentMap = new Map<string, number>();
  submissions.forEach(s => {
    const status = s.order_payment_status || 'Unknown';
    paymentMap.set(status, (paymentMap.get(status) || 0) + 1);
  });

  const paymentStatusBreakdown = Array.from(paymentMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: (count / submissions.length) * 100
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSubmissions: submissions.length,
    renewalSubmissions: renewals.length,
    newLicenseSubmissions: newLicenses.length,
    renewalRate,
    monthlyBreakdown,
    topLocations,
    statusBreakdown,
    paymentStatusBreakdown
  };
}

// NEW FUNCTIONS FOR ENHANCED DASHBOARD OPERATIONS

// UPDATED: Fetch critical expiration stats using pre-calculated data
export async function fetchCriticalExpirationStats(): Promise<CriticalExpirationStats> {
  try {
    console.log('[fetchCriticalExpirationStats] Using pre-calculated stats...');
    
    // Use RPC function to get pre-calculated stats
    const { data, error } = await supabase.rpc('get_dashboard_expiration_stats');
    
    if (error) {
      console.error('[fetchCriticalExpirationStats] RPC Error:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[fetchCriticalExpirationStats] No data returned from RPC');
      return {
        expiringNext7Days: 0,
        expiringNext48Hours: 0,
        expiringToday: 0,
        expiredYesterday: 0
      };
    }
    
    console.log('[fetchCriticalExpirationStats] Pre-calculated stats retrieved:', data);
    
    return {
      expiringNext7Days: data.expiringNext7Days || 0,
      expiringNext48Hours: data.expiringNext48Hours || 0,
      expiringToday: data.expiringToday || 0,
      expiredYesterday: 0 // Not included in current pre-calculated stats
    };
    
  } catch (error) {
    console.error('[fetchCriticalExpirationStats] Error:', error);
    return {
      expiringNext7Days: 0,
      expiringNext48Hours: 0,
      expiringToday: 0,
      expiredYesterday: 0
    };
  }
}

// UPDATED: Fetch today's processing stats using separate processing table
export async function fetchTodayProcessingStats(): Promise<TodayProcessingStats> {
  try {
    console.log('[fetchTodayProcessingStats] Using pre-calculated processing stats...');
    
    const { data, error } = await supabase.rpc('get_dashboard_processing_stats');
    
    if (error) {
      console.error('[fetchTodayProcessingStats] RPC Error:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[fetchTodayProcessingStats] No data returned from RPC');
      return {
        renewalsCompletedToday: 0,
        newLicensesProcessedToday: 0,
        totalProcessedToday: 0,
        pendingToday: 0,
        renewalsSubmittedToday: 0,
        newLicensesSubmittedToday: 0,
        totalSubmittedToday: 0,
        processingRatePercentage: 0,
        inProgressSubmissionsToday: 0,
        reviewSubmissionsToday: 0,
        failedSubmissionsToday: 0
      };
    }
    
    console.log('[fetchTodayProcessingStats] Pre-calculated processing stats:', data);
    
    return {
      renewalsCompletedToday: data.renewalsProcessedToday || 0,
      newLicensesProcessedToday: data.newLicensesProcessedToday || 0,
      totalProcessedToday: data.totalProcessedToday || 0,
      pendingToday: data.pendingSubmissionsToday || 0,
      // Ahora incluimos las propiedades de submissions recibidas
      renewalsSubmittedToday: data.renewalsSubmittedToday || 0,
      newLicensesSubmittedToday: data.newLicensesSubmittedToday || 0,
      totalSubmittedToday: data.totalSubmittedToday || 0,
      processingRatePercentage: data.processingRatePercentage || 0,
      inProgressSubmissionsToday: data.inProgressSubmissionsToday || 0,
      reviewSubmissionsToday: data.reviewSubmissionsToday || 0,
      failedSubmissionsToday: data.failedSubmissionsToday || 0
    };
    
  } catch (error) {
    console.error('[fetchTodayProcessingStats] Error:', error);
    return {
      renewalsCompletedToday: 0,
      newLicensesProcessedToday: 0,
      totalProcessedToday: 0,
      pendingToday: 0,
      renewalsSubmittedToday: 0,
      newLicensesSubmittedToday: 0,
      totalSubmittedToday: 0,
      processingRatePercentage: 0,
      inProgressSubmissionsToday: 0,
      reviewSubmissionsToday: 0,
      failedSubmissionsToday: 0
    };
  }
}

// NEW: Combined dashboard stats interface
export interface CombinedDashboardStats {
  expiration: DashboardExpirationCardStats & CriticalExpirationStats;
  processing: TodayProcessingStats & {
    renewalsSubmittedToday: number;
    newLicensesSubmittedToday: number;
    totalSubmittedToday: number;
    processingRatePercentage: number;
    inProgressSubmissionsToday: number;
    reviewSubmissionsToday: number;
    failedSubmissionsToday: number;
  };
}

// OPTIMAL: Single function to get all dashboard stats
export async function fetchAllDashboardStats(): Promise<CombinedDashboardStats> {
  try {
    console.log('[fetchAllDashboardStats] Using combined pre-calculated stats...');
    
    const { data, error } = await supabase.rpc('get_dashboard_all_stats');
    
    if (error) {
      console.error('[fetchAllDashboardStats] RPC Error:', error);
      throw error;
    }
    
    if (!data?.expirationStats || !data?.processingStats) {
      console.warn('[fetchAllDashboardStats] Incomplete data returned from RPC');
      throw new Error('Incomplete dashboard data');
    }
    
    const expStats = data.expirationStats;
    const procStats = data.processingStats;
    
    console.log('[fetchAllDashboardStats] Combined stats retrieved successfully');
    
    return {
      expiration: {
        // Expiration card stats
        expiredPatients: expStats.expiredPatients || 0,
        expiringIn30Days: expStats.expiringIn30Days || 0,
        expiringIn60Days: expStats.expiringIn60Days || 0,
        expiringIn90Days: expStats.expiringIn90Days || 0,
        renewalRatePercentage: expStats.renewalRatePercentage || 0,
        // Critical stats
        expiringNext7Days: expStats.expiringNext7Days || 0,
        expiringNext48Hours: expStats.expiringNext48Hours || 0,
        expiringToday: expStats.expiringToday || 0,
        expiredYesterday: 0
      },
      processing: {
        // Today processing stats
        renewalsCompletedToday: procStats.renewalsProcessedToday || 0,
        newLicensesProcessedToday: procStats.newLicensesProcessedToday || 0,
        totalProcessedToday: procStats.totalProcessedToday || 0,
        pendingToday: procStats.pendingSubmissionsToday || 0,
        // Additional processing stats
        renewalsSubmittedToday: procStats.renewalsSubmittedToday || 0,
        newLicensesSubmittedToday: procStats.newLicensesSubmittedToday || 0,
        totalSubmittedToday: procStats.totalSubmittedToday || 0,
        processingRatePercentage: procStats.processingRatePercentage || 0,
        inProgressSubmissionsToday: procStats.inProgressSubmissionsToday || 0,
        reviewSubmissionsToday: procStats.reviewSubmissionsToday || 0,
        failedSubmissionsToday: procStats.failedSubmissionsToday || 0
      }
    };
    
  } catch (error) {
    console.error('[fetchAllDashboardStats] Error, falling back to individual calls:', error);
    
    // Fallback: llamar funciones individuales
    const [expirationStats, criticalStats, processingStats] = await Promise.allSettled([
      fetchDashboardExpirationCardStats(),
      fetchCriticalExpirationStats(), 
      fetchTodayProcessingStats()
    ]);
    
    return {
      expiration: {
        ...(expirationStats.status === 'fulfilled' ? expirationStats.value : {
          expiredPatients: 0, expiringIn30Days: 0, expiringIn60Days: 0, 
          expiringIn90Days: 0, renewalRatePercentage: 0
        }),
        ...(criticalStats.status === 'fulfilled' ? criticalStats.value : {
          expiringNext7Days: 0, expiringNext48Hours: 0, expiringToday: 0, expiredYesterday: 0
        })
      },
      processing: {
        ...(processingStats.status === 'fulfilled' ? processingStats.value : {
          renewalsCompletedToday: 0, newLicensesProcessedToday: 0, 
          totalProcessedToday: 0, pendingToday: 0
        }),
        renewalsSubmittedToday: 0,
        newLicensesSubmittedToday: 0,
        totalSubmittedToday: 0,
        processingRatePercentage: 0,
        inProgressSubmissionsToday: 0,
        reviewSubmissionsToday: 0,
        failedSubmissionsToday: 0
      }
    };
  }
}

// Functions to manually refresh stats
export async function refreshExpirationStats(): Promise<void> {
  try {
    console.log('[refreshExpirationStats] Forcing expiration stats recalculation...');
    const { error } = await supabase.rpc('refresh_dashboard_expiration_stats');
    if (error) throw error;
    console.log('[refreshExpirationStats] Expiration stats refreshed successfully');
  } catch (error) {
    console.error('[refreshExpirationStats] Error:', error);
    throw new Error('Failed to refresh expiration statistics');
  }
}

export async function refreshProcessingStats(): Promise<void> {
  try {
    console.log('[refreshProcessingStats] Forcing processing stats recalculation...');
    const { error } = await supabase.rpc('refresh_dashboard_processing_stats');
    if (error) throw error;
    console.log('[refreshProcessingStats] Processing stats refreshed successfully');
  } catch (error) {
    console.error('[refreshProcessingStats] Error:', error);
    throw new Error('Failed to refresh processing statistics');
  }
}

export async function refreshAllDashboardStats(): Promise<void> {
  try {
    console.log('[refreshAllDashboardStats] Refreshing all dashboard stats...');
    await Promise.all([
      refreshExpirationStats(),
      refreshProcessingStats()
    ]);
    console.log('[refreshAllDashboardStats] All stats refreshed successfully');
  } catch (error) {
    console.error('[refreshAllDashboardStats] Error:', error);
    throw new Error('Failed to refresh dashboard statistics');
  }
}

// Fetch dispensary performance analytics

// OPTIMIZED: Fetch dispensary performance analytics using pre-calculated stats
export async function fetchDispensaryPerformanceStats(): Promise<DispensaryPerformance[]> {
  try {
    console.log('[fetchDispensaryPerformanceStats] Using pre-calculated dispensary performance stats...');
    
    // Use RPC function to get pre-calculated stats (3-month period)
    const { data, error } = await supabase.rpc('get_dispensary_performance_stats');
    
    if (error) {
      console.error('[fetchDispensaryPerformanceStats] RPC Error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('[fetchDispensaryPerformanceStats] No performance data returned');
      return [];
    }
    
    console.log(`[fetchDispensaryPerformanceStats] Retrieved ${data.length} dispensary performance records`);
    
    // Transform data to match interface
    const performanceStats: DispensaryPerformance[] = data.map(stat => ({
      dispensaryName: stat.dispensary_name,
      renewalRate: Number(stat.renewal_rate) || 0,
      totalRenewals: stat.total_renewals || 0,
      totalNewLicenses: stat.total_new_licenses || 0,
      totalSubmissions: stat.total_submissions || 0,
      avgProcessingDays: Number(stat.avg_processing_days) || 0,
      pendingCount: stat.pending_count || 0
    }));
    
    console.log('[fetchDispensaryPerformanceStats] Optimized performance stats:', performanceStats.slice(0, 3));
    return performanceStats;
    
  } catch (error) {
    console.error('[fetchDispensaryPerformanceStats] Error with pre-calculated stats, falling back to live calculation:', error);
    
    // Fallback: Use improved live calculation with 3-month period
    return await fetchDispensaryPerformanceStatsLive();
  }
}

// ENHANCED: Fallback function with improved live calculation
async function fetchDispensaryPerformanceStatsLive(): Promise<DispensaryPerformance[]> {
  try {
    const currentDate = new Date();
    const threeMonthsAgo = subMonths(currentDate, 3); // IMPROVED: 3 months instead of 1
    
    console.log('[fetchDispensaryPerformanceStatsLive] Analyzing performance from:', format(threeMonthsAgo, 'yyyy-MM-dd'), 'to', format(currentDate, 'yyyy-MM-dd'));

    // Get all submissions for performance analysis with improved query
    const { data: submissions, error: submissionsError } = await supabase
      .from('license_submissions')
      .select('dispensary_location, submission_type, submitted_at, processed_at, status')
      .gte('submitted_at', threeMonthsAgo.toISOString())
      .lte('submitted_at', currentDate.toISOString());

    if (submissionsError) throw submissionsError;

    if (!submissions || submissions.length === 0) {
      console.warn('[fetchDispensaryPerformanceStatsLive] No submissions found for 3-month period');
      return [];
    }

    console.log(`[fetchDispensaryPerformanceStatsLive] Found ${submissions.length} submissions for analysis`);

    const performanceMap = new Map<string, {
      renewals: number;
      newLicenses: number;
      totalSubmissions: number;
      totalProcessingDays: number;
      processedCount: number;
      pending: number;
    }>();

    // Process submissions by location with improved logic
    submissions.forEach(sub => {
      const location = sub.dispensary_location || 'Unknown Location';
      const existing = performanceMap.get(location) || {
        renewals: 0,
        newLicenses: 0,
        totalSubmissions: 0,
        totalProcessingDays: 0,
        processedCount: 0,
        pending: 0
      };

      existing.totalSubmissions++;
      
      // IMPROVED: Better type detection
      const submissionType = sub.submission_type?.toLowerCase() || '';
      if (submissionType.includes('renewal')) {
        existing.renewals++;
      } else if (submissionType.includes('new')) {
        existing.newLicenses++;
      }

      // IMPROVED: More flexible processing time calculation
      const validProcessedStatuses = ['PROCESSED', 'COMPLETED', 'APPROVED', 'FINISHED', 'SUCCESS'];
      if (validProcessedStatuses.includes(sub.status) && sub.submitted_at && sub.processed_at) {
        const submitted = parseISO(sub.submitted_at);
        const processed = parseISO(sub.processed_at);
        if (isValid(submitted) && isValid(processed)) {
          const processingDays = differenceInDays(processed, submitted);
          if (processingDays >= 0) { // Only count positive processing times
            existing.totalProcessingDays += processingDays;
            existing.processedCount++;
          }
        }
      }
      
      // IMPROVED: Better pending status detection
      const pendingStatuses = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'SUBMITTED', 'AWAITING_REVIEW'];
      if (pendingStatuses.includes(sub.status)) {
        existing.pending++;
      }

      performanceMap.set(location, existing);
    });

    // Convert to array with calculated metrics
    const performanceStats: DispensaryPerformance[] = Array.from(performanceMap.entries())
      .map(([location, data]) => {
        const renewalRate = data.totalSubmissions > 0 
          ? (data.renewals / data.totalSubmissions) * 100 
          : 0;
        const avgProcessingDays = data.processedCount > 0 
          ? data.totalProcessingDays / data.processedCount 
          : 0;

        return {
          dispensaryName: location,
          renewalRate: Math.round(renewalRate * 10) / 10, // Round to 1 decimal
          totalRenewals: data.renewals,
          totalNewLicenses: data.newLicenses,
          totalSubmissions: data.totalSubmissions,
          avgProcessingDays: Math.round(avgProcessingDays * 10) / 10,
          pendingCount: data.pending
        };
      })
      .sort((a, b) => b.totalSubmissions - a.totalSubmissions); // Sort by volume

    console.log('[fetchDispensaryPerformanceStatsLive] Live calculation completed:', performanceStats.length, 'dispensaries');
    return performanceStats;

  } catch (error) {
    console.error('[fetchDispensaryPerformanceStatsLive] Error:', error);
    return [];
  }
}

// NEW: Function to refresh dispensary performance stats manually
export async function refreshDispensaryPerformanceStats(): Promise<void> {
  try {
    console.log('[refreshDispensaryPerformanceStats] Forcing dispensary performance recalculation...');
    const { data, error } = await supabase.rpc('refresh_dispensary_performance_stats');
    if (error) throw error;
    console.log('[refreshDispensaryPerformanceStats] Stats refreshed:', data);
  } catch (error) {
    console.error('[refreshDispensaryPerformanceStats] Error:', error);
    throw new Error('Failed to refresh dispensary performance statistics');
  }
}

// NEW: Function to get dispensary performance summary
export async function fetchDispensaryPerformanceSummary(): Promise<{
  totalDispensaries: number;
  bestRenewalRate: number;
  bestRenewalDispensary: string;
  mostActiveCount: number;
  mostActiveDispensary: string;
  avgProcessingDaysOverall: number;
  totalSubmissionsPeriod: number;
  periodStart: string;
  periodEnd: string;
}> {
  try {
    console.log('[fetchDispensaryPerformanceSummary] Getting performance summary...');
    
    const { data, error } = await supabase.rpc('get_dispensary_performance_summary');
    
    if (error) {
      console.error('[fetchDispensaryPerformanceSummary] RPC Error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return {
        totalDispensaries: 0,
        bestRenewalRate: 0,
        bestRenewalDispensary: 'N/A',
        mostActiveCount: 0,
        mostActiveDispensary: 'N/A',
        avgProcessingDaysOverall: 0,
        totalSubmissionsPeriod: 0,
        periodStart: '',
        periodEnd: ''
      };
    }
    
    const summary = data[0];
    
    return {
      totalDispensaries: summary.total_dispensaries || 0,
      bestRenewalRate: Number(summary.best_renewal_rate) || 0,
      bestRenewalDispensary: summary.best_renewal_dispensary || 'N/A',
      mostActiveCount: summary.most_active_count || 0,
      mostActiveDispensary: summary.most_active_dispensary || 'N/A',
      avgProcessingDaysOverall: Number(summary.avg_processing_days_overall) || 0,
      totalSubmissionsPeriod: summary.total_submissions_period || 0,
      periodStart: summary.period_start || '',
      periodEnd: summary.period_end || ''
    };
    
  } catch (error) {
    console.error('[fetchDispensaryPerformanceSummary] Error:', error);
    return {
      totalDispensaries: 0,
      bestRenewalRate: 0,
      bestRenewalDispensary: 'N/A',
      mostActiveCount: 0,
      mostActiveDispensary: 'N/A',
      avgProcessingDaysOverall: 0,
      totalSubmissionsPeriod: 0,
      periodStart: '',
      periodEnd: ''
    };
  }
}