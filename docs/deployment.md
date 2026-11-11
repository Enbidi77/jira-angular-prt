# Production Deployment Guide

## Architecture

The Kite platform compiles to a static Single Page Application (SPA) bundle that can be served from any CDN or web server (Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront, or NGINX Docker container) and communicates directly with Supabase Cloud or a self-hosted Supabase instance.

## 1. Supabase Cloud Setup

1. Create a new Supabase project at [database.new](https://database.new).
2. Link your local project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
3. Push database migrations:
   ```bash
   supabase db push
   ```

## 2. Frontend Production Build

Execute the production build script:

```bash
pnpm build
```

This compiles optimized bundles to `dist/apps/web/browser` with cache-busting hashes and minimal payload transfer sizes.

## 3. Environment Variables for Production

Ensure the following variables are provided in your hosting environment:

- `SUPABASE_URL`: Your Supabase Project URL (`https://xyzcompany.supabase.co`)
- `SUPABASE_ANON_KEY`: Your Supabase public anonymous key
