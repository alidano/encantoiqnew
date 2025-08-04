# DELETED - Patient Import API has been replaced by automatic BioTrack synchronization

This directory has been removed because:
- Patient import API is no longer needed
- Use `/api/sync/biotrack` instead for automatic synchronization
- Only customers with licenses expiring in the next 6 months are synced

## Migration completed on August 4, 2025

New endpoints:
- `POST /api/sync/biotrack` - Sync customers and locations from BioTrack
- `GET /api/sync/biotrack` - Check connection status and table counts
