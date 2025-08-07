# Local Development Setup Guide

This guide will help you set up the complete local development environment for the Pacelane app, including React frontend, local Supabase backend, and Edge Functions.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- [Docker](https://www.docker.com/) (for running Supabase locally)
- API keys: OpenAI API key and Apify API key

## Setup Steps

### 1. Clone and Install Dependencies

```bash
git clone [your-repo-url]
cd pacelane-app
npm install
# or
yarn install
```
### 2. Initialize Supabase (First Time Only)

If this is your first time setting up the project, you need to initialize Supabase:

```bash
supabase init
```

This will create the necessary Supabase configuration files for local development.
### 2. Start Local Supabase

```bash
supabase start
```

This will start all Supabase services with Docker. Take note of the output, specifically:
- **API URL**: `http://127.0.0.1:54321`
- **anon key**: (long JWT token)

### 3. Create Local Environment File

Create `.env.local` in the project root:

```bash
# Supabase Local Development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_actual_local_anon_key_from_supabase_start_output

# API Keys for Edge Functions
OPENAI_API_KEY=your_openai_api_key_here
APIFY_API_KEY=your_apify_api_key_here
```

**Important**: Replace the values with:
- The actual `anon key` from the `supabase start` output
- Your real OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Your real Apify API key from [Apify Console](https://console.apify.com/account/integrations)

### 4. Set Up Database Schema

The migration files need to be properly named. If they have hyphens instead of underscores, rename them:

```bash
cd supabase/migrations

# Rename files to follow pattern: timestamp_description.sql
mv "20250724012300-[uuid].sql" "20250724012300_initial_schema.sql"
mv "20250724013843-[uuid].sql" "20250724013843_add_profiles.sql"
# ... (rename all migration files)

cd ../..
```

Then reset the database to apply all migrations:

```bash
supabase db reset
```

You should see all migrations being applied successfully.

### 5. Start Development Servers

You need to run **three** separate terminals:

#### Terminal 1: Supabase (if not already running)
```bash
supabase start
```

#### Terminal 2: Edge Functions
```bash
supabase functions serve --env-file .env.local
```

#### Terminal 3: Frontend
```bash
yarn dev
# or
npm run dev
```

## Accessing Your Local Environment

- **Frontend**: http://localhost:8080
- **Supabase API**: http://127.0.0.1:54321
- **Supabase Studio**: http://127.0.0.1:54323 (database management UI)
- **Mailcatcher**: http://127.0.0.1:54324 (for testing emails)

## Available Edge Functions

Your Edge Functions will be available at:
- `http://127.0.0.1:54321/functions/v1/ai-assistant`
- `http://127.0.0.1:54321/functions/v1/generate-content-suggestions`
- `http://127.0.0.1:54321/functions/v1/scrape-linkedin-profile`

## Verification

1. **Frontend Connection**: Check browser network tab - all API calls should go to `127.0.0.1:54321`
2. **Database**: User signup should work and redirect to onboarding (no eternal loading)
3. **Edge Functions**: LinkedIn profile scraping in onboarding should work without 500 errors
4. **Storage**: File uploads should work with local storage URLs

## Troubleshooting

### Edge Functions Not Loading Environment Variables
Make sure you're using the correct command:
```bash
supabase functions serve --env-file .env.local
```

### Frontend Still Hitting Production
- Verify `.env.local` has correct local URLs
- Restart your frontend dev server after changing `.env.local`

### Database Migration Issues
- Check that migration files follow the naming pattern: `timestamp_name.sql`
- Run `supabase db reset` to reapply all migrations

### 404 Errors on API Calls
- Ensure `supabase start` completed successfully
- Check that your `.env.local` file has the correct `VITE_SUPABASE_URL`

## Stopping Local Development

```bash
# Stop Supabase services
supabase stop

# Stop frontend and edge functions with Ctrl+C in their respective terminals
```

## Production Deployment

For production deployment, you'll need to:
1. Set up your production Supabase project
2. Deploy Edge Functions: `supabase functions deploy [function-name]`
3. Configure production environment variables
4. Deploy frontend with production Supabase URLs 