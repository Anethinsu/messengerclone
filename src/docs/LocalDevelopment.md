# Local Development Guide

## Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm
- Git

## Setting Up the Project

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

## Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project dashboard under Project Settings > API.

## Supabase Local Development

### Option 1: Connect to Production Supabase (Recommended for Beginners)

This is the simplest approach - you'll use your production Supabase instance for local development.

1. Make sure your `.env` file contains the correct Supabase URL and anon key from your production project.
2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

### Option 2: Run Supabase Locally (Advanced)

For more advanced development, you can run Supabase locally using Docker.

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start Supabase locally:
   ```bash
   supabase start
   ```

3. Update your `.env` file with the local Supabase URL and anon key:
   ```
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=<local-anon-key>
   ```

4. Apply migrations to your local Supabase instance:
   ```bash
   supabase db reset
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

## Common Issues and Solutions

### Authentication Issues

- **Problem**: Unable to sign in or authenticate with Supabase.
- **Solution**: 
  - Double-check your Supabase URL and anon key in the `.env` file.
  - Make sure you've created users in your Supabase instance.
  - Check if email confirmation is required in your Supabase auth settings.

### Database Connection Issues

- **Problem**: Cannot connect to the database or queries fail.
- **Solution**:
  - Verify your Supabase URL and anon key.
  - Check if your IP is allowed in Supabase's API settings.
  - Ensure the required tables exist in your database.
  - Check Row Level Security (RLS) policies if you're getting permission errors.

### Missing Tables or Columns

- **Problem**: Queries fail due to missing tables or columns.
- **Solution**:
  - Run the migrations to create the necessary database schema:
    ```bash
    # For production Supabase
    supabase db push
    
    # For local Supabase
    supabase db reset
    ```

## Debugging Tips

1. Use the browser console to check for errors.
2. Enable Supabase debugging by adding this to your code:
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       debug: true
     }
   })
   ```

3. Check the Supabase dashboard for logs and query history.

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
