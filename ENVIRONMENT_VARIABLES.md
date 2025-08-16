# Environment Variables Configuration

## Overview
This document describes all environment variables required for the EncantoIQ application to function properly in both local development and production (AWS Amplify).

## BioTrack Database Configurations

### Encanto Tree OG Server
```bash
BIOTRACK_ENCANTO_TREE_OG_HOST=64.89.2.20
BIOTRACK_ENCANTO_TREE_OG_PORT=5432
BIOTRACK_ENCANTO_TREE_OG_DATABASE=biotrackthc
BIOTRACK_ENCANTO_TREE_OG_USER=egro
BIOTRACK_ENCANTO_TREE_OG_PASSWORD=YOUR_PASSWORD_HERE
```

### Botanik (LA MUDA) Server
```bash
BIOTRACK_BOTANIK_LA_MUDA_HOST=173.239.206.254
BIOTRACK_BOTANIK_LA_MUDA_PORT=5432
BIOTRACK_BOTANIK_LA_MUDA_DATABASE=biotrackthc
BIOTRACK_BOTANIK_LA_MUDA_USER=egro
BIOTRACK_BOTANIK_LA_MUDA_PASSWORD=YOUR_PASSWORD_HERE
```

### New Encanto Server
```bash
BIOTRACK_NEW_ENCANTO_HOST=64.89.2.17
BIOTRACK_NEW_ENCANTO_PORT=5432
BIOTRACK_NEW_ENCANTO_DATABASE=biotrackthc
BIOTRACK_NEW_ENCANTO_USER=egro
BIOTRACK_NEW_ENCANTO_PASSWORD=YOUR_PASSWORD_HERE
```

## WATI WhatsApp Integration
```bash
WATI_API_ENDPOINT=https://live-mt-server.wati.io/450288
WATI_AUTH_TOKEN=YOUR_WATI_JWT_TOKEN_HERE
```

## Firebase Configuration
```bash
FIREBASE_CLIENT_EMAIL=YOUR_FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY=YOUR_FIREBASE_PRIVATE_KEY
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
```

## Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

## Other Services
```bash
MAILWIZZ_API_KEY=YOUR_MAILWIZZ_API_KEY
MAILWIZZ_API_URL=YOUR_MAILWIZZ_API_URL
MAILWIZZ_DEFAULT_LIST_ID=YOUR_MAILWIZZ_LIST_ID
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
TELNYX_API_KEY=YOUR_TELNYX_API_KEY
TELNYX_APPLICATION_ID=YOUR_TELNYX_APP_ID
TELNYX_FROM_NUMBER=YOUR_TELNYX_PHONE_NUMBER
```

## Local Development Setup

1. Copy the variables above to a `.env.local` file in your project root
2. Replace `YOUR_*` placeholders with actual values from your `.env` file
3. For local development, the hardcoded values in `database-config.ts` will be used as fallbacks
4. The application will prioritize environment variables over hardcoded values

## Production (AWS Amplify) Setup

1. Add all variables to Amplify Console > Environment Variables
2. Replace `YOUR_*` placeholders with actual values
3. Ensure all variables are set to "All branches" or your specific branch
4. Variables will override hardcoded values in production

## Testing Environment Variables

Use the `/api/test-env` endpoint to verify that all variables are properly configured in your environment.

## Important Notes

- **WATI_AUTH_TOKEN**: Do NOT include "Bearer " prefix in the value
- **BioTrack servers**: May not be accessible from AWS Amplify due to network restrictions
- **Local development**: Uses hardcoded values as fallbacks for convenience
- **Production**: Requires all environment variables to be properly configured
- **Security**: Never commit actual API keys or secrets to version control
