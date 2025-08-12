# Database Configuration Setup

## Overview
This project supports multiple BioTrack databases. Database credentials are configured through environment variables to maintain security.

## Environment Variables Required

### BioTrack Database 1 (Encanto Tree OG)
```bash
BIOTRACK_HOST_1=64.89.2.20
BIOTRACK_PORT_1=5432
BIOTRACK_DATABASE_1=biotrackthc
BIOTRACK_USER_1=egro
BIOTRACK_PASSWORD_1=swfCi2i4R7NSuEe64TD40qYDuud
```

### BioTrack Database 2 (Botanik LA MUDA)
```bash
BIOTRACK_HOST_2=173.239.206.254
BIOTRACK_PORT_2=5432
BIOTRACK_DATABASE_2=biotrackthc
BIOTRACK_USER_2=egro
BIOTRACK_PASSWORD_2=0TZ1ecWY9xzi3eCltpc1CaJvJ6L
```

### BioTrack Database 3 (New Encanto)
```bash
BIOTRACK_HOST_3=64.89.2.17
BIOTRACK_PORT_3=5432
BIOTRACK_DATABASE_3=biotrackthc
BIOTRACK_USER_3=egro
BIOTRACK_PASSWORD_3=rMbIHcXYW652iWzWX6Vo5Zx0uN7
```

## Setup Instructions

1. **Local Development**: Create a `.env.local` file in your project root with the above variables
2. **Production/Amplify**: Set these environment variables in your deployment platform
3. **Never commit the actual credentials to version control**

## File Structure
- `src/lib/database-config.template.ts` - Template file (safe to commit)
- `src/lib/database-config.ts` - Actual config file (ignored by Git, contains real credentials)

## Security Notes
- Database passwords are never stored in the repository
- Use environment variables for all sensitive configuration
- The template file provides a safe reference for setup
