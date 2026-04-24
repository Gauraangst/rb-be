create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text default '',
  password text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  price numeric(12, 2) not null,
  original_price numeric(12, 2),
  category text not null,
  subcategory text,
  images jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  material text,
  is_bestseller boolean not null default false,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  stock integer not null default 0,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  location text,
  rating integer not null check (rating between 1 and 5),
  title text,
  text text not null,
  product_id uuid references public.products(id) on delete set null,
  is_verified boolean not null default false,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  order_number text not null unique,
  customer jsonb not null,
  order_items jsonb not null,
  shipping_address jsonb not null,
  payment_method text not null,
  payment_status text not null default 'Pending',
  payment_result jsonb,
  paid_at timestamptz,
  items_price numeric(12, 2) not null default 0,
  tax_price numeric(12, 2) not null default 0,
  shipping_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  status text not null default 'Pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_bestseller on public.products(is_bestseller);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_reviews_verified on public.reviews(is_verified);
