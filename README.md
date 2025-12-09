# Clean Photographer Photography Portfolio Template

A modern, responsive photography portfolio template built with React, TypeScript, and Supabase.

## Features

- 📸 Photo gallery with multiple categories (Selected, Commissioned, Editorial, Personal)
- 🔐 Admin dashboard for photo management
- 🎨 Clean, minimalist design
- 📱 Fully responsive
- 🚀 Fast and optimized with Vite
- 💾 Supabase backend for data storage and authentication

## Technologies Used

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn-ui components
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage)
- **Build Tool**: Vite
- **State Management**: TanStack React Query

## Prerequisites

- Node.js (v18 or higher) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn
- A Supabase account and project - [create one here](https://supabase.com)

## Setup Instructions

### 1. Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up Supabase

1. Create a new project at [Supabase](https://app.supabase.com)
2. Go to Project Settings > API to find your project credentials
3. Copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```
4. Update the `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"
   ```

### 4. Run database migrations

The SQL migration files are located in `supabase/migrations/`. You can apply them using the Supabase CLI or by running them directly in the SQL Editor in your Supabase dashboard:

**Option A: Using Supabase CLI** (Recommended)
```sh
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Apply migrations
supabase db push
```

**Option B: Manual SQL Execution**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/20251208080332_remix_migration_from_pg_dump.sql`
   - `supabase/migrations/20251208081442_25abee87-b56a-40c8-9af4-e7c2d206f677.sql`
   - `supabase/migrations/20251208093500_add_auto_user_role_trigger.sql`
4. Execute each query

### 5. Configure Authentication (Important!)

By default, Supabase requires email confirmation for new signups. To allow users to sign up and login immediately:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers** > **Email**
3. Disable the **"Confirm email"** toggle
4. Click **Save**

**Note**: This allows immediate access without email verification. If you want to enable email confirmation, see [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) for instructions on configuring SMTP.

### 6. Create an admin user

After setting up the database, you'll need to create an admin user:

1. Sign up through your application's admin login page (`/admin/login`)
2. You can login immediately (no email verification required)
3. New users are automatically added to the `user_roles` table with the 'user' role
4. To promote yourself to admin:
   - Find your user ID in the Supabase dashboard (Authentication > Users)
   - Run this SQL query in the SQL Editor:
   ```sql
   UPDATE public.user_roles
   SET role = 'admin'
   WHERE user_id = 'your-user-id-here';
   ```

### 7. Start the development server

```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Third-party integrations (Supabase)
│   ├── lib/             # Utility functions
│   └── services/        # API services
├── supabase/
│   ├── config.toml      # Supabase configuration
│   └── migrations/      # Database migration files
└── public/              # Static assets
```

## Deployment

This project can be deployed to any static hosting service:

### Vercel (Recommended)
1. Connect your GitHub repository for automatic deployments
2. Set your environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. The `vercel.json` configuration is already included to handle SPA routing

**Note**: The `vercel.json` file is crucial for proper routing. It ensures that direct navigation to routes like `/admin` works correctly by serving `index.html` for all routes and letting React Router handle client-side routing.

### Other Platforms
- **Netlify**: Create a `_redirects` file with `/* /index.html 200` or drag and drop the `dist` folder after building
- **GitHub Pages**: Use GitHub Actions for automated deployment with proper routing configuration
- **Cloudflare Pages**: Connect your repository for continuous deployment

Make sure to set your environment variables in your hosting platform's settings.

## Database Schema

The application uses the following main tables:

- `photos`: Stores photo metadata and URLs
- `user_roles`: Manages admin access control

Storage buckets:
- `photos`: Public bucket for storing photo files

## License

MIT
