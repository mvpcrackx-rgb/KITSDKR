-- KITS DKR : schéma, sécurité (RLS) et stockage. À exécuter une fois dans Supabase > SQL Editor.
create extension if not exists pgcrypto;

-- 1. Administrateurs (aucune inscription publique : la table n'a aucune policy d'écriture)
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

drop policy if exists "admin lit sa ligne" on public.admins;
create policy "admin lit sa ligne" on public.admins for select using (user_id = auth.uid());

-- 2. Produits (aucune donnée insérée : catalogue vide au départ)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  category text not null check (category in ('club','national')),
  season text,
  version text not null default 'Fan',
  description text,
  price integer not null check (price >= 0),
  images text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.product_sizes (
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  stock integer not null default 0 check (stock >= 0),
  primary key (product_id, size)
);
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;

drop policy if exists "lecture produits actifs" on public.products;
create policy "lecture produits actifs" on public.products for select using (active or public.is_admin());
drop policy if exists "admin gère produits" on public.products;
create policy "admin gère produits" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lecture tailles" on public.product_sizes;
create policy "lecture tailles" on public.product_sizes for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.active));
drop policy if exists "admin gère tailles" on public.product_sizes;
create policy "admin gère tailles" on public.product_sizes for all using (public.is_admin()) with check (public.is_admin());

-- 3. Commandes (aucun accès direct pour les clients : ils passent par place_order)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  customer_name text not null,
  phone text not null,
  address text,
  notes text,
  total integer not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null
);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "admin gère commandes" on public.orders;
create policy "admin gère commandes" on public.orders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin gère lignes" on public.order_items;
create policy "admin gère lignes" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- 4. Création de commande : les prix et le total viennent TOUJOURS de la base
create or replace function public.place_order(p_name text, p_phone text, p_address text, p_notes text, p_items jsonb)
returns table (o_number bigint, o_total integer)
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_num bigint; v_total integer := 0; it jsonb; pr public.products; v_stock integer; v_qty integer;
begin
  if length(trim(coalesce(p_name,''))) < 2 or length(trim(coalesce(p_phone,''))) < 6 then
    raise exception 'Nom et téléphone requis';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Panier invalide';
  end if;
  insert into public.orders (customer_name, phone, address, notes)
    values (left(trim(p_name),120), left(trim(p_phone),40), left(p_address,300), left(p_notes,500))
    returning id, number into v_id, v_num;
  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it->>'quantity')::int;
    if v_qty < 1 or v_qty > 20 then raise exception 'Quantité invalide'; end if;
    select * into pr from public.products where id = (it->>'product_id')::uuid and active;
    if not found then raise exception 'Produit indisponible'; end if;
    select stock into v_stock from public.product_sizes where product_id = pr.id and size = it->>'size';
    if v_stock is null or v_stock < v_qty then
      raise exception 'Stock insuffisant : % (%)', pr.name, it->>'size';
    end if;
    insert into public.order_items (order_id, product_id, product_name, size, quantity, unit_price)
      values (v_id, pr.id, pr.name, it->>'size', v_qty, pr.price);
    v_total := v_total + pr.price * v_qty;
  end loop;
  update public.orders set total = v_total where id = v_id;
  return query select v_num, v_total;
end $$;
revoke all on function public.place_order(text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,jsonb) to anon, authenticated;

-- 5. Le stock baisse quand une commande quitte l'état « en attente »
create or replace function public.decrement_stock() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.status = 'pending' and new.status in ('confirmed','shipped','delivered') then
    update public.product_sizes ps set stock = greatest(ps.stock - oi.quantity, 0)
    from public.order_items oi
    where oi.order_id = new.id and ps.product_id = oi.product_id and ps.size = oi.size;
  end if;
  return new;
end $$;
drop trigger if exists trg_decrement_stock on public.orders;
create trigger trg_decrement_stock after update of status on public.orders
  for each row execute function public.decrement_stock();

-- 6. Stockage des photos : lecture publique, écriture réservée à l'admin
insert into storage.buckets (id, name, public) values ('product-images','product-images', true)
  on conflict (id) do nothing;
drop policy if exists "photos lecture" on storage.objects;
create policy "photos lecture" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "photos ajout admin" on storage.objects;
create policy "photos ajout admin" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "photos modif admin" on storage.objects;
create policy "photos modif admin" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "photos suppression admin" on storage.objects;
create policy "photos suppression admin" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());

-- 7. VOUS devenez administrateur : créez d'abord votre utilisateur (Authentication > Users),
--    puis exécutez ceci séparément en remplaçant l'e-mail.
-- insert into public.admins (user_id) select id from auth.users where email = 'VOTRE_EMAIL@exemple.com';
