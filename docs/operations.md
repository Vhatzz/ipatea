# Operations

## Environment
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public frontend variables.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only for Netlify Functions; never prefix it with `VITE_` and never expose it in browser code.
- Rotate any key that was pasted into chat, logs, tickets, or screenshots.

## Rate Limiting
- Buyer checkout goes through `netlify/functions/create-order.js`.
- The function passes an IP/user-agent key to `create_order_atomic`, which limits checkout attempts to 10 per 10 minutes in `rate_limits`.
- If abuse increases, move rate limiting to Netlify Edge, a managed WAF, or a dedicated store with stricter IP/device rules.

## Error Monitoring
- Frontend errors currently report through `src/utils/reportError.js` to `console.error`.
- For production monitoring, connect Sentry, Logtail, or another error pipeline and update `reportError` in one place.
- Check Netlify Function logs after deploy for checkout errors and Supabase RPC errors.

## Quota Alerts
- Enable Supabase project email alerts for database, auth, storage, and bandwidth usage.
- Enable Netlify deploy/function notifications and review function invocation/errors after each release.
- Review quota dashboards weekly during active use.

## Backup
- Use Supabase scheduled backups if available for the project plan.
- Before major schema changes, export a manual backup from Supabase Dashboard or run `pg_dump` from a trusted machine.
- Keep schema files in Git: `supabase/schema.sql` and `supabase/seed.sql`.

## Restore Test
- Create a temporary Supabase project.
- Run `supabase/schema.sql`.
- Restore/import a backup dump if available.
- Run `supabase/seed.sql` only for demo data, not over production data.
- Verify login, product read, checkout, stock decrement, stock movements, order lookup token, and admin reports.

## Core Web Vitals
- Use Lighthouse on the deployed Netlify URL in mobile mode.
- Record LCP, INP, CLS, TTFB, and total JS size after every major UI change.
- Use Chrome DevTools Performance panel for route-level profiling on `/`, `/menu`, and `/checkout`.

## Query Latency
- Measure from the expected customer region using browser DevTools Network tab on `/menu`, checkout, and admin dashboard.
- Compare Supabase project region with customer location; move/clone the project region if latency is consistently high.
- Track slow admin queries: dashboard order/product fetches, report fetches, and stock movement history.
