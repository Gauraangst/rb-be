# Supabase Setup

## 1) Create project

1. Create a Supabase project.
2. Open SQL Editor and run the schema from `server/supabase/schema.sql`.

## 2) Configure backend env

Set these in `server/.env` (or deployment provider env vars):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_TOKEN_SECRET`
- `CHECKOUT_TOKEN_SECRET`
- `CORS_ORIGIN`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## 3) Seed catalog data

From the `server` directory:

```bash
npm run seed
```

This seeds `products` and `reviews` from `server/data/store.json`.

## 4) Verify

Start backend:

```bash
npm start
```

Health check should report:

```json
{
  "status": "ok",
  "database": "connected"
}
```
