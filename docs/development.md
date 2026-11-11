# Local Development Workflow

## Prerequisites

- Node.js 22+ (tested on Node 24)
- pnpm 10+
- Docker (for running local Supabase stack)
- Supabase CLI

## Quick Start

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

3. **Start Local Supabase Stack**:

   ```bash
   pnpm supabase:start
   ```

4. **Apply Migrations and Seed Demo Data**:

   ```bash
   pnpm db:reset
   ```

5. **Start Frontend Development Server**:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:4200` in your browser.

## Testing

- **Unit Tests**: `pnpm test`
- **End-to-End Tests**: `pnpm test:e2e`
- **Linting**: `pnpm lint`
- **Type Checking**: `pnpm typecheck`
